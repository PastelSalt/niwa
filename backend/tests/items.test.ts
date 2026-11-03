import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);

type App = ReturnType<typeof buildApp>;
let app: App;
let auth: { Authorization: string };
let roots: Record<string, { id: string; version: number }>;

async function signIn(email = 'me@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'correct horse battery staple' })
    .expect(201);
  return { Authorization: `Bearer ${res.body.accessToken}` };
}

const api = {
  tree: (q = '') => request(app).get(`/api/v1/tree${q}`).set(auth),
  create: (body: object) => request(app).post('/api/v1/items').set(auth).send(body),
  get: (id: string) => request(app).get(`/api/v1/items/${id}`).set(auth),
  patch: (id: string, body: object) => request(app).patch(`/api/v1/items/${id}`).set(auth).send(body),
  move: (id: string, body: object) => request(app).post(`/api/v1/items/${id}/move`).set(auth).send(body),
  del: (id: string) => request(app).delete(`/api/v1/items/${id}`).set(auth),
  restore: (id: string) => request(app).post(`/api/v1/items/${id}/restore`).set(auth),
  purge: (id: string) => request(app).delete(`/api/v1/items/${id}/permanent`).set(auth),
  children: (parentId: string) => request(app).get(`/api/v1/items?parentId=${parentId}`).set(auth),
};

async function make(title: string, parentId: string | null, extra: object = {}) {
  const res = await api.create({ title, parentId, ...extra }).expect(201);
  return res.body.item as { id: string; version: number; orderKey: string };
}

const titles = (items: { title: string }[]) => items.map((i) => i.title);

beforeEach(async () => {
  await resetDb();
  app = buildApp({ REGISTRATION_MODE: 'open' });
  auth = await signIn();
  const tree = await api.tree().expect(200);
  roots = Object.fromEntries(
    tree.body.items.map((i: { title: string; id: string; version: number }) => [i.title, i]),
  );
});

describe('create & read', () => {
  it('creates children at any depth with derived nature and appended order', async () => {
    const course = await make('CS 301', roots.College!.id);
    const week = await make('Week 1', course.id);
    const pset = await make('Problem set 1', week.id, {
      type: 'task',
      priority: 'high',
      dueAt: '2026-11-10',
    });
    const notes = await make('Lecture notes', week.id);

    const kids = await api.children(week.id).expect(200);
    expect(titles(kids.body.items)).toEqual(['Problem set 1', 'Lecture notes']);

    const got = await api.get(pset.id).expect(200);
    expect(got.body.item).toMatchObject({
      type: 'task',
      nature: 'actionable',
      status: 'not_started',
      version: 1,
    });
    expect((await api.get(notes.id)).body.item.nature).toBe('knowledge');

    const anc = await request(app).get(`/api/v1/items/${pset.id}/ancestors`).set(auth).expect(200);
    expect(titles(anc.body.items)).toEqual(['College', 'CS 301', 'Week 1']);
  });

  it('inserts after a given sibling', async () => {
    const a = await make('A', roots.Projects!.id);
    await make('C', roots.Projects!.id);
    await make('B', roots.Projects!.id, { afterId: a.id });
    expect(titles((await api.children(roots.Projects!.id)).body.items)).toEqual(['A', 'B', 'C']);
  });

  it('rejects unknown parents and other workspaces', async () => {
    await api.create({ title: 'x', parentId: 'f'.repeat(24) }).expect(400);
    const mine = await make('Mine', null);

    const otherAuth = await signIn('other@example.com');
    await request(app).get(`/api/v1/items/${mine.id}`).set(otherAuth).expect(404);
    await request(app)
      .patch(`/api/v1/items/${mine.id}`)
      .set(otherAuth)
      .send({ version: 1, title: 'pwned' })
      .expect(404);
  });

  it('requires auth', async () => {
    await request(app).get('/api/v1/tree').expect(401);
  });
});

