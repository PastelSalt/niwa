import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);

let app: ReturnType<typeof buildApp>;
let auth: { Authorization: string };

beforeEach(async () => {
  await resetDb();
  app = buildApp();
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'me@example.com', password: 'correct horse battery staple' })
    .expect(201);
  auth = { Authorization: `Bearer ${res.body.accessToken}` };
});

type Entry = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  seriesId: string | null;
  seriesIndex: number | null;
  kind: string;
  itemId: string | null;
  isAllDay: boolean;
};

const create = (body: object) => request(app).post('/api/v1/schedule').set(auth).send(body);
const range = async (from: string, to: string): Promise<Entry[]> =>
  (await request(app).get(`/api/v1/schedule?from=${from}&to=${to}`).set(auth).expect(200)).body.entries;
const patch = (id: string, body: object, scope = 'instance') =>
  request(app).patch(`/api/v1/schedule/${id}?scope=${scope}`).set(auth).send(body);
const del = (id: string, scope = 'instance') =>
  request(app).delete(`/api/v1/schedule/${id}?scope=${scope}`).set(auth);

const NOV = ['2026-11-01T00:00:00Z', '2026-12-01T00:00:00Z'] as const;
const days = (es: Entry[]) => es.map((e) => e.startAt.slice(0, 10));

describe('events', () => {
  it('creates, lists by overlap, moves and deletes', async () => {
    const res = await create({
      kind: 'event',
      title: 'Dentist',
      startAt: '2026-11-10T07:00:00Z',
      endAt: '2026-11-10T08:00:00Z',
    }).expect(201);
    expect(res.body.entry).toMatchObject({ title: 'Dentist', recurrence: 'none', seriesId: null });

    expect(await range('2026-11-10T07:30:00Z', '2026-11-10T07:45:00Z')).toHaveLength(1);
    expect(await range('2026-11-11T00:00:00Z', '2026-11-12T00:00:00Z')).toHaveLength(0);

    const moved = await patch(res.body.entry.id, {
      startAt: '2026-11-12T07:00:00Z',
      endAt: '2026-11-12T08:00:00Z',
    }).expect(200);
    expect(moved.body.entry.startAt).toBe('2026-11-12T07:00:00.000Z');

    await del(res.body.entry.id).expect(204);
    expect(await range(...NOV)).toHaveLength(0);
  });

  it('validates: events need titles, end after start, sane ranges', async () => {
    await create({ kind: 'event', startAt: '2026-11-10T07:00:00Z', endAt: '2026-11-10T08:00:00Z' }).expect(
      400,
    );
    await create({
      kind: 'event',
      title: 'x',
      startAt: '2026-11-10T08:00:00Z',
      endAt: '2026-11-10T07:00:00Z',
    }).expect(400);
    await request(app)
      .get('/api/v1/schedule?from=2026-01-01T00:00:00Z&to=2026-06-01T00:00:00Z')
      .set(auth)
      .expect(400);
  });

  it('stores all-day entries on UTC day boundaries', async () => {
    const res = await create({
      kind: 'event',
      title: 'Trip',
      isAllDay: true,
      startAt: '2026-11-20T15:00:00Z',
      endAt: '2026-11-21T03:00:00Z',
    }).expect(201);
    expect(res.body.entry).toMatchObject({
      startAt: '2026-11-20T00:00:00.000Z',
      endAt: '2026-11-22T00:00:00.000Z',
    });
  });
});

