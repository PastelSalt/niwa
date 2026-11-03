import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exportDatabase, readHeader, restoreDatabase } from '../src/lib/backup.ts';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

const app = buildApp({ REGISTRATION_MODE: 'open' });

async function seed() {
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'backup@example.com', password: 'correct horse battery staple' })
    .expect(201);
  const auth = { Authorization: `Bearer ${reg.body.accessToken}` };
  const tree = await request(app).get('/api/v1/tree').set(auth);
  const knowledge = tree.body.items.find((i: { title: string }) => i.title === 'Knowledge');
  await request(app)
    .post('/api/v1/items')
    .set(auth)
    .send({ title: 'Backed up', parentId: knowledge.id, tags: ['keep'] })
    .expect(201);
  await request(app)
    .post('/api/v1/schedule')
    .set(auth)
    .send({
      kind: 'event',
      title: 'Dentist',
      startAt: '2027-03-10T09:00:00.000Z',
      endAt: '2027-03-10T10:00:00.000Z',
    })
    .expect(201);
  return auth;
}

async function snapshot() {
  const db = mongoose.connection.db!;
  const out: Record<string, unknown[]> = {};
  for (const c of await db.collections())
    out[c.collectionName] = await c.find({}, { sort: { _id: 1 } }).toArray();
  return out;
}

describe('backup / restore', () => {
  it('round-trips every collection with types intact', async () => {
    const auth = await seed();
    const before = await snapshot();
    const { data, header } = await exportDatabase(mongoose.connection.db!);
    expect(readHeader(data)).toEqual(header);
    expect(header.collections.items).toBeGreaterThan(1);

    await resetDb();
    await restoreDatabase(mongoose.connection.db!, data);
    const after = await snapshot();
    expect(after).toEqual(before);
    const item = (after.items as { title: string; _id: unknown; createdAt: unknown }[]).find(
      (i) => i.title === 'Backed up',
    )!;
    expect(item._id).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(item.createdAt).toBeInstanceOf(Date);

    // The restored data is live: the same token still reads the tree.
    const tree = await request(app).get('/api/v1/tree').set(auth).expect(200);
    expect(tree.body.items.some((i: { title: string }) => i.title === 'Backed up')).toBe(true);
  });

  it('refuses to restore over existing data unless asked to drop it', async () => {
    await seed();
    const { data } = await exportDatabase(mongoose.connection.db!);
    await expect(restoreDatabase(mongoose.connection.db!, data)).rejects.toThrow(/not empty/);
    await restoreDatabase(mongoose.connection.db!, data, { drop: true });
    expect(await mongoose.connection.db!.collection('items').countDocuments()).toBe(
      readHeader(data).collections.items,
    );
  });

  it('rejects files that are not NIWA backups', async () => {
    const { gzipSync } = await import('node:zlib');
    expect(() => readHeader(gzipSync('{"format":"other"}\n'))).toThrow(/Not a NIWA backup/);
  });
});
