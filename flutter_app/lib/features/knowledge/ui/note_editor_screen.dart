import 'dart:async';
import 'dart:convert';

import 'package:dart_quill_delta/dart_quill_delta.dart';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart' show ImageSource;
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/knowledge/data/image_upload.dart';
import 'package:niwa/features/knowledge/data/link_providers.dart';
import 'package:niwa/features/knowledge/data/note_autosave.dart';
import 'package:niwa/features/knowledge/domain/pm_delta.dart';
import 'package:niwa/features/knowledge/domain/prosemirror_text.dart';
import 'package:niwa/features/knowledge/ui/link_picker.dart';
import 'package:niwa/features/knowledge/ui/note_embeds.dart';

/// `…/:itemId/edit`: the note body in flutter_quill, autosaved (MA6.P2).
class NoteEditorScreen extends ConsumerWidget {
  const new({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Only the first value seeds the editor; later ones just carry versions.
    final item = ref.watch(itemProvider(id));
    return switch (item) {
      AsyncData(:final value) => _Editor(key: ValueKey(id), item: value),
      AsyncError(:final error) => Scaffold(
        appBar: AppBar(),
        body: ErrorState(
          error: error,
          onRetry: () => ref.invalidate(itemProvider(id)),
        ),
      ),
      _ => Scaffold(appBar: AppBar(), body: const ListSkeleton()),
    };
  }
}

class _Editor extends ConsumerStatefulWidget {
  const new({required this.item, super.key});

  final Item item;

  @override
  ConsumerState<_Editor> createState() => _EditorState();
}

class _EditorState extends ConsumerState<_Editor> {
  late final ProviderContainer _container = ProviderScope.containerOf(
    context,
    listen: false,
  );
  late Map<String, dynamic>? _original = widget.item.content;
  late final QuillController _controller = QuillController(
    document: Document.fromDelta(pmToDelta(_original)),
    selection: const TextSelection.collapsed(offset: 0),
  );
  late final NoteAutosave _autosave = NoteAutosave(
    items: _container.read(itemsRepositoryProvider),
    item: widget.item,
    read: _read,
    onSaved: (saved) {
      _container
        ..invalidate(itemProvider(saved.id))
        ..invalidate(itemLinksProvider(saved.id));
    },
  );
  StreamSubscription<DocChange>? _changes;
  final _focus = FocusNode();

  Map<String, dynamic> _read() =>
      deltaToPm(_controller.document.toDelta(), original: _original);

  @override
  void initState() {
    super.initState();
    _listen();
    _autosave.addListener(() => setState(() {}));
  }

  void _listen() {
    unawaited(_changes?.cancel());
    _changes = _controller.document.changes.listen((change) {
      if (change.source != ChangeSource.local) return;
      _autosave.schedule();
      _maybeOpenLinkPicker(change.change);
    });
  }

  void _replaceDocument(Map<String, dynamic>? content) {
    _original = content;
    _controller.document = Document.fromDelta(pmToDelta(content));
    _listen();
  }