describe('recurrence', () => {
  async function weekly() {
    const res = await create({
      kind: 'event',
      title: 'Standup',
      startAt: '2026-11-02T01:00:00Z', // Mon 09:00 Manila
      endAt: '2026-11-02T01:30:00Z',
      recurrence: 'weekly',
      timeZone: 'Asia/Manila',
    }).expect(201);
    return res.body.entry as Entry;
  }

  it('materializes occurrences for the requested range', async () => {
    const first = await weekly();
    expect(first.seriesIndex).toBe(0);
    expect(days(await range(...NOV))).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
    ]);
    // Far range is materialized on demand.
    expect(days(await range('2027-03-01T00:00:00Z', '2027-03-15T00:00:00Z'))).toEqual([
      '2027-03-01',
      '2027-03-08',
    ]);
  });

  it('"this event" edits and deletes only one occurrence, which never comes back', async () => {
    await weekly();
    const nov = await range(...NOV);
    await patch(nov[1]!.id, { title: 'Retro' }).expect(200);
    await del(nov[2]!.id).expect(204);

    const again = await range(...NOV);
    expect(again.map((e) => e.title)).toEqual(['Standup', 'Retro', 'Standup', 'Standup']);
  });

  it('"this and following" splits the series with new values', async () => {
    await weekly();
    const nov = await range(...NOV);
    const res = await patch(
      nov[2]!.id,
      { startAt: '2026-11-17T02:00:00Z', endAt: '2026-11-17T02:30:00Z', title: 'Standup (Tue)' },
      'future',
    ).expect(200);
    expect(res.body.entry.seriesId).not.toBe(nov[0]!.seriesId);

    const after = await range(...NOV);
    expect(after.map((e) => `${e.startAt.slice(0, 10)} ${e.title}`)).toEqual([
      '2026-11-02 Standup',
      '2026-11-09 Standup',
      '2026-11-17 Standup (Tue)',
      '2026-11-24 Standup (Tue)',
    ]);
  });

  it('"this and following" delete ends the series; from the first deletes it all', async () => {
    await weekly();
    const nov = await range(...NOV);
    await del(nov[3]!.id, 'future').expect(204);
    expect(days(await range(...NOV))).toEqual(['2026-11-02', '2026-11-09', '2026-11-16']);
    expect(await range('2026-12-01T00:00:00Z', '2027-01-01T00:00:00Z')).toHaveLength(0);

    await del(nov[0]!.id, 'future').expect(204);
    expect(await range(...NOV)).toHaveLength(0);
  });

  it('turning a one-off into a series, and a series occurrence back into a one-off', async () => {
    const one = (
      await create({
        kind: 'event',
        title: 'Gym',
        startAt: '2026-11-03T10:00:00Z',
        endAt: '2026-11-03T11:00:00Z',
      })
    ).body.entry;
    await patch(one.id, { recurrence: 'daily' }).expect(200);
    expect(await range('2026-11-03T00:00:00Z', '2026-11-06T00:00:00Z')).toHaveLength(3);

    const occ = await range('2026-11-04T00:00:00Z', '2026-11-05T00:00:00Z');
    await patch(occ[0]!.id, { recurrence: 'none' }, 'future').expect(200);
    const left = await range('2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z');
    expect(left.map((e) => [e.startAt.slice(0, 10), e.seriesId === null])).toEqual([
      ['2026-11-03', false],
      ['2026-11-04', true],
    ]);
  });
});

describe('blocks', () => {
  it('links to an item, lists upcoming blocks, hides on delete and removes on purge', async () => {
    const tree = (await request(app).get('/api/v1/tree').set(auth)).body.items;
    const projects = tree.find((i: { title: string }) => i.title === 'Projects').id;
    const task = (
      await request(app)
        .post('/api/v1/items')
        .set(auth)
        .send({ title: 'Problem set', parentId: projects, type: 'task' })
    ).body.item;

    const soon = new Date(Date.now() + 86_400_000);
    const end = new Date(soon.getTime() + 90 * 60_000);
    await create({ kind: 'block', startAt: soon.toISOString(), endAt: end.toISOString() }).expect(400);
    const block = await create({
      kind: 'block',
      itemId: task.id,
      startAt: soon.toISOString(),
      endAt: end.toISOString(),
    }).expect(201);
    expect(block.body.entry).toMatchObject({ kind: 'block', itemId: task.id, title: '' });

    const mine = await request(app).get(`/api/v1/items/${task.id}/schedule`).set(auth).expect(200);
    expect(mine.body.entries).toHaveLength(1);

    const window = [
      new Date(soon.getTime() - 3_600_000).toISOString(),
      new Date(end.getTime() + 3_600_000).toISOString(),
    ] as const;
    await request(app).delete(`/api/v1/items/${task.id}`).set(auth).expect(200);
    expect(await range(...window)).toHaveLength(0);
    await request(app).post(`/api/v1/items/${task.id}/restore`).set(auth).expect(200);
    expect(await range(...window)).toHaveLength(1);

    await request(app).delete(`/api/v1/items/${task.id}`).set(auth).expect(200);
    await request(app).delete(`/api/v1/items/${task.id}/permanent`).set(auth).expect(200);
    const { ScheduleEntryModel } = await import('../src/models/schedule.model.ts');
    expect(await ScheduleEntryModel.countDocuments()).toBe(0);
  });
});
