// Scale check for a shared server (GAPS "Multi-user readiness" › scale checks). In-memory MongoDB, no network.
//   pnpm --filter @niwa/backend scale-check [--accounts 200] [--items 300]
// Seeds many accounts plus one at the item quota, then times the busy endpoints and checks each query
// uses an index (no collection scans across other people's data).
import { get as httpGet } from 'node:http';
import type { AddressInfo } from 'node:net';
import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { pino } from 'pino';
import request from 'supertest';
import { createApp } from '../src/app.ts';
import { loadConfig } from '../src/config/env.ts';
import { syncIndexes } from '../src/lib/db.ts';
import { ItemModel } from '../src/models/item.model.ts';
import { itemRepo } from '../src/repositories/item.repo.ts';
import { toItemSummary } from '../src/services/serializers.ts';
import { maintenanceService } from '../src/services/maintenance.service.ts';

const { values } = parseArgs({
  options: { accounts: { type: 'string', default: '200' }, items: { type: 'string', default: '300' } },
});
const ACCOUNTS = Number(values.accounts);
const ITEMS = Number(values.items);
const HEAVY = 10_000; // the default MAX_ITEMS_PER_ACCOUNT

const words = 'garden network protocol lecture project budget recipe travel essay draft idea review'.split(
  ' ',
);
const text = (i: number) =>
  Array.from({ length: 30 }, (_, k) => words[(i * 7 + k * 3) % words.length]).join(' ') + ` note ${i}`;

function itemsFor(workspaceId: Types.ObjectId, n: number, trashedDaysAgo = 0) {
  const old = new Date(Date.now() - trashedDaysAgo * 86_400_000);
  return Array.from({ length: n }, (_, i) => ({
    workspaceId,
    parentId: null,
    title: `${words[i % words.length]} ${i}`,
    type: (['note', 'task', 'idea', 'project'] as const)[i % 4],
    contentPlainText: text(i),
    orderKey: `a${String(i).padStart(6, '0')}`,
    tags: [words[(i + 3) % words.length]!],
    // A slice of everyone's items sits in Trash long enough to be purged.
    ...(trashedDaysAgo && i % 20 === 0 ? { deletedAt: old, deleteRoot: true, deleteBatchId: `b${i}` } : {}),
  }));
}

const mongo = await MongoMemoryServer.create();
const config = loadConfig({
  NODE_ENV: 'test',
  APP_ENV: 'test',
  MONGODB_URI: mongo.getUri(),
  MONGODB_DB: 'niwa_scale',
  JWT_ACCESS_SECRET: 'scale-check-secret-that-is-at-least-32-chars',
  REGISTRATION_MODE: 'open',
  RATE_LIMIT_GENERAL_MAX: '1000000',
  RATE_LIMIT_ACCOUNT_MAX: '1000000',
  RATE_LIMIT_SIGNUP_PER_HOUR: '1000000',
  MAX_ITEMS_PER_ACCOUNT: String(HEAVY + 10),
});
await mongoose.connect(config.MONGODB_URI, { dbName: config.MONGODB_DB, autoIndex: false });
await syncIndexes(); // same path as a deployed start
const app = createApp({ config, logger: pino({ level: 'silent' }), redis: null });

async function signUp(email: string) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password: 'scale-check-password' })
    .expect(201);
  return {
    token: res.body.accessToken as string,
    wid: new Types.ObjectId(res.body.user.workspaceId as string),
  };
}

const t0 = performance.now();
const heavy = await signUp('heavy@example.com');
const light = await signUp('light@example.com');
await ItemModel.insertMany(itemsFor(heavy.wid, HEAVY - 4), { ordered: false });
await ItemModel.insertMany(itemsFor(light.wid, ITEMS), { ordered: false });
for (let a = 0; a < ACCOUNTS; a++) {
  await ItemModel.insertMany(itemsFor(new Types.ObjectId(), ITEMS, 40), { ordered: false });
}
const total = await ItemModel.estimatedDocumentCount();
console.log(
  `Seeded ${total.toLocaleString()} items: ${ACCOUNTS} accounts × ${ITEMS}, one at ${HEAVY.toLocaleString()} (${Math.round(performance.now() - t0)} ms)\n`,
);