  @override
  void dispose() {
    // Save what's there before leaving; the autosave reads the document now.
    unawaited(_autosave.flush());
    unawaited(_changes?.cancel());
    _autosave.dispose();
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  /// Typing `[[` opens the picker, like the web suggestion.
  void _maybeOpenLinkPicker(Delta change) {
    final typed = change.operations.lastOrNull?.data;
    if (typed != '[') return;
    final offset = _controller.selection.baseOffset;
    final text = _controller.document.toPlainText();
    if (offset < 2 || text.substring(offset - 2, offset) != '[[') return;
    _controller.replaceText(
      offset - 2,
      2,
      '',
      TextSelection.collapsed(offset: offset - 2),
    );
    unawaited(_insertLink());
  }

  bool _uploading = false;

  /// Camera or gallery → alt text → signed upload → image block at the
  /// cursor, with the web's attributes so both editors see the same node.
  Future<void> _insertImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from photos'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;
    final snackbars = _container.read(snackbarsProvider);
    final PickedImage? picked;
    try {
      picked = await _container.read(imagePickerProvider).pick(source);
    } on Object {
      snackbars.show("Couldn't open the camera or photos.");
      return;
    }
    if (picked == null || !mounted) return;
    try {
      checkImage(picked);
    } on UploadError catch (e) {
      snackbars.show(e.message);
      return;
    }
    final alt = await _askAlt(altFromName(picked.name));
    if (alt == null || !mounted) return;
    final at = _controller.selection.baseOffset.clamp(
      0,
      _controller.document.length - 1,
    );
    setState(() => _uploading = true);
    try {
      final up = await uploadImage(
        uploads: _container.read(uploadsRepositoryProvider),
        cloudinary: _container.read(cloudinaryDioProvider),
        itemId: widget.item.id,
        image: picked,
      );
      if (!mounted) return;
      _controller.replaceText(
        at,
        0,
        BlockEmbed(
          NiwaEmbed.image,
          jsonEncode({
            'src': up.src,
            'alt': alt.isEmpty ? null : alt,
            'title': null,
            'width': null,
            'height': null,
            'attachmentId': up.attachment.id,
          }),
        ),
        TextSelection.collapsed(offset: at + 1),
      );
    } on UploadError catch (e) {
      snackbars.show(e.message);
    } on Object catch (e) {
      snackbars.show(messageOf(e));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  /// Alt text for screen readers; null = cancelled.
  Future<String?> _askAlt(String suggested) => showDialog<String>(
    context: context,
    builder: (_) => _AltTextDialog(suggested: suggested),
  );

  Future<void> _insertLink() async {
    final target = await showLinkPicker(context, excludeId: widget.item.id);
    if (target == null || !mounted) return;
    final at = _controller.selection.baseOffset.clamp(
      0,
      _controller.document.length - 1,
    );
    _controller
      ..replaceText(
        at,
        0,
        Embeddable(NiwaEmbed.link, jsonEncode(target.toAttrs())),
        null,
      )
      ..replaceText(at + 1, 0, ' ', TextSelection.collapsed(offset: at + 2));
    _focus.requestFocus();
  }

  /// Document offset of the heading with [anchorId] (its anchor embed).
  int? _offsetOf(String anchorId) {
    var offset = 0;
    for (final op in _controller.document.toDelta().operations) {
      final data = op.data;
      if (data is Map && data[NiwaEmbed.anchor] == anchorId) return offset;
      offset += op.length ?? 0;
    }
    return null;
  }

  Future<void> _showOutline() async {
    final headings = headingsOf(_read());
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: headings.isEmpty
            ? const Padding(
                padding: EdgeInsets.all(24),
                child: Text('Add headings to see an outline.'),
              )
            : ListView(
                shrinkWrap: true,
                children: [
                  for (final h in headings)
                    ListTile(
                      contentPadding: EdgeInsetsDirectional.only(
                        start: 16.0 * h.level,
                        end: 4,
                      ),
                      title: Text(h.text),
                      onTap: () {
                        Navigator.of(context).pop();
                        final at = _offsetOf(h.anchorId);
                        if (at != null) {
                          _controller.updateSelection(
                            TextSelection.collapsed(offset: at + 1),
                            ChangeSource.local,
                          );
                          _focus.requestFocus();
                        }
                      },
                      trailing: _controller.readOnly
                          ? null
                          : IconButton(
                              tooltip: 'Make “${h.text}” a child note',
                              icon: const Icon(Icons.call_split),
                              onPressed: () {
                                Navigator.of(context).pop();
                                unawaited(_promote(h));
                              },
                            ),
                    ),
                ],
              ),
      ),
    );
  }