describe('update', () => {
  it('bumps version, sets completedAt, and rejects stale versions with the current item', async () => {
    const t = await make('Task', roots.Projects!.id, { type: 'task' });
    const done = await api
      .patch(t.id, { version: 1, status: 'completed', tags: ['Deep Work', 'deep work'] })
      .expect(200);
    expect(done.body.item).toMatchObject({ version: 2, status: 'completed', tags: ['deep-work'] });
    expect(done.body.item.completedAt).toEqual(expect.any(String));

    const stale = await api.patch(t.id, { version: 1, title: 'late' }).expect(409);
    expect(stale.body.error.code).toBe('VERSION_CONFLICT');
    expect(stale.body.error.details.current.version).toBe(2);

    const reopened = await api.patch(t.id, { version: 2, status: 'in_progress' }).expect(200);
    expect(reopened.body.item.completedAt).toBeNull();
  });

  it('keeps actionable fields across a type round trip (lossless)', async () => {
    const t = await make('Idea', null, { type: 'task', priority: 'high', dueAt: '2026-12-01' });
    const asNote = await api.patch(t.id, { version: 1, type: 'note' }).expect(200);
    expect(asNote.body.item).toMatchObject({ nature: 'knowledge', priority: 'high', dueAt: '2026-12-01' });
    const back = await api.patch(t.id, { version: 2, type: 'project' }).expect(200);
    expect(back.body.item).toMatchObject({ nature: 'actionable', priority: 'high' });
  });

  it('extracts searchable plain text from content', async () => {
    const n = await make('Note', null);
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'BGP' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Path vector protocol.' }] },
      ],
    };
    await api.patch(n.id, { version: 1, content }).expect(200);
    const { ItemModel } = await import('../src/models/item.model.ts');
    const raw = await ItemModel.findById(n.id).lean();
    expect(raw?.contentPlainText).toBe('BGP\nPath vector protocol.');
  });
});

describe('move & reorder', () => {
  it('reorders within a parent and moves across parents', async () => {
    const p = roots.Projects!.id;
    const a = await make('A', p);
    const b = await make('B', p);
    const c = await make('C', p);

    await api.move(c.id, { version: c.version, parentId: p, beforeId: a.id }).expect(200);
    expect(titles((await api.children(p)).body.items)).toEqual(['C', 'A', 'B']);

    await api.move(a.id, { version: a.version, parentId: p, afterId: b.id }).expect(200);
    expect(titles((await api.children(p)).body.items)).toEqual(['C', 'B', 'A']);

    await api.move(b.id, { version: b.version, parentId: roots.Personal!.id }).expect(200);
    expect(titles((await api.children(roots.Personal!.id)).body.items)).toEqual(['B']);
    expect(titles((await api.children(p)).body.items)).toEqual(['C', 'A']);
  });

  it('prevents cycles and self-parenting', async () => {
    const a = await make('A', null);
    const b = await make('B', a.id);
    const c = await make('C', b.id);
    await api.move(a.id, { version: 1, parentId: c.id }).expect(400);
    await api.move(a.id, { version: 1, parentId: a.id }).expect(400);
  });

  it('rejects neighbours from another parent', async () => {
    const a = await make('A', roots.Projects!.id);
    const x = await make('X', roots.Personal!.id);
    await api.move(a.id, { version: 1, parentId: roots.Projects!.id, afterId: x.id }).expect(400);
  });

  it('keeps order sane under many inserts at the same spot (rebalance)', async () => {
    const p = (await make('P', null)).id;
    const first = await make('first', p);
    const last = await make('last', p);
    let prev = first;
    for (let i = 0; i < 60; i++) {
      const n = await make(`n${i}`, p);
      // always squeeze right after `first`, pushing keys longer
      const moved = await api.move(n.id, { version: n.version, parentId: p, afterId: first.id }).expect(200);
      prev = moved.body.item;
    }
    const kids = (await api.children(p)).body.items as { title: string; orderKey: string }[];
    expect(kids[0]!.title).toBe('first');
    expect(kids[1]!.title).toBe(prev && 'n59');
    expect(kids.at(-1)!.title).toBe(last && 'last');
    expect(Math.max(...kids.map((k) => k.orderKey.length))).toBeLessThanOrEqual(51);
  });
});

describe('archive', () => {
  it('hides archived subtrees from the tree unless requested', async () => {
    const a = await make('Old project', roots.Projects!.id, { type: 'project' });
    await make('Old task', a.id, { type: 'task' });
    await request(app).post(`/api/v1/items/${a.id}/archive`).set(auth).send({ version: 1 }).expect(200);

    expect(titles((await api.tree()).body.items)).not.toContain('Old project');
    expect(titles((await api.tree('?includeArchived=true')).body.items)).toContain('Old project');
  });
});

