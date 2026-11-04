import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);

let app: ReturnType<typeof buildApp>;
let auth: { Authorization: string };
let roots: Record<string, string>;

beforeEach(async () => {
  await resetDb();
  app = buildApp();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'me@example.com', password: 'correct horse battery staple' })
    .expect(201);
  auth = { Authorization: `Bearer ${res.body.accessToken}` };
  const tree = await request(app).get('/api/v1/tree').set(auth);
  roots = Object.fromEntries(tree.body.items.map((i: { title: string; id: string }) => [i.title, i.id]));
});

type Item = {
  id: string;
  version: number;
  title: string;
  inboxedAt: string | null;
  parentId: string | null;
  type: string;
  suggestedParentId: string | null;
};

const capture = (body: object) => request(app).post('/api/v1/inbox').set(auth).send(body);
const inbox = async (): Promise<Item[]> =>
  (await request(app).get('/api/v1/inbox').set(auth).expect(200)).body.items;
const file = (item: Item, body: object) =>
  request(app)
    .post(`/api/v1/items/${item.id}/file`)
    .set(auth)
    .send({ version: item.version, ...body });
const search = async (qs: string) =>
  (await request(app).get(`/api/v1/search?${qs}`).set(auth).expect(200)).body.hits;
const doc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

describe('inbox', () => {
  it('captures as an idea outside the tree, newest first', async () => {
    const a = (await capture({ title: 'Buy seeds' }).expect(201)).body.item as Item;
    await capture({ title: 'Read about BGP', type: 'note' }).expect(201);
    expect(a).toMatchObject({ type: 'idea', parentId: null, inboxedAt: expect.any(String) });

    expect((await inbox()).map((i) => i.title)).toEqual(['Read about BGP', 'Buy seeds']);
    const tree = (await request(app).get('/api/v1/tree').set(auth)).body.items.map((i: Item) => i.title);
    expect(tree).not.toContain('Buy seeds');
  });

  it('a repeated clientId returns the first capture instead of a duplicate', async () => {
    const clientId = '0b6f9a2e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';
    const first = (await capture({ title: 'Offline thought', clientId }).expect(201)).body.item as Item;
    const retry = (await capture({ title: 'Offline thought', clientId }).expect(201)).body.item as Item;
    expect(retry.id).toBe(first.id);
    expect(retry).not.toHaveProperty('clientId');
    expect(retry).not.toHaveProperty('captureClientId');

    // Concurrent retries (both miss the lookup) still create one item.
    const raced = '7d3c1f00-aaaa-4bbb-8ccc-0123456789ab';
    const [a, b] = await Promise.all([
      capture({ title: 'Race', clientId: raced }).expect(201),
      capture({ title: 'Race', clientId: raced }).expect(201),
    ]);
    expect(a.body.item.id).toBe(b.body.item.id);
    expect((await inbox()).filter((i) => i.title === 'Race')).toHaveLength(1);
    expect((await inbox()).filter((i) => i.title === 'Offline thought')).toHaveLength(1);

    // Without a clientId captures stay independent; a bad one is rejected.
    await capture({ title: 'Twice' }).expect(201);
    await capture({ title: 'Twice' }).expect(201);
    expect((await inbox()).filter((i) => i.title === 'Twice')).toHaveLength(2);
    await capture({ title: 'x', clientId: 'not-a-uuid' }).expect(400);
  });

  it('remembers a suggested parent (ignoring unknown ones)', async () => {
    const ok = (await capture({ title: 'x', suggestedParentId: roots.Projects }).expect(201)).body.item;
    const bad = (await capture({ title: 'y', suggestedParentId: 'f'.repeat(24) }).expect(201)).body.item;
    expect(ok.suggestedParentId).toBe(roots.Projects);
    expect(bad.suggestedParentId).toBeNull();
  });

  it('files into the tree with type, due date and tags', async () => {
    const item = (await capture({ title: 'Problem set', suggestedParentId: roots.College }).expect(201)).body
      .item;
    const filed = (
      await file(item, {
        parentId: roots.College,
        type: 'task',
        dueAt: '2026-11-20',
        tags: ['CS 301'],
      }).expect(200)
    ).body.item;
    expect(filed).toMatchObject({
      parentId: roots.College,
      inboxedAt: null,
      suggestedParentId: null,
      type: 'task',
      nature: 'actionable',
      dueAt: '2026-11-20',
      tags: ['cs-301'],
    });
    expect(await inbox()).toHaveLength(0);
    const kids = (await request(app).get(`/api/v1/items?parentId=${roots.College}`).set(auth)).body.items;
    expect(kids.map((k: Item) => k.title)).toEqual(['Problem set']);
  });

  it('rejects filing twice, stale versions, and inbox parents', async () => {
    const a = (await capture({ title: 'A' })).body.item;
    const b = (await capture({ title: 'B' })).body.item;
    await file(a, { parentId: b.id }).expect(400);
    await file({ ...a, version: 99 }, { parentId: roots.Personal }).expect(409);
    const filed = (await file(a, { parentId: roots.Personal }).expect(200)).body.item;
    await file(filed, { parentId: roots.Personal }).expect(409);
  });

  it('inbox items cannot be moved, only filed', async () => {
    const a = (await capture({ title: 'A' })).body.item;
    await request(app)
      .post(`/api/v1/items/${a.id}/move`)
      .set(auth)
      .send({ version: 1, parentId: roots.Personal })
      .expect(409);
  });
});

