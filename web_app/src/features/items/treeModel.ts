import type { ItemNature, ItemSummary, MoveItemInput } from '@niwa/contracts';

/** In-memory hierarchy built from the flat /tree list. */
export interface TreeModel {
  byId: Map<string, ItemSummary>;
  /** Children in order; key `null` = top level. */
  children: Map<string | null, ItemSummary[]>;
}

export function buildTree(items: ItemSummary[]): TreeModel {
  const byId = new Map(items.map((i) => [i.id, i]));
  const children = new Map<string | null, ItemSummary[]>();
  for (const item of items) {
    // Orphans (parent archived/filtered out) are dropped rather than promoted to the top level.
    const key = item.parentId && byId.has(item.parentId) ? item.parentId : item.parentId ? undefined : null;
    if (key === undefined) continue;
    const list = children.get(key) ?? [];
    list.push(item);
    children.set(key, list);
  }
  for (const list of children.values()) list.sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1));
  return { byId, children };
}

export function ancestorsOf(model: TreeModel, id: string): ItemSummary[] {
  const out: ItemSummary[] = [];
  let cur = model.byId.get(id)?.parentId ?? null;
  while (cur) {
    const node = model.byId.get(cur);
    if (!node) break;
    out.unshift(node);
    cur = node.parentId;
  }
  return out;
}

export function isDescendant(model: TreeModel, candidateId: string, ofId: string): boolean {
  return ancestorsOf(model, candidateId).some((a) => a.id === ofId);
}

/**
 * Lens visibility — CONCEPT.md §2. A lens shows items of its nature plus the ancestors needed to
 * reach them (dimmed). Top-level containers are always shown and never dimmed.
 */
export interface LensView {
  visible: Set<string>;
  dimmed: Set<string>;
}

export function lensView(model: TreeModel, nature: ItemNature | 'all'): LensView {
  const visible = new Set<string>();
  const dimmed = new Set<string>();
  // Garden › All (B-01 B9): the whole tree, nothing dimmed.
  if (nature === 'all') return { visible: new Set(model.byId.keys()), dimmed };
  for (const item of model.byId.values()) {
    if (item.parentId === null) visible.add(item.id);
    if (item.nature !== nature) continue;
    visible.add(item.id);
    for (const a of ancestorsOf(model, item.id)) visible.add(a.id);
  }
  for (const id of visible) {
    const item = model.byId.get(id)!;
    if (item.parentId !== null && item.nature !== nature) dimmed.add(id);
  }
  return { visible, dimmed };
}

export function visibleChildren(model: TreeModel, view: LensView, parentId: string | null): ItemSummary[] {
  return (model.children.get(parentId) ?? []).filter((c) => view.visible.has(c.id));
}

// ---- Keyboard / menu moves (CONCEPT.md §1.4). Each returns a move request or null if impossible. ----

type Move = { id: string; input: MoveItemInput };

function siblingsOf(model: TreeModel, item: ItemSummary) {
  return model.children.get(item.parentId) ?? [];
}

export function moveUp(model: TreeModel, item: ItemSummary): Move | null {
  const sibs = siblingsOf(model, item);
  const i = sibs.findIndex((s) => s.id === item.id);
  if (i <= 0) return null;
  return {
    id: item.id,
    input: { version: item.version, parentId: item.parentId, beforeId: sibs[i - 1]!.id },
  };
}

export function moveDown(model: TreeModel, item: ItemSummary): Move | null {
  const sibs = siblingsOf(model, item);
  const i = sibs.findIndex((s) => s.id === item.id);
  if (i < 0 || i >= sibs.length - 1) return null;
  return { id: item.id, input: { version: item.version, parentId: item.parentId, afterId: sibs[i + 1]!.id } };
}

/** Become the last child of the previous sibling. */
export function indent(model: TreeModel, item: ItemSummary): Move | null {
  const sibs = siblingsOf(model, item);
  const i = sibs.findIndex((s) => s.id === item.id);
  if (i <= 0) return null;
  return { id: item.id, input: { version: item.version, parentId: sibs[i - 1]!.id } };
}

/** Become the sibling right after the current parent. */
export function outdent(model: TreeModel, item: ItemSummary): Move | null {
  if (!item.parentId) return null;
  const parent = model.byId.get(item.parentId);
  if (!parent) return null;
  return { id: item.id, input: { version: item.version, parentId: parent.parentId, afterId: parent.id } };
}

export type DropZone = 'before' | 'inside' | 'after';

export function dropMove(
  model: TreeModel,
  dragged: ItemSummary,
  target: ItemSummary,
  zone: DropZone,
): Move | null {
  if (dragged.id === target.id || isDescendant(model, target.id, dragged.id)) return null;
  if (zone === 'inside') return { id: dragged.id, input: { version: dragged.version, parentId: target.id } };
  return {
    id: dragged.id,
    input: {
      version: dragged.version,
      parentId: target.parentId,
      ...(zone === 'before' ? { beforeId: target.id } : { afterId: target.id }),
    },
  };
}