  /// Promote a section to a child item (CONCEPT.md §4).
  Future<void> _promote(HeadingEntry h) async {
    await _autosave.flush();
    if (_autosave.status != SaveStatus.saved) return; // shown in the status
    final latest = await _container.read(itemProvider(widget.item.id).future);
    try {
      final res = await _container
          .read(itemsRepositoryProvider)
          .promoteSection(
            widget.item.id,
            version: latest.version,
            anchorId: h.anchorId,
          );
      if (!mounted) return;
      _replaceDocument(res.parent.content);
      _autosave.replacedWith(res.parent);
      _container.invalidate(treeProvider);
      _container
          .read(snackbarsProvider)
          .show('Moved “${h.text}” into a child note');
    } on Object catch (e) {
      _container.read(snackbarsProvider).show(messageOf(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    // Field edits elsewhere bump the version; keep saving against the latest.
    ref.listen(itemProvider(widget.item.id), (_, next) {
      if (next.value case final item?) _autosave.observeVersion(item.version);
    });
    final online = ref.watch(networkStatusProvider);
    final archived = widget.item.archivedAt != null;
    final conflict = _autosave.conflict;
    final imagesEnabled =
        ref.watch(uploadConfigProvider).value?.enabled ?? false;
    _controller.readOnly = archived || !online || conflict != null;

    return PopScope(
      onPopInvokedWithResult: (_, _) => unawaited(_autosave.flush()),
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.item.title, overflow: TextOverflow.ellipsis),
          actions: [
            _SaveStatusLabel(_autosave),
            IconButton(
              tooltip: 'Outline',
              icon: const Icon(Icons.toc),
              onPressed: _showOutline,
            ),
            if (!_controller.readOnly)
              IconButton(
                tooltip: 'Link to an item',
                icon: const Icon(Icons.link),
                onPressed: _insertLink,
              ),
            if (!_controller.readOnly && imagesEnabled)
              IconButton(
                tooltip: _uploading ? 'Uploading image…' : 'Add an image',
                icon: const Icon(Icons.add_photo_alternate_outlined),
                onPressed: _uploading ? null : _insertImage,
              ),
          ],
        ),
        body: Column(
          children: [
            if (conflict != null)
              MaterialBanner(
                content: const Text(
                  'This note was changed elsewhere while you were editing.',
                ),
                actions: [
                  TextButton(
                    onPressed: () {
                      final latest = _autosave.loadLatest();
                      if (latest != null) _replaceDocument(latest.content);
                    },
                    child: const Text('Load latest'),
                  ),
                  TextButton(
                    onPressed: _autosave.keepMine,
                    child: const Text('Keep mine'),
                  ),
                ],
              )
            else if (archived)
              const MaterialBanner(
                content: Text('Archived — unarchive it to edit.'),
                actions: [SizedBox.shrink()],
              )
            else if (!online)
              const MaterialBanner(
                content: Text("You're offline — editing needs a connection."),
                actions: [SizedBox.shrink()],
              ),
            if (!_controller.readOnly)
              QuillSimpleToolbar(
                controller: _controller,
                config: const QuillSimpleToolbarConfig(
                  multiRowsDisplay: false,
                  showFontFamily: false,
                  showFontSize: false,
                  showColorButton: false,
                  showBackgroundColorButton: false,
                  showLeftAlignment: false,
                  showCenterAlignment: false,
                  showRightAlignment: false,
                  showJustifyAlignment: false,
                  showListCheck: false,
                  showSearchButton: false,
                  showSubscript: false,
                  showSuperscript: false,
                ),
              ),
            if (_uploading)
              const LinearProgressIndicator(semanticsLabel: 'Uploading image')
            else
              const Divider(height: 1),
            Expanded(
              child: QuillEditor(
                controller: _controller,
                focusNode: _focus,
                scrollController: ScrollController(),
                config: QuillEditorConfig(
                  padding: const EdgeInsets.all(NiwaTokens.spacingUnit * 4),
                  placeholder: 'Write your notes…  Type [[ to link an item.',
                  embedBuilders: niwaEmbedBuilders(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SaveStatusLabel extends StatelessWidget {
  const new(this.autosave);

  final NoteAutosave autosave;

  @override
  Widget build(BuildContext context) {
    final secondary = NiwaColors.of(context).textSecondary;
    final error = Theme.of(context).colorScheme.error;
    final (text, color) = switch (autosave.status) {
      SaveStatus.saved => ('Saved', secondary),
      SaveStatus.dirty => ('Editing', secondary),
      SaveStatus.saving => ('Saving…', secondary),
      SaveStatus.offline => ('Not saved — offline', error),
      SaveStatus.error => ('Not saved', error),
      SaveStatus.conflict => ('Conflict', error),
    };
    return Center(
      child: Semantics(
        liveRegion: true,
        child: Tooltip(
          message: autosave.errorMessage ?? text,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(text, style: TextStyle(color: color, fontSize: 12)),
          ),
        ),
      ),
    );
  }
}

/// Owns its text controller, so it lives as long as the dialog (including
/// the closing animation).
class _AltTextDialog extends StatefulWidget {
  const new({required this.suggested});

  final String suggested;

  @override
  State<_AltTextDialog> createState() => _AltTextDialogState();
}

class _AltTextDialogState extends State<_AltTextDialog> {
  late final _controller = TextEditingController(text: widget.suggested);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Describe the image'),
    content: TextField(
      controller: _controller,
      autofocus: true,
      maxLength: 120,
      decoration: const InputDecoration(
        labelText: 'Alt text',
        helperText: 'Read aloud by screen readers.',
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.of(context).pop(),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () => Navigator.of(context).pop(_controller.text.trim()),
        child: const Text('Upload'),
      ),
    ],
  );
}
