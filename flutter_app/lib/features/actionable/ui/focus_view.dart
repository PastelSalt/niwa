import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/ui/snackbars.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/core/util/date_only.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_meta.dart';

/// Focus sections (specs §4.2), same order and copy as the web `FocusView`.
const _sections = <(String, String, List<ItemSummary> Function(FocusResponse))>[
  ('Overdue', 'Nothing overdue.', _overdue),
  ('In progress', 'Nothing in progress.', _inProgress),
  ('High priority', 'No high-priority work open.', _high),
  ('Upcoming (7 days)', 'Nothing due this week.', _upcoming),
  ('Recently updated', 'No recent changes.', _recent),
];
List<ItemSummary> _overdue(FocusResponse f) => f.overdue;
List<ItemSummary> _inProgress(FocusResponse f) => f.inProgress;
List<ItemSummary> _high(FocusResponse f) => f.highPriority;
List<ItemSummary> _upcoming(FocusResponse f) => f.upcoming;
List<ItemSummary> _recent(FocusResponse f) => f.recentlyUpdated;

class FocusView extends ConsumerWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final focus = ref.watch(focusProvider);
    final model = ref.watch(treeProvider).value;
    return switch (focus) {
      AsyncData(value: final f) => RefreshIndicator(
        onRefresh: () => ref.refresh(focusProvider.future),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 96),
          children: [
            for (final (title, empty, pick) in _sections) ...[
              ListTile(
                title: Semantics(
                  header: true,
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
              ),
              if (pick(f).isEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                  child: Text(
                    empty,
                    style: TextStyle(
                      color: NiwaColors.of(context).textSecondary,
                    ),
                  ),
                )
              else
                for (final item in pick(f))
                  FocusRow(
                    key: ValueKey('$title-${item.id}'),
                    item: item,
                    model: model,
                  ),
            ],
          ],
        ),
      ),
      AsyncError(:final error) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(focusProvider),
      ),
      _ => const ListSkeleton(),
    };
  }
}

/// A task with a complete checkbox. The tick flips at once and holds until
/// the refreshed list agrees, so it doesn't flicker back (web `FocusRow`).
class FocusRow extends ConsumerStatefulWidget {
  const new({required this.item, this.model, super.key});

  final ItemSummary item;
  final TreeModel? model;

  @override
  ConsumerState<FocusRow> createState() => _FocusRowState();
}

class _FocusRowState extends ConsumerState<FocusRow> {
  bool? _optimistic;

  @override
  void didUpdateWidget(FocusRow old) {
    super.didUpdateWidget(old);
    if (_optimistic == (widget.item.status == ItemStatus.completed)) {
      _optimistic = null;
    }
  }

  Future<void> _toggle(bool done) async {
    final next = !done;
    setState(() => _optimistic = next);
    final saved = await ref
        .read(itemActionsProvider)
        .update(
          widget.item.id,
          ItemChanges(
            version: widget.item.version,
            status: next ? ItemStatus.completed : ItemStatus.inProgress,
          ),
        );
    if (!mounted) return;
    if (saved == null) {
      setState(() => _optimistic = null);
    } else if (next) {
      ref.read(snackbarsProvider).show('Completed “${widget.item.title}”');
    }
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final done = _optimistic ?? item.status == ItemStatus.completed;
    final model = widget.model;
    final path = model == null
        ? ''
        : ancestorsOf(model, item.id).map((a) => a.title).join(' › ');
    final overdue =
        item.dueAt != null &&
        item.dueAt!.compareTo(dateOnly(DateTime.now())) < 0 &&
        !done;
    final secondary = NiwaColors.of(context).textSecondary;

    return ListTile(
      leading: Checkbox(
        value: done,
        semanticLabel: done
            ? 'Mark “${item.title}” not done'
            : 'Complete “${item.title}”',
        onChanged: (_) => _toggle(done),
      ),
      title: Text(
        item.title,
        style: done
            ? TextStyle(
                decoration: TextDecoration.lineThrough,
                color: secondary,
              )
            : null,
      ),
      subtitle: Text(
        [
          if (path.isNotEmpty) path,
          if (item.dueAt case final due? when overdue)
            'Overdue · ${formatDay(context, due)}'
          else if (item.dueAt case final due?)
            formatDay(context, due),
        ].join('  ·  '),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: overdue
            ? TextStyle(color: Theme.of(context).colorScheme.error)
            : null,
      ),
      trailing:
          item.priority == ItemPriority.high ||
              item.priority == ItemPriority.critical
          ? Icon(
              Icons.flag,
              color: NiwaColors.of(context).warning,
              semanticLabel: '${priorityLabel(item.priority)} priority',
            )
          : null,
      onTap: () => context.push('/actionable/${item.id}'),
    );
  }
}
