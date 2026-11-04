import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/core/theme/niwa_colors.dart';
import 'package:niwa/core/theme/tokens.g.dart';
import 'package:niwa/core/ui/state_views.dart';
import 'package:niwa/features/items/data/item_providers.dart';
import 'package:niwa/features/items/data/items_repository.dart';
import 'package:niwa/features/items/domain/tree_model.dart';
import 'package:niwa/features/items/ui/item_dialogs.dart';
import 'package:niwa/features/items/ui/item_fields_sheet.dart';
import 'package:niwa/features/items/ui/item_menu.dart';
import 'package:niwa/features/items/ui/item_meta.dart';
import 'package:niwa/features/items/ui/item_row.dart';
import 'package:niwa/features/items/ui/item_type_icon.dart';
import 'package:niwa/features/knowledge/domain/prosemirror_text.dart';
import 'package:niwa/features/knowledge/ui/links_panel.dart';
import 'package:niwa/features/scheduler/ui/item_schedule_section.dart';

/// One item: breadcrumb, editable title, field chips, content (read-only
/// until MA6) and its children in this lens, reorderable by drag handle.
class ItemScreen extends ConsumerWidget {
  const new({required this.id, required this.lens, this.anchor, super.key});

  final String id;
  final ItemNature lens;
  final String? anchor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final item = ref.watch(itemProvider(id));
    final model = ref.watch(treeProvider).value;

    return switch (item) {
      AsyncData(:final value) => _ItemBody(
        item: value,
        lens: lens,
        model: model,
        anchor: anchor,
      ),
      AsyncError(:final error) => Scaffold(
        appBar: AppBar(),
        body: ErrorState(
          error: error,
          onRetry: () => ref.invalidate(itemProvider(id)),
        ),
      ),
      _ => Scaffold(appBar: AppBar(), body: const ListSkeleton(rows: 4)),
    };
  }
}

class _ItemBody extends ConsumerWidget {
  const new({required this.item, required this.lens, this.model, this.anchor});

  final Item item;
  final ItemNature lens;
  final TreeModel? model;
  final String? anchor;

  void _leave(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(lensPath(lens));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final model = this.model;
    final summary = model?.byId[item.id] ?? summaryOf(item);
    final ancestors = model == null
        ? const <ItemSummary>[]
        : ancestorsOf(model, item.id);
    final view = model == null ? null : lensView(model, lens);
    final children = model == null || view == null
        ? const <ItemSummary>[]
        : visibleChildren(model, view, item.id);
    final blocks = textBlocks(item.content);
    const unit = NiwaTokens.spacingUnit;

    return Scaffold(
      appBar: AppBar(
        title: Text(typeLabel(item.type)),
        actions: [
          IconButton(
            tooltip: 'Edit details',
            icon: const Icon(Icons.tune),
            onPressed: () => showItemFieldsSheet(context, item),
          ),
          if (model != null)
            IconButton(
              tooltip: 'More actions',
              icon: const Icon(Icons.more_vert),
              onPressed: () => showItemMenu(
                context,
                ref,
                item: summary,
                model: model,
                showOpen: false,
                onDeleted: () => _leave(context),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref
            ..invalidate(treeProvider)
            ..invalidate(itemProvider(item.id));
          await ref.read(itemProvider(item.id).future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: unit * 24),
          children: [
            if (ancestors.isNotEmpty)
              _Breadcrumb(ancestors: ancestors, lens: lens),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: unit * 4),
              child: _TitleField(item: item),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: unit * 4),
              child: _FieldChips(item: item),
            ),
            const Divider(height: unit * 8),
            if (blocks.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: unit * 4),
                child: _ContentView(blocks: blocks, anchor: anchor),
              ),
            if (item.archivedAt == null)
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  unit * 4,
                  unit * 2,
                  unit * 4,
                  0,
                ),
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: FilledButton.tonalIcon(
                    icon: const Icon(Icons.edit_note),
                    label: Text(blocks.isEmpty ? 'Write notes' : 'Edit notes'),
                    onPressed: () =>
                        context.push('${lensPath(lens)}/${item.id}/edit'),
                  ),
                ),
              ),
            if (item.nature == ItemNature.actionable) ...[
              const Divider(height: unit * 8),
              ItemScheduleSection(item: item),
            ],
            const Divider(height: unit * 8),
            _ChildrenHeader(item: item, lens: lens, count: children.length),
            if (model != null)
              _ChildrenList(
                parent: item,
                children: children,
                model: model,
                lens: lens,
              ),
            const Divider(height: unit * 8),
            LinksPanel(item: item),
          ],
        ),
      ),
    );
  }
}

