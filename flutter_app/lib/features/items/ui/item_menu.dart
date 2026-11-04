import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_dialogs.dart';
import 'package:niwa/features/items/ui/item_meta.dart';

/// Long-press / overflow actions for an item (port of `ItemMenu.tsx`).
/// [onDeleted] runs after a successful delete (e.g. leave the item's screen).
Future<void> showItemMenu(
  BuildContext context,
  WidgetRef ref, {
  required ItemSummary item,
  required TreeModel model,
  bool showOpen = true,
  VoidCallback? onDeleted,
}) async {
  final actions = ref.read(itemActionsProvider);
  final up = moveUp(model, item);
  final down = moveDown(model, item);
  final archived = item.archivedAt != null;

  final choice = await showModalBottomSheet<String>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(
                item.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            if (showOpen) _choice(context, 'open', Icons.open_in_new, 'Open'),
            _choice(context, 'child', Icons.add, 'Add inside'),
            _choice(context, 'sibling', Icons.playlist_add, 'Add below'),
            _choice(context, 'move', Icons.drive_file_move_outline, 'Move to…'),
            if (up != null)
              _choice(context, 'up', Icons.arrow_upward, 'Move up'),
            if (down != null)
              _choice(context, 'down', Icons.arrow_downward, 'Move down'),
            _choice(
              context,
              'archive',
              archived ? Icons.unarchive_outlined : Icons.archive_outlined,
              archived ? 'Unarchive' : 'Archive',
            ),
            _choice(context, 'delete', Icons.delete_outline, 'Move to Trash'),
          ],
        ),
      ),
    ),
  );
  if (!context.mounted) return;

  switch (choice) {
    case 'open':
      await context.push('${lensPath(item.nature)}/${item.id}');
    case 'child':
      await showCreateItemDialog(
        context,
        ref,
        parentId: item.id,
        nature: item.nature,
      );
    case 'sibling':
      await showCreateItemDialog(
        context,
        ref,
        parentId: item.parentId,
        afterId: item.id,
        nature: item.nature,
      );
    case 'move':
      await showMovePicker(context, ref, item: item, model: model);
    case 'up':
      await actions.move(up);
    case 'down':
      await actions.move(down);
    case 'archive':
      await actions.setArchived(item, archived: !archived);
    case 'delete':
      if (await confirmDelete(context, item, descendantCount(model, item.id)) &&
          await actions.remove(item)) {
        onDeleted?.call();
      }
  }
}

Widget _choice(BuildContext context, String key, IconData icon, String label) =>
    ListTile(
      leading: Icon(icon),
      title: Text(label),
      onTap: () => Navigator.of(context).pop(key),
    );
