import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { signParams } from '../src/lib/cloudinary.ts';
import { AttachmentModel } from '../src/models/attachment.model.ts';
import { ItemModel } from '../src/models/item.model.ts';
import { maintenanceService } from '../src/services/maintenance.service.ts';
import { buildApp, resetDb, startDb, stopDb } from './helpers.ts';

beforeAll(startDb);
afterAll(stopDb);

const CLOUD = {
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'key123',
  CLOUDINARY_API_SECRET: 'shh',
  CLOUDINARY_FOLDER: 'niwa/test',
};

interface FakeResource {
  public_id: string;
  format: string;
  bytes: number;
  secure_url: string;
  created_at: string;
  tags: string[];
}

/** In-memory stand-in for Cloudinary's API. */
function fakeCloudinary() {
  const resources = new Map<string, FakeResource>();
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    let m = url.match(/\/resources\/image\/upload\/(.+)$/);
    if (m) {
      const r = resources.get(decodeURIComponent(m[1]!));
      return r ? json(200, r) : json(404, { error: { message: 'not found' } });
    }
    m = url.match(/\/resources\/image\/tags\/([^?]+)/);
    if (m) {
      const tag = decodeURIComponent(m[1]!);
      return json(200, { resources: [...resources.values()].filter((r) => r.tags.includes(tag)) });
    }
    const body = new URLSearchParams(String(init?.body ?? ''));
    if (url.endsWith('/image/destroy')) {
      resources.delete(body.get('public_id')!);
      return json(200, { result: 'ok' });
    }
    if (url.endsWith('/image/tags')) {
      const r = resources.get(body.get('public_ids')!);
      if (r) r.tags = r.tags.filter((t) => t !== body.get('tag'));
      return json(200, {});
    }
    return json(400, {});
  }) as typeof fetch;

  /** Simulate the browser's direct upload. */
  const upload = (publicId: string, format = 'png', bytes = 2048, createdAt = new Date().toISOString()) =>
    resources.set(publicId, {
      public_id: publicId,
      format,
      bytes,
      secure_url: `https://res.cloudinary.com/demo/image/upload/v1/${publicId}.${format}`,
      created_at: createdAt,
      tags: ['niwa-pending'],
    });

  return { fetchImpl, resources, upload };
}

let cloud: ReturnType<typeof fakeCloudinary>;
let app: ReturnType<typeof buildApp>;
let auth: { Authorization: string };
let workspaceId: string;
let note: { id: string; version: number };

beforeEach(async () => {
  await resetDb();
  cloud = fakeCloudinary();
  app = buildApp({ ...CLOUD, REGISTRATION_MODE: 'open' }, cloud.fetchImpl);
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'me@example.com', password: 'correct horse battery staple' })
    .expect(201);
  auth = { Authorization: `Bearer ${reg.body.accessToken}` };
  workspaceId = reg.body.user.workspaceId;
  note = (
    await request(app).post('/api/v1/items').set(auth).send({ title: 'Note', parentId: null }).expect(201)
  ).body.item;
});

async function uploadImage(format = 'png', bytes = 2048) {
  const sig = (
    await request(app).post('/api/v1/uploads/sign').set(auth).send({ itemId: note.id }).expect(200)
  ).body;
  const fullId = `${sig.folder}/${sig.publicId}`;
  cloud.upload(fullId, format, bytes);
  return { sig, fullId };
}

const confirm = (publicId: string) =>
  request(app).post('/api/v1/attachments').set(auth).send({ itemId: note.id, publicId });

const imageDoc = (attachmentId: string) => ({
  type: 'doc',
  content: [{ type: 'image', attrs: { src: 'https://x', alt: 'Diagram', attachmentId } }],
});
const emptyDoc = { type: 'doc', content: [] };

describe('signing', () => {
  it('reports configuration and signs exactly the params the browser will send', async () => {
    const cfg = await request(app).get('/api/v1/uploads/config').set(auth).expect(200);
    expect(cfg.body).toMatchObject({ enabled: true, maxBytes: 10485760 });

    const { sig } = await uploadImage();
    expect(sig).toMatchObject({
      cloudName: 'demo',
      apiKey: 'key123',
      folder: `niwa/test/${workspaceId}`,
      tags: 'niwa-pending',
    });
    expect(JSON.stringify(sig)).not.toContain('shh');
    const expected = signParams(
      {
        folder: sig.folder,
        public_id: sig.publicId,
        tags: sig.tags,
        allowed_formats: sig.allowedFormats,
        timestamp: sig.timestamp,
      },
      'shh',
    );
    expect(sig.signature).toBe(expected);
  });

  it('is unavailable without credentials', async () => {
    const bare = buildApp({ REGISTRATION_MODE: 'open' });
    const reg = await request(bare)
      .post('/api/v1/auth/register')
      .send({ email: 'b@example.com', password: 'correct horse battery staple' });
    const a = { Authorization: `Bearer ${reg.body.accessToken}` };
    expect((await request(bare).get('/api/v1/uploads/config').set(a)).body.enabled).toBe(false);
    const item = (await request(bare).post('/api/v1/items').set(a).send({ title: 'x', parentId: null })).body
      .item;
    const res = await request(bare).post('/api/v1/uploads/sign').set(a).send({ itemId: item.id }).expect(503);
    expect(res.body.error.code).toBe('NOT_CONFIGURED');
  });
});

