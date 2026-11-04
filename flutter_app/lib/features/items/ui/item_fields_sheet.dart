import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/change.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// Tag rules from `packages/contracts/src/item.ts` (DATA_MODEL.md §6).
const tagMaxLength = 40;
const tagsPerItem = 20;
final _tagPattern = RegExp(r'^[\p{L}\p{N}_/-]+$', unicode: true);

String normalizeTag(String raw) =>
    raw.trim().replaceAll(RegExp(r'\s+'), '-').toLowerCase();

bool isValidTag(String tag) =>
    tag.isNotEmpty && tag.length <= tagMaxLength && _tagPattern.hasMatch(tag);

/// Edits type, status, priority, dates and tags in one sheet; Save sends
/// only what changed (port of `ItemFields.tsx`).
Future<void> showItemFieldsSheet(BuildContext context, Item item) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => ItemFieldsSheet(item: item),
    );

class ItemFieldsSheet extends ConsumerStatefulWidget {
  const new({required this.item, super.key});

  final Item item;

  @override
  ConsumerState<ItemFieldsSheet> createState() => _ItemFieldsSheetState();
}

class _ItemFieldsSheetState extends ConsumerState<ItemFieldsSheet> {
  late ItemType _type = widget.item.type;
  late ItemStatus _status = widget.item.status;
  late ItemPriority _priority = widget.item.priority;
  late String? _dueAt = widget.item.dueAt;
  late String? _reviewAt = widget.item.reviewAt;
  late final List<String> _tags = [...widget.item.tags];
  String? _tagError;
  bool _saving = false;

  bool get _actionable => _type == ItemType.project || _type == ItemType.task;

  void _addTag(String raw) {
    final tag = normalizeTag(raw);
    if (tag.isEmpty) return;
    setState(() {
      if (!isValidTag(tag)) {
        _tagError = 'Letters, numbers, - _ / only; up to $tagMaxLength';
      } else if (_tags.length >= tagsPerItem && !_tags.contains(tag)) {
        _tagError = 'At most $tagsPerItem tags';
      } else {
        _tagError = null;
        if (!_tags.contains(tag)) _tags.add(tag);
      }
    });
  }

  Future<void> _pickDate(String? current, ValueChanged<String?> set) async {
    final now = DateTime.now();
    final initial = current == null
        ? now
        : DateTime.parse(current); // YYYY-MM-DD parses as local midnight
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 10),
      lastDate: DateTime(now.year + 10),
    );
    if (picked != null) setState(() => set(dateOnly(picked)));
  }

  Future<void> _save() async {
    final i = widget.item;
    bool sameTags() =>
        _tags.length == i.tags.length && _tags.every(i.tags.contains);
    final changes = ItemChanges(
      version: i.version,
      type: _type == i.type ? null : _type,
      status: _status == i.status ? null : _status,
      priority: _priority == i.priority ? null : _priority,
      dueAt: _dueAt == i.dueAt ? null : Change(_dueAt),
      reviewAt: _reviewAt == i.reviewAt ? null : Change(_reviewAt),
      tags: sameTags() ? null : _tags,
    );
    if (changes.toJson().length == 1) {
      Navigator.of(context).pop(); // only `version`: nothing changed
      return;
    }
    setState(() => _saving = true);
    await ref.read(itemActionsProvider).update(i.id, changes);
    // Close on failure too: a conflict reloads the item, and the user should
    // see the latest values rather than a stale form. The snackbar explains.
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    const unit = NiwaTokens.spacingUnit;
    final suggestions = ref.watch(tagsProvider).value ?? const [];
    final label = Theme.of(context).textTheme.labelLarge;

    Widget section(String title, Widget child) => Padding(
      padding: const EdgeInsets.only(top: unit * 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: label),
          const SizedBox(height: unit * 2),
          child,
        ],
      ),
    );

    Widget dateRow(String? value, ValueChanged<String?> set, String empty) =>
        Row(
          children: [
            OutlinedButton.icon(
              icon: const Icon(Icons.event_outlined),
              label: Text(value == null ? empty : formatDay(context, value)),
              onPressed: () => _pickDate(value, set),
            ),
            if (value != null)
              IconButton(
                tooltip: 'Clear date',
                icon: const Icon(Icons.close),
                onPressed: () => setState(() => set(null)),
              ),
          ],
        );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(unit * 4, 0, unit * 4, unit * 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Details', style: Theme.of(context).textTheme.titleLarge),
            section(
              'Type',
              Wrap(
                spacing: unit * 2,
                children: [
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
            ),
            if (_actionable) ...[
              section(
                'Status',
                Wrap(
                  spacing: unit * 2,
                  children: [
                    for (final s in [
                      ItemStatus.notStarted,
                      ItemStatus.inProgress,
                      ItemStatus.blocked,
                      ItemStatus.completed,
                    ])
                      ChoiceChip(
                        avatar: Icon(
                          Icons.circle,
                          size: 10,
                          color: statusColor(context, s),
                        ),
                        label: Text(statusLabel(s)),
                        selected: _status == s,
                        onSelected: (_) => setState(() => _status = s),
                      ),
                  ],
                ),
              ),
              section(
                'Priority',
                Wrap(
                  spacing: unit * 2,
                  children: [
                    for (final p in ItemPriority.values)
                      if (p != ItemPriority.unknown)
                        ChoiceChip(
                          label: Text(priorityLabel(p)),
                          selected: _priority == p,
                          onSelected: (_) => setState(() => _priority = p),
                        ),
                  ],
                ),
              ),
              section('Due', dateRow(_dueAt, (v) => _dueAt = v, 'No due date')),
            ] else
              section(
                'Review',
                dateRow(_reviewAt, (v) => _reviewAt = v, 'No review date'),
              ),
            section(
              'Tags',
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (_tags.isNotEmpty)
                    Wrap(
                      spacing: unit * 2,
                      children: [
                        for (final t in _tags)
                          InputChip(
                            label: Text(t),
                            onDeleted: () => setState(() => _tags.remove(t)),
                            deleteButtonTooltipMessage: 'Remove $t',
                          ),
                      ],
                    ),
                  Autocomplete<String>(
                    optionsBuilder: (value) {
                      final q = normalizeTag(value.text);
                      if (q.isEmpty) return const [];
                      return suggestions
                          .map((s) => s.tag)
                          .where((t) => t.contains(q) && !_tags.contains(t))
                          .take(8);
                    },
                    onSelected: _addTag,
                    fieldViewBuilder: (context, controller, focus, submit) =>
                        TextField(
                          controller: controller,
                          focusNode: focus,
                          decoration: InputDecoration(
                            labelText: 'Add a tag',
                            errorText: _tagError,
                          ),
                          onSubmitted: (v) {
                            _addTag(v);
                            controller.clear();
                          },
                        ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: unit * 6),
            FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
              child: Text(_saving ? 'Saving…' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }
}
