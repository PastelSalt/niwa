import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_fields_sheet.dart'
    show isValidTag, normalizeTag;
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// Filing sheet (port of web `FileDialog`, CONCEPT.md §3.2–3.3): parent,
/// type, and — for one item — due date and tags. Works for many at once.
Future<void> showFileSheet(BuildContext context, List<ItemSummary> items) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => FileSheet(items: items),
    );

class FileSheet extends ConsumerStatefulWidget {
  const new({required this.items, super.key});

  final List<ItemSummary> items;

  @override
  ConsumerState<FileSheet> createState() => _FileSheetState();
}

class _FileSheetState extends ConsumerState<FileSheet> {
  late final ItemSummary? _single = widget.items.length == 1
      ? widget.items.single
      : null;
  String? _parentId;

  /// null = keep each item's type (bulk only).
  late ItemType? _type = _single?.type;
  late String? _dueAt = _single?.dueAt;
  late final List<String> _tags = [...?_single?.tags];
  final _query = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // The capture's suggestion, when all selected items share one.
    final suggested = widget.items.map((i) => i.suggestedParentId).toSet();
    if (suggested.length == 1) _parentId = suggested.single;
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _file(TreeModel model) async {
    final parent = _parentId == null ? null : model.byId[_parentId];
    if (parent == null) {
      setState(() => _error = 'Choose where to file it.');
      return;
    }
    if (!ref.read(networkStatusProvider)) {
      setState(() => _error = 'Filing needs a connection.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final repo = ref.read(inboxRepositoryProvider);
    var filed = 0;
    try {
      for (final item in widget.items) {
        await repo.file(
          item.id,
          version: item.version,
          parentId: parent.id,
          type: _type,
          dueAt: _single == null ? null : _dueAt,
          tags: _single == null ? null : _tags,
        );
        filed++;
      }
    } on Object catch (e) {
      if (mounted) {
        setState(() {
          _busy = false;
          _error = '${filed > 0 ? 'Filed $filed, then: ' : ''}${messageOf(e)}';
        });
      }
      return;
    } finally {
      ref
        ..invalidate(inboxItemsProvider)
        ..invalidate(treeProvider)
        ..invalidate(focusProvider);
    }
    if (!mounted) return;
    final router = GoRouter.of(context);
    Navigator.of(context).pop();
    ref
        .read(snackbarsProvider)
        .show(
          filed == 1
              ? 'Filed under “${parent.title}”'
              : 'Filed $filed items under “${parent.title}”',
          actionLabel: 'Open',
          onAction: () => router.go('${lensPath(parent.nature)}/${parent.id}'),
        );
  }

  @override
  Widget build(BuildContext context) {
    const unit = NiwaTokens.spacingUnit;
    final model = ref.watch(treeProvider).value;
    final label = Theme.of(context).textTheme.labelLarge;
    final q = _query.text.trim().toLowerCase();
    final parent = _parentId == null ? null : model?.byId[_parentId];
    final candidates = <ItemSummary>[
      if (model != null)
        for (final i in model.byId.values)
          if (q.isEmpty || i.title.toLowerCase().contains(q)) i,
    ]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

    String path(ItemSummary i) => model == null
        ? ''
        : [
            ...ancestorsOf(model, i.id).map((a) => a.title),
            i.title,
          ].join(' › ');

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(unit * 4, 0, unit * 4, unit * 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _single == null
                  ? 'File ${widget.items.length} items'
                  : 'File “${_single.title}”',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: unit * 4),
            Text('File under', style: label),
            if (parent != null)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: ItemTypeIcon(parent.type),
                title: Text(path(parent)),
                trailing: IconButton(
                  tooltip: 'Choose another place',
                  icon: const Icon(Icons.close),
                  onPressed: () => setState(() => _parentId = null),
                ),
              )
            else ...[
              TextField(
                controller: _query,
                decoration: const InputDecoration(
                  labelText: 'Find a place',
                  prefixIcon: Icon(Icons.search),
                ),
                onChanged: (_) => setState(() {}),
              ),
              SizedBox(
                height: 200,
                child: ListView(
                  children: [
                    for (final c in candidates.take(30))
                      ListTile(
                        dense: true,
                        leading: ItemTypeIcon(c.type),
                        title: Text(c.title),
                        subtitle: Text(path(c), maxLines: 1),
                        onTap: () => setState(() => _parentId = c.id),
                      ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: unit * 4),
            Text('Type', style: label),
            const SizedBox(height: unit * 2),
            Wrap(
              spacing: unit * 2,
              children: [
                if (_single == null)
                  ChoiceChip(
                    label: const Text('Keep each type'),
                    selected: _type == null,
                    onSelected: (_) => setState(() => _type = null),
                  ),
                for (final t in [
                  ItemType.note,
                  ItemType.idea,
                  ItemType.task,
                  ItemType.project,
                ])
                  ChoiceChip(
                    avatar: ItemTypeIcon(t),
                    label: Text(typeLabel(t)),
                    selected: _type == t,
                    onSelected: (_) => setState(() => _type = t),
                  ),
              ],
            ),
            if (_single != null) ...[
              const SizedBox(height: unit * 4),
              Row(
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.event_outlined),
                    label: Text(
                      _dueAt == null
                          ? 'No due date'
                          : formatDay(context, _dueAt!),
                    ),
                    onPressed: () async {
                      final now = DateTime.now();
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: now,
                        firstDate: DateTime(now.year - 5),
                        lastDate: DateTime(now.year + 5),
                      );
                      if (picked != null) {
                        setState(() => _dueAt = dateOnly(picked));
                      }
                    },
                  ),
                  if (_dueAt != null)
                    IconButton(
                      tooltip: 'Clear due date',
                      icon: const Icon(Icons.close),
                      onPressed: () => setState(() => _dueAt = null),
                    ),
                ],
              ),
              const SizedBox(height: unit * 2),
              Wrap(
                spacing: unit * 2,
                children: [
                  for (final t in _tags)
                    InputChip(
                      label: Text(t),
                      onDeleted: () => setState(() => _tags.remove(t)),
                    ),
                ],
              ),
              TextField(
                decoration: const InputDecoration(labelText: 'Add a tag'),
                onSubmitted: (v) {
                  final tag = normalizeTag(v);
                  if (isValidTag(tag) && !_tags.contains(tag)) {
                    setState(() => _tags.add(tag));
                  }
                },
              ),
            ],
            if (_error case final message?)
              Padding(
                padding: const EdgeInsets.only(top: unit * 3),
                child: Text(
                  message,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: unit * 6),
            FilledButton(
              onPressed: _busy || model == null || parent == null
                  ? null
                  : () => _file(model),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
              child: Text(_busy ? 'Filing…' : 'File'),
            ),
          ],
        ),
      ),
    );
  }
}