describe('confirm', () => {
  it('verifies the upload, records it and clears the pending tag', async () => {
    const { fullId } = await uploadImage('jpg', 4096);
    const res = await confirm(fullId).expect(201);
    expect(res.body.attachment).toMatchObject({
      itemId: note.id,
      mime: 'image/jpeg',
      size: 4096,
      cloudinaryPublicId: fullId,
    });
    expect(cloud.resources.get(fullId)!.tags).toEqual([]);
    await confirm(fullId).expect(201); // idempotent
    expect(await AttachmentModel.countDocuments()).toBe(1);
  });

  it('rejects oversized or wrong-format files and deletes them from Cloudinary', async () => {
    const big = await uploadImage('png', 11 * 1024 * 1024);
    await confirm(big.fullId).expect(400);
    expect(cloud.resources.has(big.fullId)).toBe(false);
    const svg = await uploadImage('svg');
    await confirm(svg.fullId).expect(400);
  });

  it('cannot claim an upload from another workspace, or a missing one', async () => {
    await confirm('niwa/test/someoneelse/abc').expect(403);
    await confirm(`niwa/test/${workspaceId}/missing`).expect(400);
  });
});

describe('lifecycle', () => {
  async function attached() {
    const { fullId } = await uploadImage();
    const a = (await confirm(fullId)).body.attachment;
    return { a, fullId };
  }
  const save = async (version: number, content: object) =>
    (await request(app).patch(`/api/v1/items/${note.id}`).set(auth).send({ version, content }).expect(200))
      .body.item as { version: number };
  const orphanedAt = async (id: string) => (await AttachmentModel.findById(id).lean())!.orphanedAt;

  it('orphans unreferenced images on save, un-orphans on undo, sweeps after the grace period', async () => {
    const { a, fullId } = await attached();
    let item = await save(note.version, imageDoc(a.id));
    expect(await orphanedAt(a.id)).toBeNull();

    item = await save(item.version, emptyDoc);
    expect(await orphanedAt(a.id)).toBeInstanceOf(Date);

    item = await save(item.version, imageDoc(a.id));
    expect(await orphanedAt(a.id)).toBeNull();

    await save(item.version, emptyDoc);
    await maintenanceService.run(new Date(Date.now() + 3 * 86_400_000));
    expect(await AttachmentModel.countDocuments()).toBe(1); // still within 7 days
    await maintenanceService.run(new Date(Date.now() + 8 * 86_400_000));
    expect(await AttachmentModel.countDocuments()).toBe(0);
    expect(cloud.resources.has(fullId)).toBe(false);
  });

  it('removes images immediately when the item is purged', async () => {
    const { fullId } = await attached();
    await request(app).delete(`/api/v1/items/${note.id}`).set(auth).expect(200);
    expect(await AttachmentModel.countDocuments()).toBe(1); // soft delete keeps them
    await request(app).delete(`/api/v1/items/${note.id}/permanent`).set(auth).expect(200);
    expect(await AttachmentModel.countDocuments()).toBe(0);
    expect(cloud.resources.has(fullId)).toBe(false);
  });

  it('sweeps signed-but-never-confirmed uploads after a day', async () => {
    await uploadImage(); // fresh: kept
    const stale = `niwa/test/${workspaceId}/stale`;
    cloud.upload(stale, 'png', 10, new Date(Date.now() - 2 * 86_400_000).toISOString());
    const r = await maintenanceService.run();
    expect(r.pending).toBe(1);
    expect(cloud.resources.has(stale)).toBe(false);
    expect(cloud.resources.size).toBe(1);
  });

  it('empties Trash items older than 30 days', async () => {
    await request(app).delete(`/api/v1/items/${note.id}`).set(auth).expect(200);
    await ItemModel.updateOne(
      { _id: note.id },
      { $set: { deletedAt: new Date(Date.now() - 31 * 86_400_000) } },
    );
    const r = await maintenanceService.run();
    expect(r.trashPurged).toBe(1);
    expect(await ItemModel.exists({ _id: note.id })).toBeNull();
  });
});
