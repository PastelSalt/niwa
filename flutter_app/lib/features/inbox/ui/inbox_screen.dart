import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:niwa/app/niwa_app_bar.dart';
import 'package:niwa/core/db/app_database.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/capture/data/capture_queue.dart';
import 'package:niwa/features/inbox/data/inbox_providers.dart';
import 'package:niwa/features/inbox/ui/file_sheet.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';

/// Inbox (specs §12.8, port of web `InboxPage`): captures still on this
/// phone first, then the server's Inbox, newest first. File one or many;
/// delete with Undo.
class InboxScreen extends ConsumerStatefulWidget {
  const new({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  final _selected = <String>{};

  @override
  Widget build(BuildContext context) {
    final inbox = ref.watch(inboxItemsProvider);
    final queued = ref.watch(captureQueueProvider);
    final items = inbox.value ?? const <ItemSummary>[];
    // Drop selections that were filed or deleted.
    _selected.retainAll(items.map((i) => i.id));
    final chosen = [
      for (final i in items)
        if (_selected.contains(i.id)) i,
    ];

    final body = switch (inbox) {
      AsyncData() when items.isEmpty && queued.isEmpty => const EmptyState(
        icon: Icons.inbox_outlined,
        title: 'Inbox zero',
        message: 'Capture with + and file things when you have a moment.',
      ),
      AsyncData() => RefreshIndicator(
        onRefresh: () => ref.refresh(inboxItemsProvider.future),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            for (final q in queued) _QueuedRow(q),
            if (queued.isNotEmpty) const Divider(height: 1),
            Semantics(
              label: 'Inbox items',
              container: true,
              child: Column(
                children: [
                  for (final item in items) ...[
                    _InboxRow(
                      item: item,
                      selected: _selected.contains(item.id),
                      onSelect: (v) => setState(
                        () => v
                            ? _selected.add(item.id)
                            : _selected.remove(item.id),
                      ),
                    ),
                    const Divider(height: 1),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      AsyncError(:final error) when queued.isEmpty => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(inboxItemsProvider),
      ),
      AsyncError() => ListView(
        children: [for (final q in queued) _QueuedRow(q)],
      ),
      _ => const ListSkeleton(),
    };

    return Scaffold(
      appBar: chosen.isEmpty
          ? const NiwaAppBar(title: 'Inbox')
          : AppBar(
              leading: IconButton(
                tooltip: 'Clear selection',
                icon: const Icon(Icons.close),
                onPressed: () => setState(_selected.clear),
              ),
              title: Text('${chosen.length} selected'),
              actions: [
                IconButton(
                  tooltip: 'Delete selected',
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    if (await ref
                        .read(itemActionsProvider)
                        .removeMany(chosen)) {
                      setState(_selected.clear);
                    }
                  },
                ),
                TextButton.icon(
                  icon: const Icon(Icons.drive_file_move_outline),
                  label: const Text('File selected'),
                  onPressed: () => showFileSheet(context, chosen),
                ),
              ],
            ),
      body: body,
    );
  }
}

class _InboxRow extends ConsumerWidget {
  const new({
    required this.item,
    required this.selected,
    required this.onSelect,
  });

  final ItemSummary item;
  final bool selected;
  final ValueChanged<bool> onSelect;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = ref.watch(treeProvider).value;
    final suggested = item.suggestedParentId == null
        ? null
        : model?.byId[item.suggestedParentId];
    final secondary = NiwaColors.of(context).textSecondary;
    final loc = MaterialLocalizations.of(context);

    return ListTile(
      leading: Checkbox(
        value: selected,
        semanticLabel: 'Select ${item.title}',
        onChanged: (v) => onSelect(v ?? false),
      ),
      title: Row(
        children: [
          ItemTypeIcon(item.type),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      subtitle: Wrap(
        spacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          if (item.inboxedAt case final at?)
            Text(
              loc.formatShortDate(at.toLocal()),
              style: TextStyle(color: secondary),
            ),
          if (suggested != null)
            Chip(
              visualDensity: VisualDensity.compact,
              avatar: const Icon(Icons.subdirectory_arrow_right, size: 16),
              label: Text(suggested.title),
            ),
        ],
      ),
      onLongPress: () => onSelect(!selected),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'File ${item.title}',
            icon: const Icon(Icons.drive_file_move_outline),
            onPressed: () => showFileSheet(context, [item]),
          ),
          IconButton(
            tooltip: 'Delete ${item.title}',
            icon: const Icon(Icons.delete_outline),
            onPressed: () => ref.read(itemActionsProvider).remove(item),
          ),
        ],
      ),
    );
  }
}

/// A capture that hasn't reached the server yet.
class _QueuedRow extends ConsumerWidget {
  const new(this.entry);

  final OutboxData entry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final failed = entry.failedMessage;
    final queue = ref.read(captureQueueProvider.notifier);
    final secondary = NiwaColors.of(context).textSecondary;
    return ListTile(
      leading: Icon(
        failed == null ? Icons.cloud_upload_outlined : Icons.error_outline,
        color: failed == null ? secondary : Theme.of(context).colorScheme.error,
        semanticLabel: failed == null ? 'Waiting to sync' : 'Not saved',
      ),
      title: Text(entry.title, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: Text(failed ?? 'Waiting to sync'),
      trailing: failed == null
          ? null
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextButton(
                  onPressed: () => queue.retry(entry),
                  child: const Text('Retry'),
                ),
                TextButton(
                  onPressed: () => queue.discard(entry),
                  child: const Text('Discard'),
                ),
              ],
            ),
    );
  }
}
