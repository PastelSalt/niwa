import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/core/api/error_message.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/net/network_status.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// Items deleted together, each listed by its root (specs §12.6).
final trashProvider = FutureProvider<List<ItemSummary>>(
  (ref) => ref.watch(itemsRepositoryProvider).trash(),
);

/// Settings › Trash: restore or delete permanently (port of web
/// `TrashSection`, same copy).
class TrashSection extends ConsumerWidget {
  const new({super.key});

  void _refreshAll(WidgetRef ref) {
    ref
      ..invalidate(trashProvider)
      ..invalidate(treeProvider)
      ..invalidate(inboxItemsProvider)
      ..invalidate(focusProvider);
  }

  bool _offline(WidgetRef ref) {
    if (ref.read(networkStatusProvider)) return false;
    ref
        .read(snackbarsProvider)
        .show("You're offline — Trash needs a connection.");
    return true;
  }

  Future<void> _restore(WidgetRef ref, ItemSummary item) async {
    if (_offline(ref)) return;
    final snackbars = ref.read(snackbarsProvider);
    try {
      final res = await ref.read(itemsRepositoryProvider).restore(item.id);
      _refreshAll(ref);
      snackbars.show(
        res.restoredTo == RestoreTarget.inbox
            ? 'Restored “${item.title}” to the Inbox (its parent is gone)'
            : res.restoredCount > 1
            ? 'Restored “${item.title}” and ${res.restoredCount - 1} inside it'
            : 'Restored “${item.title}”',
      );
    } on Object catch (e) {
      snackbars.show(messageOf(e));
    }
  }

  Future<void> _purge(
    BuildContext context,
    WidgetRef ref,
    ItemSummary item,
  ) async {
    if (_offline(ref)) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete permanently?'),
        content: Text(
          '“${item.title}” and everything inside it will be gone for good. '
          "This can't be undone.",
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
            child: const Text('Delete forever'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final snackbars = ref.read(snackbarsProvider);
    try {
      final res = await ref.read(itemsRepositoryProvider).purge(item.id);
      ref.invalidate(trashProvider);
      final n = res.affected;
      snackbars.show('Deleted $n item${n == 1 ? '' : 's'} permanently');
    } on Object catch (e) {
      snackbars.show(messageOf(e));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trash = ref.watch(trashProvider);
    final secondary = NiwaColors.of(context).textSecondary;
    final loc = MaterialLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text(
            'Deleted items wait here with everything that was inside them. '
            'Restoring puts them back where they were.',
            style: TextStyle(color: secondary),
          ),
        ),
        switch (trash) {
          AsyncData(value: final items) when items.isEmpty => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text('Trash is empty.', style: TextStyle(color: secondary)),
          ),
          AsyncData(value: final items) => Semantics(
            label: 'Trash',
            container: true,
            child: Column(
              children: [
                for (final item in items)
                  ListTile(
                    leading: ItemTypeIcon(item.type),
                    title: Text(item.title),
                    subtitle: item.deletedAt == null
                        ? null
                        : Text(
                            'Deleted '
                            '${loc.formatShortDate(item.deletedAt!.toLocal())}',
                          ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: 'Restore ${item.title}',
                          icon: const Icon(Icons.restore_from_trash_outlined),
                          onPressed: () => _restore(ref, item),
                        ),
                        IconButton(
                          tooltip: 'Delete ${item.title} permanently',
                          icon: const Icon(Icons.delete_forever_outlined),
                          onPressed: () => _purge(context, ref, item),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          AsyncError(:final error) => SizedBox(
            height: 280,
            child: ErrorState(
              error: error,
              onRetry: () => ref.invalidate(trashProvider),
            ),
          ),
          _ => const SizedBox(height: 200, child: ListSkeleton(rows: 3)),
        },
      ],
    );
  }
}
