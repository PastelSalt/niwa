import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);

let app: ReturnType<typeof buildApp>;
let auth: { Authorization: string };

beforeEach(async () => {
  await resetDb();
  app = buildApp({ REGISTRATION_MODE: 'open' });
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'me@example.com', password: 'correct horse battery staple' })
    .expect(201);
  auth = { Authorization: `Bearer ${res.body.accessToken}` };
});

type Item = { id: string; version: number; title: string; content: unknown };

async function make(title: string, extra: object = {}): Promise<Item> {
  const res = await request(app)
    .post('/api/v1/items')
    .set(auth)
    .send({ title, parentId: null, ...extra })
    .expect(201);
  return res.body.item;
}
const get = async (id: string): Promise<Item> =>
  (await request(app).get(`/api/v1/items/${id}`).set(auth).expect(200)).body.item;
const links = (id: string) => request(app).get(`/api/v1/items/${id}/links`).set(auth).expect(200);
const save = (item: Item, content: object) =>
  request(app).patch(`/api/v1/items/${item.id}`).set(auth).send({ version: item.version, content });

const p = (...content: object[]) => ({ type: 'paragraph', content });
const text = (t: string) => ({ type: 'text', text: t });
const h = (level: number, anchorId: string, t: string) => ({
  type: 'heading',
  attrs: { level, anchorId },
  content: [text(t)],
});
const link = (itemId: string, anchorId: string | null = null, title = 'x') => ({
  type: 'niwaLink',
  attrs: { itemId, anchorId, title },
});
const doc = (...content: object[]) => ({ type: 'doc', content });

describe('content links', () => {
  it('syncs niwaLink nodes into links and shows backlinks with section names', async () => {
    const bgp = await make('BGP', { content: doc(h(2, 'paths', 'Path selection'), p(text('…'))) });
    const ospf = await make('OSPF');
    const net = await make('Networking');

    await save(net, doc(p(text('See '), link(bgp.id, 'paths', 'BGP'), text(' and '), link(ospf.id)))).expect(
      200,
    );

    const out = await links(net.id);
    expect(out.body.outgoing.map((l: { item: Item }) => l.item.title).sort()).toEqual(['BGP', 'OSPF']);
    const toBgp = out.body.outgoing.find((l: { item: Item }) => l.item.title === 'BGP');
    expect(toBgp.link).toMatchObject({
      origin: 'content',
      targetAnchorId: 'paths',
      targetSection: 'Path selection',
    });

    const back = await links(bgp.id);
    expect(back.body.backlinks).toHaveLength(1);
    expect(back.body.backlinks[0].item.title).toBe('Networking');
    expect(back.body.backlinks[0].link.targetSection).toBe('Path selection');

    // Removing the node removes the link on next save.
    const fresh = await get(net.id);
    await save(fresh, doc(p(text('Only '), link(ospf.id)))).expect(200);
    expect((await links(bgp.id)).body.backlinks).toHaveLength(0);
  });

  it('ignores self-links, unknown ids and other workspaces', async () => {
    const a = await make('A');
    await save(a, doc(p(link(a.id), link('f'.repeat(24)), link('not-an-id')))).expect(200);
    expect((await links(a.id)).body.outgoing).toHaveLength(0);
  });

  it('hides links to deleted items and drops them on purge', async () => {
    const target = await make('Target');
    const src = await make('Source');
    await save(src, doc(p(link(target.id)))).expect(200);

    await request(app).delete(`/api/v1/items/${target.id}`).set(auth).expect(200);
    expect((await links(src.id)).body.outgoing).toHaveLength(0);

    await request(app).post(`/api/v1/items/${target.id}/restore`).set(auth).expect(200);
    expect((await links(src.id)).body.outgoing).toHaveLength(1);

    await request(app).delete(`/api/v1/items/${target.id}`).set(auth).expect(200);
    await request(app).delete(`/api/v1/items/${target.id}/permanent`).set(auth).expect(200);
    const { LinkModel } = await import('../src/models/link.model.ts');
    expect(await LinkModel.countDocuments()).toBe(0);
  });
});

