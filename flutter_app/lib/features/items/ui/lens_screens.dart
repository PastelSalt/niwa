import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/app/niwa_app_bar.dart';
import 'package:niwa/core/api/providers.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/actionable/ui/focus_view.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_dialogs.dart';
import 'package:niwa/features/items/ui/item_menu.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_row.dart';
import 'package:niwa/features/items/ui/item_screen.dart';

/// `/knowledge[/:id]`: the Knowledge home (top-level tree) or an item.
class KnowledgeScreen extends ConsumerWidget {
  const new({this.itemId, this.anchor, super.key});

  final String? itemId;

  /// Heading anchor from a `#h-…` link; the editor scrolls to it (MA6).
  final String? anchor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (itemId case final id?) {
      return ItemScreen(id: id, lens: ItemNature.knowledge, anchor: anchor);
    }
    return Scaffold(
      appBar: NiwaAppBar(
        title: 'Knowledge',
        actions: [
          IconButton(
            tooltip: 'Review queue',
            icon: const Icon(Icons.history_edu_outlined),
            onPressed: () => context.push('/knowledge/review'),
          ),
          const _NewTopLevel(nature: ItemNature.knowledge),
        ],
      ),
      body: const LensTree(nature: ItemNature.knowledge),
    );
  }
}

/// `/actionable[/:id]`: Focus and the tree, or an item.
class ActionableScreen extends ConsumerWidget {
  const new({this.itemId, super.key});

  final String? itemId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (itemId case final id?) {
      return ItemScreen(id: id, lens: ItemNature.actionable);
    }
    return const DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: NiwaAppBar(
          title: 'Actionable',
          actions: [_NewTopLevel(nature: ItemNature.actionable)],
          bottom: TabBar(
            tabs: [
              Tab(text: 'Focus'),
              Tab(text: 'Browse'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            FocusView(),
            LensTree(nature: ItemNature.actionable),
          ],
        ),
      ),
    );
  }
}

class _NewTopLevel extends ConsumerWidget {
  const new({required this.nature});

  final ItemNature nature;

  @override
  Widget build(BuildContext context, WidgetRef ref) => IconButton(
    tooltip: 'New item',
    icon: const Icon(Icons.create_new_folder_outlined),
    onPressed: () =>
        showCreateItemDialog(context, ref, parentId: null, nature: nature),
  );
}

/// Top level of the tree as seen through a lens (CONCEPT.md §2): ancestors
/// that only lead to the lens's items are dimmed.
class LensTree extends ConsumerWidget {
  const new({required this.nature, super.key});

  final ItemNature nature;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tree = ref.watch(treeProvider);
    return switch (tree) {
      AsyncData(value: final model) => _list(context, ref, model),
      AsyncError(:final error) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(treeProvider),
      ),
      _ => const ListSkeleton(),
    };
  }

  Widget _list(BuildContext context, WidgetRef ref, TreeModel model) {
    final view = lensView(model, nature);
    final roots = visibleChildren(model, view, null);
    if (roots.isEmpty) {
      return EmptyState(
        icon: Icons.park_outlined,
        title: 'Nothing planted yet',
        message: 'Create a top-level item to start your tree.',
        action: FilledButton.icon(
          icon: const Icon(Icons.add),
          label: const Text('New item'),
          onPressed: () => showCreateItemDialog(
            context,
            ref,
            parentId: null,
            nature: nature,
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.refresh(treeProvider.future),
      child: ListView.separated(
        padding: const EdgeInsets.only(bottom: 96),
        itemCount: roots.length,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final item = roots[i];
          return ItemRow(
            item: item,
            childCount: visibleChildren(model, view, item.id).length,
            dimmed: view.dimmed.contains(item.id),
            onTap: () => context.push('${lensPath(nature)}/${item.id}'),
            onLongPress: () =>
                showItemMenu(context, ref, item: item, model: model),
          );
        },
      ),
    );
  }
}

/// `/items/:id` → the item's lens (`/knowledge/:id` or `/actionable/:id`),
/// keeping a `#anchor` (port of `ItemRedirect` in `features/pages.tsx`).
class ItemRedirectScreen extends ConsumerStatefulWidget {
  const new({required this.id, this.fragment, super.key});

  final String id;
  final String? fragment;

  @override
  ConsumerState<ItemRedirectScreen> createState() => _ItemRedirectState();
}

class _ItemRedirectState extends ConsumerState<ItemRedirectScreen> {
  Object? _error;

  @override
  void initState() {
    super.initState();
    unawaited(_resolve());
  }

  Future<void> _resolve() async {
    setState(() => _error = null);
    try {
      final item = await ref.read(itemsRepositoryProvider).get(widget.id);
      if (!mounted) return;
      final lens = item.nature == ItemNature.actionable
          ? 'actionable'
          : 'knowledge';
      final hash = widget.fragment == null ? '' : '#${widget.fragment}';
      context.go('/$lens/${item.id}$hash');
    } on Object catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(),
    body: switch (_error) {
      final error? => ErrorState(error: error, onRetry: _resolve),
      null => const Center(child: CircularProgressIndicator()),
    },
  );
}

class NotFoundScreen extends StatelessWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(),
    body: EmptyState(
      icon: Icons.explore_off_outlined,
      title: 'Nothing here',
      message: "This link doesn't lead anywhere in NIWA.",
      action: FilledButton(
        onPressed: () => context.go('/knowledge'),
        child: const Text('Go to Knowledge'),
      ),
    ),
  );
}

/// `/knowledge/review` — the review queue (MA4).
class ReviewScreen extends StatelessWidget {
  const new({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Review')),
    body: const EmptyState(
      icon: Icons.history_edu_outlined,
      title: 'Review queue',
      message: 'Notes due for review arrive in the next update.',
    ),
  );
}
