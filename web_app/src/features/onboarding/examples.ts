import type { ApiClient } from '@niwa/api-client';
import { ROOT_CONTAINERS } from '@niwa/contracts';

/**
 * Optional starting content from the welcome dialog (B-01 B7, B14). Never added unless the user ticks the box.
 */

/** The classic top-level folders — Knowledge, Projects, College, Personal — skipping any that exist. */
export async function addClassicFolders(api: ApiClient): Promise<void> {
  const { items } = await api.items.tree();
  const existing = new Set(items.filter((i) => i.parentId === null).map((i) => i.title));
  for (const title of ROOT_CONTAINERS) {
    if (!existing.has(title)) await api.items.create({ parentId: null, type: 'note', title });
  }
}

/**
 * A small subtree clearly titled "Example", under Knowledge if it exists, else the first top-level folder;
 * deletable like any item.
 */
export async function addExampleNotes(api: ApiClient): Promise<void> {
  const { items } = await api.items.tree();
  const roots = items.filter((i) => i.parentId === null);
  const home = roots.find((i) => i.title === 'Knowledge') ?? roots[0];
  if (!home) return;

  const root = await api.items.create({ parentId: home.id, type: 'note', title: 'Example: getting started' });
  await api.items.create({
    parentId: root.item.id,
    type: 'idea',
    title: 'Example idea: start a reading list',
  });
  await api.items.create({
    parentId: root.item.id,
    type: 'task',
    title: 'Example task: capture three thoughts',
  });
  await api.items.create({
    parentId: root.item.id,
    type: 'note',
    title: 'Example page: delete me when done',
  });
}
