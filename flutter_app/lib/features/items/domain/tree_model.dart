import 'package:niwa/core/models/models.dart';

/// In-memory hierarchy built from the flat `/tree` list — port of
/// `web_app/src/features/items/treeModel.ts`.
class TreeModel {
  const new(this.byId, this.children);

  final Map<String, ItemSummary> byId;

  /// Children in `orderKey` order; key `null` = top level.
  final Map<String?, List<ItemSummary>> children;

  List<ItemSummary> childrenOf(String? parentId) =>
      children[parentId] ?? const [];
}

TreeModel buildTree(Iterable<ItemSummary> items) {
  final byId = {for (final i in items) i.id: i};
  final children = <String?, List<ItemSummary>>{};
  for (final item in byId.values) {
    final parent = item.parentId;
    // Orphans (parent archived or filtered out) are dropped rather than
    // promoted to the top level.
    if (parent != null && !byId.containsKey(parent)) continue;
    (children[parent] ??= []).add(item);
  }
  for (final list in children.values) {
    list.sort((a, b) => a.orderKey.compareTo(b.orderKey));
  }
  return TreeModel(byId, children);
}

/// Root first, excluding [id] itself.
List<ItemSummary> ancestorsOf(TreeModel model, String id) {
  final out = <ItemSummary>[];
  var cur = model.byId[id]?.parentId;
  while (cur != null) {
    final node = model.byId[cur];
    if (node == null) break;
    out.insert(0, node);
    cur = node.parentId;
  }
  return out;
}

bool isDescendant(TreeModel model, String candidateId, String ofId) =>
    ancestorsOf(model, candidateId).any((a) => a.id == ofId);

/// Lens visibility (CONCEPT.md §2): items of the lens's nature plus the
/// ancestors needed to reach them, which are dimmed. Top-level containers are
/// always shown and never dimmed.
class LensView {
  const new(this.visible, this.dimmed);

  final Set<String> visible;
  final Set<String> dimmed;
}

LensView lensView(TreeModel model, ItemNature nature) {
  final visible = <String>{};
  for (final item in model.byId.values) {
    if (item.parentId == null) visible.add(item.id);
    if (item.nature != nature) continue;
    visible.add(item.id);
    for (final a in ancestorsOf(model, item.id)) {
      visible.add(a.id);
    }
  }
  final dimmed = {
    for (final id in visible)
      if (model.byId[id]!.parentId != null && model.byId[id]!.nature != nature)
        id,
  };
  return LensView(visible, dimmed);
}

List<ItemSummary> visibleChildren(
  TreeModel model,
  LensView view,
  String? parentId,
) => [
  for (final c in model.childrenOf(parentId))
    if (view.visible.contains(c.id)) c,
];

/// All descendants of [id] (any lens), for child counts and delete prompts.
int descendantCount(TreeModel model, String id) {
  var n = 0;
  for (final c in model.childrenOf(id)) {
    n += 1 + descendantCount(model, c.id);
  }
  return n;
}

// ---- Moves (CONCEPT.md §1.4). Each returns a request, or null if impossible.

/// Arguments for `ItemsRepository.move`.
class MoveRequest {
  const new({
    required this.id,
    required this.version,
    required this.parentId,
    this.beforeId,
    this.afterId,
  });

  final String id;
  final int version;
  final String? parentId;
  final String? beforeId;
  final String? afterId;

  @override
  String toString() =>
      'MoveRequest($id → parent $parentId, before $beforeId, after $afterId)';
}

List<ItemSummary> _siblings(TreeModel model, ItemSummary item) =>
    model.childrenOf(item.parentId);

MoveRequest? moveUp(TreeModel model, ItemSummary item) {
  final sibs = _siblings(model, item);
  final i = sibs.indexWhere((s) => s.id == item.id);
  if (i <= 0) return null;
  return MoveRequest(
    id: item.id,
    version: item.version,
    parentId: item.parentId,
    beforeId: sibs[i - 1].id,
  );
}

MoveRequest? moveDown(TreeModel model, ItemSummary item) {
  final sibs = _siblings(model, item);
  final i = sibs.indexWhere((s) => s.id == item.id);
  if (i < 0 || i >= sibs.length - 1) return null;
  return MoveRequest(
    id: item.id,
    version: item.version,
    parentId: item.parentId,
    afterId: sibs[i + 1].id,
  );
}

/// Become the last child of the previous sibling.
MoveRequest? indent(TreeModel model, ItemSummary item) {
  final sibs = _siblings(model, item);
  final i = sibs.indexWhere((s) => s.id == item.id);
  if (i <= 0) return null;
  return MoveRequest(
    id: item.id,
    version: item.version,
    parentId: sibs[i - 1].id,
  );
}

/// Become the sibling right after the current parent.
MoveRequest? outdent(TreeModel model, ItemSummary item) {
  final parent = item.parentId == null ? null : model.byId[item.parentId];
  if (parent == null) return null;
  return MoveRequest(
    id: item.id,
    version: item.version,
    parentId: parent.parentId,
    afterId: parent.id,
  );
}

enum DropZone { before, inside, after }

MoveRequest? dropMove(
  TreeModel model,
  ItemSummary dragged,
  ItemSummary target,
  DropZone zone,
) {
  if (dragged.id == target.id || isDescendant(model, target.id, dragged.id)) {
    return null;
  }
  return switch (zone) {
    DropZone.inside => MoveRequest(
      id: dragged.id,
      version: dragged.version,
      parentId: target.id,
    ),
    DropZone.before => MoveRequest(
      id: dragged.id,
      version: dragged.version,
      parentId: target.parentId,
      beforeId: target.id,
    ),
    DropZone.after => MoveRequest(
      id: dragged.id,
      version: dragged.version,
      parentId: target.parentId,
      afterId: target.id,
    ),
  };
}

/// Moving [item] to position [newIndex] among [siblings] (as reported by
/// `ReorderableListView`, already adjusted for the removal). Siblings is the
/// visible list, so the neighbour chosen is a visible one.
MoveRequest? reorderMove(
  List<ItemSummary> siblings,
  ItemSummary item,
  int newIndex,
) {
  final rest = [...siblings]..removeWhere((s) => s.id == item.id);
  if (rest.isEmpty) return null;
  final oldIndex = siblings.indexWhere((s) => s.id == item.id);
  if (oldIndex == newIndex) return null;
  return newIndex >= rest.length
      ? MoveRequest(
          id: item.id,
          version: item.version,
          parentId: item.parentId,
          afterId: rest.last.id,
        )
      : MoveRequest(
          id: item.id,
          version: item.version,
          parentId: item.parentId,
          beforeId: rest[newIndex].id,
        );
}

/// Why [target] can't take [item] as a child, or null if it can. Used by the
/// move-to picker to explain disabled rows.
String? moveTargetProblem(TreeModel model, ItemSummary item, String? target) {
  if (target == item.id) return "Can't move an item into itself";
  if (target != null && isDescendant(model, target, item.id)) {
    return "Can't move an item into its own children";
  }
  if (target == item.parentId) return 'Already here';
  return null;
}