describe('search', () => {
  beforeEach(async () => {
    const mk = (title: string, extra: object = {}) =>
      request(app)
        .post('/api/v1/items')
        .set(auth)
        .send({ title, parentId: roots.Knowledge, ...extra })
        .expect(201);
    await mk('BGP path selection', {
      content: doc('Prefer the shortest AS path. Local preference wins first.'),
      tags: ['routing'],
    });
    await mk('OSPF areas', {
      content: doc('Link-state protocol; area 0 is the backbone.'),
      tags: ['routing'],
    });
    await mk('Grocery list', { type: 'task', content: doc('Eggs, rice, path-finding snacks') });
    const old = (await mk('Old networking notes', { content: doc('Spanning tree.') })).body.item;
    await request(app).post(`/api/v1/items/${old.id}/archive`).set(auth).send({ version: 1 }).expect(200);
    await capture({ title: 'Networking meetup idea' });
  });

  it('ranks title matches over body matches and returns snippets', async () => {
    const hits = await search('q=path');
    expect(hits[0].item.title).toBe('BGP path selection');
    expect(hits[0].matchedIn).toBe('title');
    const body = hits.find((h: { item: Item }) => h.item.title === 'Grocery list');
    expect(body?.matchedIn).toBe('content');
    expect(body?.snippet).toContain('path-finding');
  });

  it('matches tags and partial words, and includes the inbox', async () => {
    expect((await search('q=routing')).map((h: { item: Item }) => h.item.title).sort()).toEqual([
      'BGP path selection',
      'OSPF areas',
    ]);
    const partial = (await search('q=netw')).map((h: { item: Item }) => h.item.title);
    expect(partial).toEqual(['Networking meetup idea']); // archived excluded by default
    expect((await search('q=backb')).map((h: { item: Item }) => h.item.title)).toEqual(['OSPF areas']);
  });

  it('filters by type/nature and can include archived', async () => {
    expect((await search('q=path&nature=actionable')).map((h: { item: Item }) => h.item.title)).toEqual([
      'Grocery list',
    ]);
    const withArchived = (await search('q=networking&includeArchived=true')).map(
      (h: { item: Item }) => h.item.title,
    );
    expect(withArchived).toContain('Old networking notes');
  });

  it('never returns deleted items and needs a query', async () => {
    const hit = (await search('q=OSPF'))[0];
    await request(app).delete(`/api/v1/items/${hit.item.id}`).set(auth).expect(200);
    expect(await search('q=OSPF')).toHaveLength(0);
    await request(app).get('/api/v1/search?q=').set(auth).expect(400);
  });

  it('treats regex characters literally', async () => {
    expect(await search(`q=${encodeURIComponent('(.*')}`)).toEqual([]);
  });
});
