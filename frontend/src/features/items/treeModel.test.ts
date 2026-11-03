import type { ItemSummary, ItemType } from '@niwa/contracts';
import { natureOf } from '@niwa/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildTree,
  dropMove,
  indent,
  lensView,
  moveDown,
  moveUp,
  outdent,
  visibleChildren,
} from './treeModel.ts';

let n = 0;
function item(
  title: string,
  parentId: string | null,
  type: ItemType = 'note',
  orderKey = `a${n}`,
): ItemSummary {
  n++;
  const id = title.padEnd(24, '0').slice(0, 24);
  return {
    id,
    workspaceId: 'w'.repeat(24),
    parentId,
    title,
    type,
    nature: natureOf(type),
    status: 'not_started',
    priority: 'none',
    orderKey,
    tags: [],
    dueAt: null,
    estimatedMinutes: null,
    reviewAt: null,
    sourceUrl: null,
    inboxedAt: null,
    suggestedParentId: null,
    archivedAt: null,
    deletedAt: null,
    version: 1,
    createdAt: '',
    updatedAt: '',
    completedAt: null,
  };
}

const college = item('college', null);
const cs = item('cs301', college.id);
const pset = item('pset', cs.id, 'task');
const notes = item('notes', cs.id);
const projects = item('projects', null);
const site = item('site', projects.id, 'project');
const t1 = item('t1', site.id, 'task', 'a1');
const t2 = item('t2', site.id, 'task', 'a2');
const model = buildTree([college, cs, pset, notes, projects, site, t2, t1]);

describe('buildTree', () => {
  it('orders children by orderKey and drops orphans', () => {
    expect(model.children.get(site.id)!.map((c) => c.title)).toEqual(['t1', 't2']);
    const orphan = item('orphan', 'missing'.padEnd(24, '0'));
    expect(buildTree([orphan]).children.size).toBe(0);
  });
});

describe('lensView', () => {
  it('shows matching items plus dimmed ancestors; roots never dimmed', () => {
    const v = lensView(model, 'actionable');
    expect(v.visible.has(pset.id)).toBe(true);
    expect(v.visible.has(notes.id)).toBe(false);
    expect(v.dimmed.has(cs.id)).toBe(true);
    expect(v.dimmed.has(college.id)).toBe(false);
    expect(visibleChildren(model, v, cs.id).map((c) => c.title)).toEqual(['pset']);
  });
});

describe('moves', () => {
  it('up/down/indent/outdent produce server move requests', () => {
    expect(moveUp(model, t2)?.input).toMatchObject({ parentId: site.id, beforeId: t1.id });
    expect(moveUp(model, t1)).toBeNull();
    expect(moveDown(model, t1)?.input).toMatchObject({ afterId: t2.id });
    expect(indent(model, t2)?.input).toMatchObject({ parentId: t1.id });
    expect(indent(model, t1)).toBeNull();
    expect(outdent(model, t1)?.input).toMatchObject({ parentId: projects.id, afterId: site.id });
    expect(outdent(model, college)).toBeNull();
  });

  it('drop refuses self and descendants', () => {
    expect(dropMove(model, site, t1, 'inside')).toBeNull();
    expect(dropMove(model, site, site, 'before')).toBeNull();
    expect(dropMove(model, t1, cs, 'inside')?.input).toMatchObject({ parentId: cs.id });
    expect(dropMove(model, t1, pset, 'after')?.input).toMatchObject({ parentId: cs.id, afterId: pset.id });
  });
});
