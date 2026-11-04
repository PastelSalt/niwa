import 'package:flutter_test/flutter_test.dart';
import 'package:niwa/core/models/models.dart';
import 'package:niwa/features/items/domain/tree_model.dart';

// Port of web_app/src/features/items/treeModel.test.ts (same tree, same cases).

var _n = 0;

ItemSummary item(
  String title,
  String? parentId, {
  ItemType type = ItemType.note,
  String? orderKey,
}) {
  _n++;
  final id = title.padRight(24, '0').substring(0, 24);
  final actionable = type == ItemType.project || type == ItemType.task;
  return ItemSummary(
    id: id,
    workspaceId: 'w' * 24,
    parentId: parentId,
    title: title,
    type: type,
    nature: actionable ? ItemNature.actionable : ItemNature.knowledge,
    status: ItemStatus.notStarted,
    priority: ItemPriority.none,
    orderKey: orderKey ?? 'a$_n',
    tags: const [],
    dueAt: null,
    estimatedMinutes: null,
    reviewAt: null,
    sourceUrl: null,
    inboxedAt: null,
    suggestedParentId: null,
    archivedAt: null,
    deletedAt: null,
    version: 1,
    createdAt: DateTime.utc(2026),
    updatedAt: DateTime.utc(2026),
    completedAt: null,
  );
}

void main() {
  final college = item('college', null);
  final cs = item('cs301', college.id);
  final pset = item('pset', cs.id, type: ItemType.task);
  final notes = item('notes', cs.id);
  final projects = item('projects', null);
  final site = item('site', projects.id, type: ItemType.project);
  final t1 = item('t1', site.id, type: ItemType.task, orderKey: 'a1');
  final t2 = item('t2', site.id, type: ItemType.task, orderKey: 'a2');
  final model = buildTree([college, cs, pset, notes, projects, site, t2, t1]);

  group('buildTree', () {
    test('orders children by orderKey and drops orphans', () {
      expect(model.childrenOf(site.id).map((c) => c.title), ['t1', 't2']);
      final orphan = item('orphan', 'missing'.padRight(24, '0'));
      expect(buildTree([orphan]).children, isEmpty);
    });

    test('ancestors run root first; descendants counted', () {
      expect(ancestorsOf(model, t1.id).map((a) => a.title), [
        'projects',
        'site',
      ]);
      expect(descendantCount(model, projects.id), 3);
      expect(isDescendant(model, t1.id, projects.id), isTrue);
      expect(isDescendant(model, projects.id, t1.id), isFalse);
    });
  });

  group('lensView', () {
    test('shows matching items plus dimmed ancestors; roots never dimmed', () {
      final v = lensView(model, ItemNature.actionable);
      expect(v.visible.contains(pset.id), isTrue);
      expect(v.visible.contains(notes.id), isFalse);
      expect(v.dimmed.contains(cs.id), isTrue);
      expect(v.dimmed.contains(college.id), isFalse);
      expect(visibleChildren(model, v, cs.id).map((c) => c.title), ['pset']);
    });
  });

  group('moves', () {
    test('up/down/indent/outdent produce server move requests', () {
      final up = moveUp(model, t2)!;
      expect((up.parentId, up.beforeId), (site.id, t1.id));
      expect(moveUp(model, t1), isNull);
      expect(moveDown(model, t1)!.afterId, t2.id);
      expect(indent(model, t2)!.parentId, t1.id);
      expect(indent(model, t1), isNull);
      final out = outdent(model, t1)!;
      expect((out.parentId, out.afterId), (projects.id, site.id));
      expect(outdent(model, college), isNull);
    });

    test('drop refuses self and descendants', () {
      expect(dropMove(model, site, t1, DropZone.inside), isNull);
      expect(dropMove(model, site, site, DropZone.before), isNull);
      expect(dropMove(model, t1, cs, DropZone.inside)!.parentId, cs.id);
      final after = dropMove(model, t1, pset, DropZone.after)!;
      expect((after.parentId, after.afterId), (cs.id, pset.id));
    });

    test('reorder picks a visible neighbour', () {
      final t3 = item('t3', site.id, type: ItemType.task, orderKey: 'a3');
      final sibs = [t1, t2, t3];
      // t3 to the top → before t1.
      expect(reorderMove(sibs, t3, 0)!.beforeId, t1.id);
      // t1 to the end → after t3.
      expect(reorderMove(sibs, t1, 2)!.afterId, t3.id);
      expect(reorderMove(sibs, t2, 1), isNull);
    });

    test('move-to targets explain why they are refused', () {
      expect(moveTargetProblem(model, site, site.id), contains('itself'));
      expect(moveTargetProblem(model, site, t1.id), contains('children'));
      expect(moveTargetProblem(model, site, projects.id), 'Already here');
      expect(moveTargetProblem(model, site, college.id), isNull);
      expect(moveTargetProblem(model, site, null), isNull);
    });
  });
}
