import { localDay, MemoryWorkspace } from './memoryApi.ts';

/**
 * The playground's example garden (NIWA-PLAN-B-02 V11). Invented content, dated relative to the visitor's
 * today so Focus and the Scheduler always have something to show. Every feature it touches exists in the
 * real app (B-01 truth rule).
 */

type Block = Record<string, unknown>;
const doc = (...content: Block[]) => ({ type: 'doc' as const, content });
const p = (text: string): Block => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const h = (level: number, text: string): Block => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text }],
});
const ul = (...items: string[]): Block => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
});

/** Local wall-clock time `hh:mm` on `day` (+n days from today) as an ISO instant. */
const at = (days: number, hh: number, mm = 0) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, hh, mm).toISOString();
};

export function exampleWorkspace(): MemoryWorkspace {
  const ws = new MemoryWorkspace({ email: 'example@niwa.example' });
  const add = ws.add.bind(ws);

  // College: a course with notes and a task.
  const bio = add({
    parentId: ws.root('College'),
    title: 'Biology 101',
    type: 'project',
    status: 'in_progress',
    tags: ['bio101'],
    content: doc(p('Lectures, labs and reading for the semester.')),
  });
  const cells = add({
    parentId: bio.id,
    title: 'Lecture 3: How cells make energy',
    tags: ['bio101'],
    reviewAt: localDay(0),
    content: doc(
      h(2, 'The big picture'),
      p('Cells turn food into ATP, the energy currency they spend on everything else.'),
      ul(
        'Glycolysis happens in the cytoplasm',
        'The Krebs cycle runs in the mitochondria',
        'Most ATP comes from the electron transport chain',
      ),
      h(2, 'Questions for the study group'),
      p('Why does the electron transport chain need oxygen at the end?'),
    ),
  });
  add({
    parentId: bio.id,
    title: 'Lab report: enzyme activity',
    type: 'task',
    priority: 'high',
    status: 'in_progress',
    dueAt: localDay(1),
  });
  add({ parentId: bio.id, title: 'Read chapter 4 before Thursday', type: 'task', dueAt: localDay(2) });
  add({ parentId: bio.id, title: 'Idea: draw the cycle as a comic', type: 'idea', tags: ['someday'] });

  // Projects: a trip with tasks across statuses.
  const trip = add({
    parentId: ws.root('Projects'),
    title: 'Weekend trip to the coast',
    type: 'project',
    priority: 'medium',
  });
  add({
    parentId: trip.id,
    title: 'Book the train tickets',
    type: 'task',
    priority: 'critical',
    dueAt: localDay(-1),
  });
  add({
    parentId: trip.id,
    title: 'Find a place to stay',
    type: 'task',
    status: 'completed',
    priority: 'low',
  });
  add({ parentId: trip.id, title: 'Pack the camera', type: 'task', dueAt: localDay(4) });

  // Knowledge and Personal.
  add({
    parentId: ws.root('Knowledge'),
    title: 'Books to read',
    content: doc(ul('A Pattern Language', 'The Overstory', 'Braiding Sweetgrass')),
  });
  const garden = add({ parentId: ws.root('Personal'), title: 'Balcony garden', type: 'project' });
  add({ parentId: garden.id, title: 'Repot the basil', type: 'task', dueAt: localDay(0) });
  add({
    parentId: garden.id,
    title: 'What grows in partial shade',
    content: doc(p('Mint, parsley and lettuce cope with a few hours of sun.')),
  });

  // Inbox: captured, not filed yet.
  ws.add({
    parentId: null,
    title: 'Ask Sam about the study group',
    type: 'idea',
    inboxedAt: new Date().toISOString(),
  });
  ws.add({
    parentId: null,
    title: 'Try the cafe near the library',
    type: 'idea',
    inboxedAt: new Date().toISOString(),
  });

  // Schedule: this week.
  const event = (title: string, start: string, end: string, extra: Record<string, unknown> = {}) =>
    ws.handle('POST', '/schedule', new URLSearchParams(), {
      kind: 'event',
      title,
      startAt: start,
      endAt: end,
      ...extra,
    });
  event('Biology lecture', at(0, 10), at(0, 11, 30), { recurrence: 'weekly' });
  event('Study group', at(1, 16), at(1, 17, 30), { color: '#E3A1B4' });
  ws.handle('POST', '/schedule', new URLSearchParams(), {
    kind: 'block',
    itemId: cells.id,
    startAt: at(2, 9),
    endAt: at(2, 10),
  });

  return ws;
}