describe('manual (related) links', () => {
  it('creates, rejects duplicates and self, and deletes', async () => {
    const a = await make('A');
    const b = await make('B');
    const res = await request(app)
      .post('/api/v1/links')
      .set(auth)
      .send({ sourceId: a.id, targetId: b.id })
      .expect(201);
    expect(res.body.link.origin).toBe('manual');
    await request(app).post('/api/v1/links').set(auth).send({ sourceId: a.id, targetId: b.id }).expect(409);
    await request(app).post('/api/v1/links').set(auth).send({ sourceId: a.id, targetId: a.id }).expect(400);

    expect((await links(b.id)).body.backlinks).toHaveLength(1);
    await request(app).delete(`/api/v1/links/${res.body.link.id}`).set(auth).expect(204);
    expect((await links(b.id)).body.backlinks).toHaveLength(0);
  });

  it('content saves never touch manual links, and content links cannot be deleted directly', async () => {
    const a = await make('A');
    const b = await make('B');
    const c = await make('C');
    await request(app).post('/api/v1/links').set(auth).send({ sourceId: a.id, targetId: b.id }).expect(201);
    await save(a, doc(p(link(c.id)))).expect(200);
    await save(await get(a.id), doc(p(text('nothing')))).expect(200);
    const out = (await links(a.id)).body.outgoing;
    expect(out.map((l: { item: Item }) => l.item.title)).toEqual(['B']);

    await save(await get(a.id), doc(p(link(c.id)))).expect(200);
    const contentLink = (await links(a.id)).body.outgoing.find(
      (l: { link: { origin: string } }) => l.link.origin === 'content',
    );
    await request(app).delete(`/api/v1/links/${contentLink.link.id}`).set(auth).expect(409);
  });
});

describe('review queue', () => {
  it('lists items due for review today or earlier', async () => {
    await make('Past', { reviewAt: '2026-10-01' });
    await make('Today', { reviewAt: '2026-11-03' });
    await make('Future', { reviewAt: '2026-12-01' });
    await make('Never');
    const res = await request(app).get('/api/v1/review?today=2026-11-03').set(auth).expect(200);
    expect(res.body.items.map((i: Item) => i.title)).toEqual(['Past', 'Today']);
  });
});

describe('promote section', () => {
  it('moves a heading section into a new child and leaves an inline link', async () => {
    const note = await make('Cybersecurity', {
      content: doc(
        p(text('Intro')),
        h(2, 'crypto', 'Cryptography'),
        p(text('ciphers')),
        h(3, 'aes', 'AES'),
        p(text('blocks')),
        h(2, 'netsec', 'Network Security'),
        p(text('firewalls')),
      ),
    });

    const res = await request(app)
      .post(`/api/v1/items/${note.id}/promote-section`)
      .set(auth)
      .send({ version: note.version, anchorId: 'crypto' })
      .expect(200);

    const { parent, child } = res.body;
    expect(child).toMatchObject({ title: 'Cryptography', parentId: note.id, type: 'note' });
    // The child keeps the subsection (level 3 belongs to the level 2 section).
    expect(JSON.stringify(child.content)).toContain('AES');
    expect(JSON.stringify(child.content)).not.toContain('Network Security');

    const parentJson = JSON.stringify(parent.content);
    expect(parentJson).not.toContain('ciphers');
    expect(parentJson).toContain('Network Security');
    expect(parentJson).toContain(child.id);
    expect((await links(child.id)).body.backlinks[0].item.title).toBe('Cybersecurity');
  });

  it('rejects stale versions and missing headings without creating a child', async () => {
    const note = await make('N', { content: doc(h(2, 'a', 'A'), p(text('x'))) });
    await request(app)
      .post(`/api/v1/items/${note.id}/promote-section`)
      .set(auth)
      .send({ version: 99, anchorId: 'a' })
      .expect(409);
    await request(app)
      .post(`/api/v1/items/${note.id}/promote-section`)
      .set(auth)
      .send({ version: 1, anchorId: 'zz' })
      .expect(400);
    const tree = await request(app).get('/api/v1/tree').set(auth);
    expect(tree.body.items.filter((i: Item) => i.title === 'A')).toHaveLength(0);
  });
});
