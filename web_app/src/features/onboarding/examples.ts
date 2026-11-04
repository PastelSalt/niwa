import type { ApiClient } from '@niwa/api-client';

/**
 * Optional sample content from the welcome dialog (B-01 B7): a small subtree under Knowledge, clearly
 * titled "Example", that can be deleted like any item. Never added unless the user ticks the box.
 */
export async function addExampleNotes(api: ApiClient): Promise<void> {
  const { items } = await api.items.tree();
  const knowledge = items.find((i) => i.parentId === null && i.title === 'Knowledge');
  if (!knowledge) return;

  const root = await api.items.create({
    parentId: knowledge.id,
    type: 'note',
    title: 'Example: getting started',
  });
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
    title: 'Example note: delete me when done',
  });
}