class _Breadcrumb extends StatelessWidget {
  const new({required this.ancestors, required this.lens});

  final List<ItemSummary> ancestors;
  final ItemNature lens;

  @override
  Widget build(BuildContext context) {
    final secondary = NiwaColors.of(context).textSecondary;
    return Semantics(
      label: 'Path',
      container: true,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
        child: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            for (final (i, a) in ancestors.indexed) ...[
              if (i > 0)
                ExcludeSemantics(
                  child: Icon(Icons.chevron_right, size: 16, color: secondary),
                ),
              TextButton(
                onPressed: () => context.go('${lensPath(lens)}/${a.id}'),
                child: Text(a.title, overflow: TextOverflow.ellipsis),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Title saves on Done or when focus leaves, if it changed.
class _TitleField extends ConsumerStatefulWidget {
  const new({required this.item});

  final Item item;

  @override
  ConsumerState<_TitleField> createState() => _TitleFieldState();
}

class _TitleFieldState extends ConsumerState<_TitleField> {
  late final _controller = TextEditingController(text: widget.item.title);
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() {
      if (!_focus.hasFocus) unawaited(_save());
    });
  }

  @override
  void didUpdateWidget(_TitleField old) {
    super.didUpdateWidget(old);
    // A newer version arrived (saved here or elsewhere): show it unless the
    // user is mid-edit.
    if (old.item.version != widget.item.version && !_focus.hasFocus) {
      _controller.text = widget.item.title;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final title = _controller.text.trim();
    if (title.isEmpty) {
      _controller.text = widget.item.title;
      return;
    }
    if (title == widget.item.title) return;
    final saved = await ref
        .read(itemActionsProvider)
        .update(
          widget.item.id,
          ItemChanges(version: widget.item.version, title: title),
        );
    if (saved == null && mounted) _controller.text = widget.item.title;
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      focusNode: _focus,
      maxLength: 300,
      maxLines: null,
      textInputAction: TextInputAction.done,
      textCapitalization: TextCapitalization.sentences,
      style: Theme.of(context).textTheme.headlineSmall,
      decoration: const InputDecoration(
        border: InputBorder.none,
        counterText: '',
        hintText: 'Title',
        labelText: 'Title',
        floatingLabelBehavior: FloatingLabelBehavior.never,
      ),
      onSubmitted: (_) => _focus.unfocus(),
    );
  }
}

class _FieldChips extends StatelessWidget {
  const new({required this.item});

  final Item item;

  @override
  Widget build(BuildContext context) {
    final actionable = item.nature == ItemNature.actionable;
    void edit() => showItemFieldsSheet(context, item);
    final chips = <Widget>[
      ActionChip(
        avatar: ItemTypeIcon(
          item.type,
          completed: item.status == ItemStatus.completed,
        ),
        label: Text(typeLabel(item.type)),
        onPressed: edit,
      ),
      if (actionable)
        ActionChip(
          avatar: Icon(
            Icons.circle,
            size: 10,
            color: statusColor(context, item.status),
          ),
          label: Text(statusLabel(item.status)),
          onPressed: edit,
        ),
      if (actionable && item.priority != ItemPriority.none)
        ActionChip(
          avatar: const Icon(Icons.flag_outlined, size: 18),
          label: Text('${priorityLabel(item.priority)} priority'),
          onPressed: edit,
        ),
      if (item.dueAt case final due?)
        ActionChip(
          avatar: const Icon(Icons.event_outlined, size: 18),
          label: Text('Due ${formatDay(context, due)}'),
          onPressed: edit,
        ),
      if (item.reviewAt case final review?)
        ActionChip(
          avatar: const Icon(Icons.history_edu_outlined, size: 18),
          label: Text('Review ${formatDay(context, review)}'),
          onPressed: edit,
        ),
      for (final t in item.tags)
        ActionChip(label: Text('#$t'), onPressed: edit),
      if (item.archivedAt != null)
        const Chip(
          avatar: Icon(Icons.archive_outlined, size: 18),
          label: Text('Archived'),
        ),
    ];
    return Wrap(
      spacing: NiwaTokens.spacingUnit * 2,
      runSpacing: NiwaTokens.spacingUnit * 2,
      children: chips,
    );
  }
}

/// Read view of the body. A `#h-<anchor>` deep link scrolls to its heading.
class _ContentView extends StatefulWidget {
  const new({required this.blocks, this.anchor});

  final List<TextBlock> blocks;

  /// Route fragment, e.g. `h-a1b2c3d4`.
  final String? anchor;

  @override
  State<_ContentView> createState() => _ContentViewState();
}

class _ContentViewState extends State<_ContentView> {
  final _keys = <String, GlobalKey>{};

  @override
  void initState() {
    super.initState();
    final anchor = widget.anchor?.replaceFirst('h-', '');
    if (anchor == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final target = _keys[anchor]?.currentContext;
      if (target != null && target.mounted) {
        Scrollable.ensureVisible(
          target,
          duration: const Duration(milliseconds: 300),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final b in widget.blocks)
          Padding(
            key: b.anchorId == null
                ? null
                : _keys.putIfAbsent(b.anchorId!, GlobalKey.new),
            padding: const EdgeInsets.only(bottom: NiwaTokens.spacingUnit * 2),
            child: switch (b.kind) {
              BlockKind.heading => Semantics(
                header: true,
                child: Text(
                  b.text,
                  style: b.level <= 1 ? text.titleLarge : text.titleMedium,
                ),
              ),
              BlockKind.listItem => Padding(
                padding: EdgeInsetsDirectional.only(
                  start: 16.0 * (b.level - 1),
                ),
                child: Text('•  ${b.text}', style: text.bodyLarge),
              ),
              BlockKind.quote => Container(
                padding: const EdgeInsetsDirectional.only(start: 12),
                decoration: BoxDecoration(
                  border: BorderDirectional(
                    start: BorderSide(
                      color: Theme.of(context).colorScheme.outlineVariant,
                      width: 3,
                    ),
                  ),
                ),
                child: Text(b.text, style: text.bodyLarge),
              ),
              BlockKind.code => Text(
                b.text,
                style: text.bodyMedium?.copyWith(
                  fontFamilyFallback: NiwaTokens.monoFamilies,
                ),
              ),
              BlockKind.paragraph => Text(b.text, style: text.bodyLarge),
            },
          ),
      ],
    );
  }
}

class _ChildrenHeader extends ConsumerWidget {
  const new({required this.item, required this.lens, required this.count});

  final Item item;
  final ItemNature lens;
  final int count;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      title: Semantics(
        header: true,
        child: Text(
          count == 0 ? 'Nothing inside yet' : 'Inside ($count)',
          style: Theme.of(context).textTheme.titleSmall,
        ),
      ),
      trailing: TextButton.icon(
        icon: const Icon(Icons.add),
        label: const Text('Add'),
        onPressed: () =>
            showCreateItemDialog(context, ref, parentId: item.id, nature: lens),
      ),
    );
  }
}

class _ChildrenList extends ConsumerStatefulWidget {
  const new({
    required this.parent,
    required this.children,
    required this.model,
    required this.lens,
  });

