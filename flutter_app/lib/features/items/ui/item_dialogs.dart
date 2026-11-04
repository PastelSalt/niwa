import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// Create an item under [parentId] (null = top level) and open it.
Future<void> showCreateItemDialog(
  BuildContext context,
  WidgetRef ref, {
  required String? parentId,
  required ItemNature nature,
  String? afterId,
}) async {
  final created = await showDialog<Item>(
    context: context,
    builder: (_) => _CreateItemDialog(
      parentId: parentId,
      afterId: afterId,
      initialType: defaultTypeFor(nature),
    ),
  );
  if (created != null && context.mounted) {
    await context.push('${lensPath(created.nature)}/${created.id}');
  }
}

class _CreateItemDialog extends ConsumerStatefulWidget {
  const new({
    required this.parentId,
    required this.afterId,
    required this.initialType,
  });

  final String? parentId;
  final String? afterId;
  final ItemType initialType;

  @override
  ConsumerState<_CreateItemDialog> createState() => _CreateItemDialogState();
}

class _CreateItemDialogState extends ConsumerState<_CreateItemDialog> {
  final _title = TextEditingController();
  late ItemType _type = widget.initialType;
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final title = _title.text.trim();
    if (title.isEmpty || _saving) return;
    setState(() => _saving = true);
    final item = await ref
        .read(itemActionsProvider)
        .create(
          parentId: widget.parentId,
          afterId: widget.afterId,
          title: title,
          type: _type,
        );
    if (!mounted) return;
    if (item == null) {
      setState(() => _saving = false);
    } else {
      Navigator.of(context).pop(item);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('New item'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _title,
            autofocus: true,
            maxLength: 300,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Title'),
            onChanged: (_) => setState(() {}),
            onSubmitted: (_) => _create(),
          ),
          const SizedBox(height: NiwaTokens.spacingUnit * 2),
          Wrap(
            spacing: NiwaTokens.spacingUnit * 2,
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
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _title.text.trim().isEmpty || _saving ? null : _create,
          child: const Text('Create'),
        ),
      ],
    );
  }
}

/// Confirms deleting an item that has children (single items go straight
/// to Trash with Undo, as on the web).
Future<bool> confirmDelete(
  BuildContext context,
  ItemSummary item,
  int descendants,
) async =>
    descendants == 0 ||
    (await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('Delete “${item.title}”?'),
            content: Text(
              'This also moves '
              '${descendants == 1 ? 'its 1 child' : 'everything inside it'} '
              'to Trash. You can restore it from Settings › Trash.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Theme.of(context).colorScheme.error,
                  foregroundColor: Theme.of(context).colorScheme.onError,
                ),
                onPressed: () => Navigator.of(context).pop(true),
                child: const Text('Move to Trash'),
              ),
            ],
          ),
        ) ??
        false);

/// Full-screen picker for a new parent. Disabled rows say why (itself, its
/// own children, already there).
Future<void> showMovePicker(
  BuildContext context,
  WidgetRef ref, {
  required ItemSummary item,
  required TreeModel model,
}) async {
  final target = await Navigator.of(context).push<_Target>(
    MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _MovePicker(item: item, model: model),
    ),
  );
  if (target == null) return;
  await ref
      .read(itemActionsProvider)
      .move(
        MoveRequest(id: item.id, version: item.version, parentId: target.id),
      );
}

/// Wraps the chosen parent so "top level" (null) differs from "cancelled".
class _Target {
  const new(this.id);
  final String? id;
}

class _MovePicker extends StatelessWidget {
  const new({required this.item, required this.model});

  final ItemSummary item;
  final TreeModel model;

  @override
  Widget build(BuildContext context) {
    final rows = <(ItemSummary?, int)>[(null, 0)];
    void walk(String? parent, int depth) {
      for (final c in model.childrenOf(parent)) {
        rows.add((c, depth));
        walk(c.id, depth + 1);
      }
    }

    walk(null, 1);

    return Scaffold(
      appBar: AppBar(title: Text('Move “${item.title}”')),
      body: ListView.builder(
        itemCount: rows.length,
        itemBuilder: (context, i) {
          final (target, depth) = rows[i];
          final problem = moveTargetProblem(model, item, target?.id);
          return ListTile(
            enabled: problem == null,
            contentPadding: EdgeInsetsDirectional.only(
              start: NiwaTokens.spacingUnit * (4 + depth * 4),
              end: NiwaTokens.spacingUnit * 4,
            ),
            leading: target == null
                ? const Icon(Icons.vertical_align_top)
                : ItemTypeIcon(target.type),
            title: Text(target?.title ?? 'Top level'),
            subtitle: problem == null ? null : Text(problem),
            onTap: () => Navigator.of(context).pop(_Target(target?.id)),
          );
        },
      ),
    );
  }
}