describe('delete, trash, restore, purge', () => {
  it('cascades soft delete and restores the whole batch', async () => {
    const proj = await make('Project', roots.Projects!.id, { type: 'project' });
    const t1 = await make('Task 1', proj.id, { type: 'task' });
    await make('Sub', t1.id);

    const del = await api.del(proj.id).expect(200);
    expect(del.body).toEqual({ ok: true, affected: 3 });
    expect(titles((await api.tree()).body.items)).not.toContain('Task 1');
    await api.get(t1.id).expect(404);

    const trash = await request(app).get('/api/v1/trash').set(auth).expect(200);
    expect(titles(trash.body.items)).toEqual(['Project']);

    const restored = await api.restore(proj.id).expect(200);
    expect(restored.body).toMatchObject({ restoredTo: 'original', restoredCount: 3 });
    expect(restored.body.item.parentId).toBe(roots.Projects!.id);
    await api.get(t1.id).expect(200);
  });

  it('does not resurrect children that were deleted earlier in a separate batch', async () => {
    const proj = await make('Project', null);
    const early = await make('Deleted first', proj.id);
    await make('Kept', proj.id);
    await api.del(early.id).expect(200);
    await api.del(proj.id).expect(200);

    await api.restore(proj.id).expect(200);
    expect(titles((await api.children(proj.id)).body.items)).toEqual(['Kept']);
    expect(titles((await request(app).get('/api/v1/trash').set(auth)).body.items)).toEqual(['Deleted first']);
  });

  it('restores into the Inbox when the original parent is gone', async () => {
    const parent = await make('Parent', null);
    const child = await make('Child', parent.id);
    await api.del(child.id).expect(200);
    await api.del(parent.id).expect(200); // parent stays in Trash

    const res = await api.restore(child.id).expect(200);
    expect(res.body.restoredTo).toBe('inbox');
    expect(res.body.item).toMatchObject({ parentId: null, inboxedAt: expect.any(String) });
  });

  it('purges only items that are in Trash, including everything under them', async () => {
    const live = await make('Live', null);
    await api.purge(live.id).expect(409);

    const p = await make('P', null);
    const c = await make('C', p.id);
    await api.del(p.id).expect(200);
    const res = await api.purge(c.id).expect(200);
    expect(res.body.affected).toBe(2);
    await api.restore(p.id).expect(404);
  });
});

describe('focus', () => {
  it('groups open actionable items by section', async () => {
    const p = roots.Projects!.id;
    await make('Doing', p, { type: 'task', status: 'in_progress' });
    await make('Urgent', p, { type: 'task', priority: 'critical' });
    await make('Late', p, { type: 'task', dueAt: '2026-11-01' });
    await make('Soon', p, { type: 'task', dueAt: '2026-11-05' });
    await make('Far', p, { type: 'task', dueAt: '2026-12-25' });
    await make('Done late', p, { type: 'task', dueAt: '2026-10-01', status: 'completed' });
    await make('A note', p, { type: 'note', priority: 'high', dueAt: '2026-11-01' });

    const res = await request(app).get('/api/v1/focus?today=2026-11-03').set(auth).expect(200);
    expect(titles(res.body.inProgress)).toEqual(['Doing']);
    expect(titles(res.body.highPriority)).toEqual(['Urgent']);
    expect(titles(res.body.overdue)).toEqual(['Late']);
    expect(titles(res.body.upcoming)).toEqual(['Soon']);
    expect(res.body.recentlyUpdated).toHaveLength(6);
  });

  it('requires a valid today', async () => {
    await request(app).get('/api/v1/focus').set(auth).expect(400);
  });
});

describe('tags', () => {
  it('counts and renames (merging duplicates)', async () => {
    await make('a', null, { tags: ['bgp', 'net'] });
    await make('b', null, { tags: ['bgp', 'routing'] });
    const counts = await request(app).get('/api/v1/tags').set(auth).expect(200);
    expect(counts.body.tags[0]).toEqual({ tag: 'bgp', count: 2 });

    const renamed = await request(app)
      .post('/api/v1/tags/rename')
      .set(auth)
      .send({ from: 'bgp', to: 'Routing' })
      .expect(200);
    expect(renamed.body.updated).toBe(2);
    const after = await request(app).get('/api/v1/tags').set(auth);
    expect(after.body.tags).toEqual(
      expect.arrayContaining([
        { tag: 'routing', count: 2 },
        { tag: 'net', count: 1 },
      ]),
    );
    expect(after.body.tags.find((t: { tag: string }) => t.tag === 'bgp')).toBeUndefined();
  });
});
