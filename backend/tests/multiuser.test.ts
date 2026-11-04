import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AttachmentModel } from '../src/models/attachment.model.ts';
import { ItemModel } from '../src/models/item.model.ts';
import { UserModel } from '../src/models/user.model.ts';
import { adminService } from '../src/services/admin.service.ts';
import { buildApp, refreshCookie, resetDb, startDb, stopDb } from './helpers.ts';

// GAPS "Multi-user readiness": per-account quotas and limits, sign-up cap, operator tools.
const password = 'correct horse battery staple';
const csrf = { 'X-Requested-With': 'niwa' };

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

async function signUp(app: ReturnType<typeof buildApp>, email: string) {
  const res = await request(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
  return {
    token: res.body.accessToken as string,
    user: res.body.user as { workspaceId: string },
    cookie: refreshCookie(res.headers['set-cookie'])!,
  };
}

describe('per-account quotas', () => {
  it('stops creating items at the limit (root containers and Trash count), for create and capture', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open', MAX_ITEMS_PER_ACCOUNT: '10' });
    const me = await signUp(app, 'me@example.com');
    const auth = { Authorization: `Bearer ${me.token}` };
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/v1/items')
        .set(auth)
        .send({ parentId: null, type: 'note', title: `n${i}` })
        .expect(201);
    }
    const full = await request(app)
      .post('/api/v1/items')
      .set(auth)
      .send({ parentId: null, type: 'note', title: 'one more' });
    expect(full.status).toBe(403);
    expect(full.body.error.code).toBe('QUOTA_EXCEEDED');
    expect((await request(app).post('/api/v1/inbox').set(auth).send({ title: 'x' })).body.error.code).toBe(
      'QUOTA_EXCEEDED',
    );

    const usage = await request(app).get('/api/v1/account/usage').set(auth).expect(200);
    expect(usage.body).toEqual({
      items: 10,
      itemLimit: 10,
      imageBytes: 0,
      imageByteLimit: 200 * 1024 * 1024,
    });

    // Another account is unaffected.
    const other = await signUp(app, 'other@example.com');
    await request(app)
      .post('/api/v1/items')
      .set({ Authorization: `Bearer ${other.token}` })
      .send({ parentId: null, type: 'note', title: 'fine' })
      .expect(201);
  });

  it('refuses to sign an upload once the image storage is used up', async () => {
    const app = buildApp({ MAX_IMAGE_MB_PER_ACCOUNT: '1' });
    const me = await signUp(app, 'me@example.com');
    const item = await ItemModel.findOne({ workspaceId: me.user.workspaceId }).lean();
    await AttachmentModel.create({
      workspaceId: me.user.workspaceId,
      itemId: item!._id,
      cloudinaryPublicId: 'niwa/test/x',
      secureUrl: 'https://example.test/x.png',
      mime: 'image/png',
      size: 1024 * 1024 + 1,
      orphanedAt: null,
    });
    const res = await request(app)
      .post('/api/v1/uploads/sign')
      .set({ Authorization: `Bearer ${me.token}` })
      .send({ itemId: String(item!._id) });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
  });
});

describe('rate limits for many users', () => {
  it('limits signed-in requests per account, whatever the IP', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open', RATE_LIMIT_ACCOUNT_MAX: '3' });
    const me = await signUp(app, 'me@example.com');
    const other = await signUp(app, 'other@example.com');
    for (let i = 0; i < 3; i++) {
      await request(app)
        .get('/api/v1/auth/me')
        .set({ Authorization: `Bearer ${me.token}` })
        .expect(200);
    }
    const limited = await request(app)
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${me.token}` });
    expect(limited.status).toBe(429);
    await request(app)
      .get('/api/v1/auth/me')
      .set({ Authorization: `Bearer ${other.token}` })
      .expect(200);
  });

  it('caps new accounts per hour across the server; failed sign-ups do not count', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open', RATE_LIMIT_SIGNUP_PER_HOUR: '2' });
    await request(app).post('/api/v1/auth/register').send({ email: 'bad', password }).expect(400);
    await signUp(app, 'a@example.com');
    await signUp(app, 'b@example.com');
    const third = await request(app).post('/api/v1/auth/register').send({ email: 'c@example.com', password });
    expect(third.status).toBe(429);
    expect(third.body.error.message).toMatch(/signing up right now/);
  });
});

describe('operator tools (scripts/admin.ts)', () => {
  it('disable blocks login and refresh; enable restores; delete needs the email repeated', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open' });
    const me = await signUp(app, 'me@example.com');
    await signUp(app, 'other@example.com');

    expect((await adminService.list()).map((r) => r.email)).toEqual(['me@example.com', 'other@example.com']);

    await adminService.disable('Me@Example.com', 'spam');
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'me@example.com', password });
    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_DISABLED');
    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', me.cookie).expect(401);
    expect((await adminService.list())[0]!.disabled).toMatch(/spam$/);

    await adminService.enable('me@example.com');
    await request(app).post('/api/v1/auth/login').send({ email: 'me@example.com', password }).expect(200);

    await expect(adminService.delete('me@example.com', 'nope')).rejects.toThrow(/Repeat the email/);
    await adminService.delete('me@example.com', 'me@example.com');
    expect(await UserModel.countDocuments()).toBe(1);
    expect(await ItemModel.countDocuments({ workspaceId: me.user.workspaceId })).toBe(0);
  });
});