async function time(label: string, run: () => Promise<unknown>, repeat = 5) {
  await run(); // warm-up
  const ms: number[] = [];
  for (let i = 0; i < repeat; i++) {
    const s = performance.now();
    await run();
    ms.push(performance.now() - s);
  }
  ms.sort((x, y) => x - y);
  return {
    check: label,
    medianMs: Math.round(ms[Math.floor(ms.length / 2)]!),
    maxMs: Math.round(ms.at(-1)!),
  };
}
const get = (token: string, path: string) =>
  request(app).get(`/api/v1${path}`).set('Authorization', `Bearer ${token}`).expect(200);

const rows = [
  await time('GET /tree — light account', () => get(light.token, '/tree')),
  await time('GET /tree — account at the 10k quota', () => get(heavy.token, '/tree')),
  await time('  └ tree query only (repo) — 10k', () => itemRepo.listTree(heavy.wid, false)),
  await time('  └ tree query + serialize — 10k', async () =>
    JSON.stringify((await itemRepo.listTree(heavy.wid, false)).map(toItemSummary)),
  ),
  await time('GET /search?q=garden — light', () => get(light.token, '/search?q=garden')),
  await time('GET /search?q=garden — 10k account', () => get(heavy.token, '/search?q=garden')),
  await time('GET /search?q=netw (substring) — 10k', () => get(heavy.token, '/search?q=netw')),
  await time('GET /focus — 10k account', () => get(heavy.token, '/focus?today=2026-11-04')),
  await time('GET /account/usage — 10k account', () => get(heavy.token, '/account/usage')),
  await time('POST /items (quota check) — 10k', () =>
    request(app)
      .post('/api/v1/items')
      .set('Authorization', `Bearer ${heavy.token}`)
      .send({ parentId: null, type: 'note', title: 'one more' })
      .expect(201),
  ),
  await time('POST /auth/register (new account)', () => signUp(`n${Math.random()}@example.com`)),
  await time('maintenance run (Trash purge, all accounts)', () => maintenanceService.run(), 1),
];
console.table(rows);
const tree = await get(heavy.token, '/tree');
// Bytes on the wire with gzip, read from a real socket (supertest would decompress before counting).
const server = app.listen(0);
const port = (server.address() as AddressInfo).port;
const gz = await new Promise<{ bytes: number; encoding: string }>((resolve, reject) => {
  httpGet(
    {
      port,
      path: '/api/v1/tree',
      headers: { Authorization: `Bearer ${heavy.token}`, 'Accept-Encoding': 'gzip' },
    },
    (res) => {
      let bytes = 0;
      res.on('data', (c: Buffer) => (bytes += c.length));
      res.on('end', () => resolve({ bytes, encoding: String(res.headers['content-encoding'] ?? 'none') }));
    },
  ).on('error', reject);
});
server.close();
console.log(
  `/tree payload for the 10k account: ${(tree.text.length / 1024).toFixed(0)} KB raw, ` +
    `${(gz.bytes / 1024).toFixed(0)} KB on the wire (${gz.encoding})\n`,
);

// Index use: winning plans must not scan the whole collection.
const plan = async (label: string, query: mongoose.Query<unknown, unknown>) => {
  const explained = (await query.explain('queryPlanner')) as { queryPlanner: { winningPlan: unknown } };
  const stages = JSON.stringify(explained.queryPlanner.winningPlan).match(/"stage":"[A-Z_]+"/g) ?? [];
  return { query: label, stages: [...new Set(stages.map((s) => s.slice(9, -1)))].join(' › ') };
};
const plans = [
  await plan('tree', ItemModel.find({ workspaceId: heavy.wid, deletedAt: null })),
  await plan(
    'text search',
    ItemModel.find({ workspaceId: heavy.wid, deletedAt: null, $text: { $search: 'garden' } }),
  ),
  await plan('trash purge', ItemModel.find({ deleteRoot: true, deletedAt: { $ne: null, $lt: new Date() } })),
  await plan('usage count', ItemModel.find({ workspaceId: heavy.wid })),
];
console.table(plans);
const scans = plans.filter((p) => p.stages.includes('COLLSCAN'));
if (scans.length) {
  console.error('Collection scans:', scans.map((p) => p.query).join(', '));
  process.exitCode = 1;
}

await mongoose.disconnect();
await mongo.stop();
