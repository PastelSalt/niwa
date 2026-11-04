import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';
import 'package:niwa/features/items/data/item_providers.dart';

/// Plain text → a ProseMirror doc with one paragraph per line (web
/// `textToDoc`). Null for blank text.
Map<String, dynamic>? textToDoc(String text) {
  if (text.trim().isEmpty) return null;
  return {
    'type': 'doc',
    'content': [
      for (final line in text.trimRight().split('\n'))
        {
          'type': 'paragraph',
          if (line.isNotEmpty)
            'content': [
              {'type': 'text', 'text': line},
            ],
        },
    ],
  };
}

/// Quick capture to the Inbox (specs §12.8, port of web `CaptureProvider`),
/// through the offline-safe queue. [suggestedParentId] is the item on screen
/// when the sheet opened.
Future<void> showCaptureSheet(
  BuildContext context, {
  String? suggestedParentId,
}) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => CaptureSheet(suggestedParentId: suggestedParentId),
);

class CaptureSheet extends ConsumerStatefulWidget {
  const new({this.suggestedParentId, super.key});

  final String? suggestedParentId;

  @override
  ConsumerState<CaptureSheet> createState() => _CaptureSheetState();
}

class _CaptureSheetState extends ConsumerState<CaptureSheet> {
  final _title = TextEditingController();
  final _body = TextEditingController();
  final _titleFocus = FocusNode();
  ItemType _type = ItemType.idea;
  bool _showBody = false;
  bool _suggest = true;
  bool _saving = false;
  String? _error;

  /// Captured in this sheet so far, and how many are waiting to sync.
  int _captured = 0;
  int _waiting = 0;

  /// Closed after "Save & next" without a final Save (swipe, back): still
  /// say what was captured.
  bool _summarised = false;

  @override
  void initState() {
    super.initState();
    // Kept for the summary after close, when ref may be gone.
    _snackbars = ref.read(snackbarsProvider);
  }

  @override
  void deactivate() {
    if (!_summarised) {
      _summarised = true;
      _summarise();
    }
    super.deactivate();
  }

  @override
  void dispose() {
    _title.dispose();
    _body.dispose();
    _titleFocus.dispose();
    super.dispose();
  }

  late final Snackbars _snackbars;

  /// "Captured … to Inbox", shown after the sheet has closed (never during a
  /// build: closing the sheet is one).
  void _summarise() {
    if (_captured == 0) return;
    final what = _captured == 1
        ? 'Captured to Inbox'
        : 'Captured $_captured items to Inbox';
    final message = _waiting == 0
        ? what
        : "$what — it'll sync when you're back online";
    final snackbars = _snackbars;
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => snackbars.show(message),
    );
  }

  /// [next]: keep the sheet open for another (web Shift+Enter).
  Future<void> _save({bool next = false}) async {
    final title = _title.text.trim();
    if (title.isEmpty || _saving) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final synced = await ref
          .read(captureQueueProvider.notifier)
          .capture(
            title: title,
            type: _type,
            content: textToDoc(_body.text),
            suggestedParentId: _suggest ? widget.suggestedParentId : null,
          );
      _captured++;
      if (!synced) _waiting++;
      if (!mounted) return;
      if (next) {
        setState(() {
          _saving = false;
          _title.clear();
          _body.clear();
        });
        _titleFocus.requestFocus();
      } else {
        Navigator.of(context).pop(); // deactivate() summarises
      }
    } on Object catch (e) {
      // Only a local database failure lands here.
      if (mounted) {
        setState(() {
          _saving = false;
          _error = messageOf(e);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const unit = NiwaTokens.spacingUnit;
    final suggested = widget.suggestedParentId == null
        ? null
        : ref.watch(treeProvider).value?.byId[widget.suggestedParentId];
    final canSave = _title.text.trim().isNotEmpty && !_saving;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        unit * 4,
        0,
        unit * 4,
        unit * 4 + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(
                    'Capture',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ),
              if (_captured > 0)
                Semantics(liveRegion: true, child: Text('$_captured captured')),
            ],
          ),
          const SizedBox(height: unit * 4),
          TextField(
            controller: _title,
            focusNode: _titleFocus,
            autofocus: true,
            maxLength: 300,
            textCapitalization: TextCapitalization.sentences,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _save(),
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: "What's on your mind?",
              errorText: _error,
            ),
          ),
          if (_showBody)
            TextField(
              controller: _body,
              minLines: 2,
              maxLines: 6,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Details'),
            )
          else
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton.icon(
                icon: const Icon(Icons.notes),
                label: const Text('Add details'),
                onPressed: () => setState(() => _showBody = true),
              ),
            ),
          if (suggested != null)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              value: _suggest,
              onChanged: (v) => setState(() => _suggest = v ?? false),
              title: Text('Suggest filing under “${suggested.title}”'),
            ),
          const SizedBox(height: unit * 2),
          SegmentedButton<ItemType>(
            segments: const [
              ButtonSegment(value: ItemType.idea, label: Text('Idea')),
              ButtonSegment(value: ItemType.note, label: Text('Note')),
              ButtonSegment(value: ItemType.task, label: Text('Task')),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.single),
          ),
          const SizedBox(height: unit * 4),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: canSave ? () => _save(next: true) : null,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: const Text('Save & next'),
                ),
              ),
              const SizedBox(width: unit * 3),
              Expanded(
                child: FilledButton(
                  onPressed: canSave ? _save : null,
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                  ),
                  child: Text(_saving ? 'Saving…' : 'Save to Inbox'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