  final Item parent;
  final List<ItemSummary> children;
  final TreeModel model;
  final ItemNature lens;

  @override
  ConsumerState<_ChildrenList> createState() => _ChildrenListState();
}

class _ChildrenListState extends ConsumerState<_ChildrenList> {
  /// Order shown while a reorder is in flight, so rows don't jump back.
  List<ItemSummary>? _pending;

  @override
  void didUpdateWidget(_ChildrenList old) {
    super.didUpdateWidget(old);
    if (old.children != widget.children) _pending = null;
  }

  /// [target] is already adjusted for the removal (`onReorderItem`).
  Future<void> _reorder(int oldIndex, int target) async {
    final list = _pending ?? widget.children;
    final item = list[oldIndex];
    final move = reorderMove(list, item, target);
    if (move == null) return;
    setState(
      () => _pending = [...list]
        ..removeAt(oldIndex)
        ..insert(target, item),
    );
    final ok = await ref.read(itemActionsProvider).move(move);
    if (!ok && mounted) setState(() => _pending = null);
  }

  @override
  Widget build(BuildContext context) {
    final list = _pending ?? widget.children;
    final view = lensView(widget.model, widget.lens);
    return ReorderableListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      buildDefaultDragHandles: false,
      itemCount: list.length,
      onReorderItem: _reorder,
      itemBuilder: (context, i) {
        final child = list[i];
        final count = visibleChildren(widget.model, view, child.id).length;
        return ItemRow(
          key: ValueKey(child.id),
          item: child,
          childCount: count,
          dimmed: view.dimmed.contains(child.id),
          onTap: () => context.push('${lensPath(widget.lens)}/${child.id}'),
          onLongPress: () =>
              showItemMenu(context, ref, item: child, model: widget.model),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (count > 0) Text('$count', semanticsLabel: '$count inside'),
              ReorderableDragStartListener(
                index: i,
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Icon(Icons.drag_handle, semanticLabel: 'Reorder'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
