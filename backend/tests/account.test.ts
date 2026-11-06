import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ItemModel } from '../src/models/item.model.ts';
import { RefreshSessionModel } from '../src/models/refreshSession.model.ts';
import { ScheduleEntryModel } from '../src/models/schedule.model.ts';
import { UserModel } from '../src/models/user.model.ts';
import { WorkspaceModel } from '../src/models/workspace.model.ts';
import { buildApp, refreshCookie, resetDb, startDb, stopDb } from './helpers.ts';

const creds = { email: 'me@example.com', password: 'correct horse battery staple' };
const csrf = { 'X-Requested-With': 'niwa' };

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

async function signUp(app: ReturnType<typeof buildApp>, email = creds.email) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ ...creds, email })
    .expect(201);
  return {
    token: res.body.accessToken as string,
    user: res.body.user as { id: string; workspaceId: string; onboarding: unknown },
    cookie: refreshCookie(res.headers['set-cookie'])!,
  };
}

describe('GET /auth/config', () => {
  it('reports whether sign-up is open, per REGISTRATION_MODE', async () => {
    const first = buildApp();
    expect((await request(first).get('/api/v1/auth/config').expect(200)).body).toEqual({
      registrationOpen: true,
    });
    await signUp(first);
    expect((await request(first).get('/api/v1/auth/config').expect(200)).body).toEqual({
      registrationOpen: false,
    });

    const open = buildApp({ REGISTRATION_MODE: 'open' });
    expect((await request(open).get('/api/v1/auth/config')).body.registrationOpen).toBe(true);
    const closed = buildApp({ REGISTRATION_MODE: 'closed' });
    expect((await request(closed).get('/api/v1/auth/config')).body.registrationOpen).toBe(false);
  });
});

describe('PUT /account/onboarding', () => {
  it('starts null and remembers a finished or skipped tour', async () => {
    const app = buildApp();
    const { token, user } = await signUp(app);
    expect(user.onboarding).toBeNull();

    const res = await request(app)
      .put('/api/v1/account/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'skipped', version: 1 })
      .expect(200);
    expect(res.body.user.onboarding).toMatchObject({ status: 'skipped', version: 1, at: expect.any(String) });

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.user.onboarding.status).toBe('skipped');

    await request(app)
      .put('/api/v1/account/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'maybe', version: 1 })
      .expect(400);
  });
});

describe('PUT /account/preferences', () => {
  it('starts on the defaults, merges partial updates and rejects unknown ids', async () => {
    const app = buildApp();
    const { token, user } = await signUp(app);
    expect((user as unknown as { preferences: unknown }).preferences).toMatchObject({
      theme: 'garden',
      font: 'fredoka',
      mode: 'system',
      // B-03: new accounts get the Scrapbook layout on a dotted page.
      layout: { preset: 'scrapbook', density: null, sidebar: null, stickers: null, chosen: false },
      background: { pattern: 'dots', strength: 'normal', washes: true },
    });

    const auth = { Authorization: `Bearer ${token}` };
    await request(app).put('/api/v1/account/preferences').set(auth).send({ font: 'inter' }).expect(200);
    const res = await request(app)
      .put('/api/v1/account/preferences')
      .set(auth)
      .send({ theme: 'lavender', mode: 'dark' })
      .expect(200);
    expect(res.body.user.preferences).toMatchObject({ theme: 'lavender', font: 'inter', mode: 'dark' });

    const me = await request(app).get('/api/v1/auth/me').set(auth).expect(200);
    expect(me.body.user.preferences.font).toBe('inter');

    await request(app).put('/api/v1/account/preferences').set(auth).send({ theme: 'neon' }).expect(400);
    await request(app).put('/api/v1/account/preferences').send({ font: 'inter' }).expect(401);
  });
});

describe('layout and background preferences (B-03 C2/C5)', () => {
  it('merges partial layout/background updates and rejects unknown values', async () => {
    const app = buildApp();
    const { token } = await signUp(app);
    const auth = { Authorization: `Bearer ${token}` };
    const put = (body: object) => request(app).put('/api/v1/account/preferences').set(auth).send(body);

    await put({ layout: { preset: 'classic', chosen: true } }).expect(200);
    await put({ layout: { density: 'compact' }, background: { pattern: 'gingham' } }).expect(200);
    const res = await put({ background: { washes: false } }).expect(200);
    expect(res.body.user.preferences.layout).toEqual({
      preset: 'classic',
      density: 'compact',
      sidebar: null,
      stickers: null,
      chosen: true,
    });
    expect(res.body.user.preferences.background).toEqual({
      pattern: 'gingham',
      strength: 'normal',
      washes: false,
    });

    await put({ layout: { preset: 'zigzag' } }).expect(400);
    await put({ background: { pattern: 'plaid' } }).expect(400);
    // Theme and font are untouched by layout changes.
    expect(res.body.user.preferences).toMatchObject({ theme: 'garden', font: 'fredoka' });
  });
});

describe('holidays (B-01 B8)', () => {
  it('follows the account country, validates it and lists places', async () => {
    const app = buildApp();
    const { token } = await signUp(app);
    const auth = { Authorization: `Bearer ${token}` };
    const range = '/api/v1/holidays?from=2026-12-01&to=2026-12-31';

    expect((await request(app).get(range).set(auth).expect(200)).body).toEqual({
      country: null,
      holidays: [],
    });
    await request(app)
      .put('/api/v1/account/preferences')
      .set(auth)
      .send({ holidays: { country: 'PH' } })
      .expect(200);
    const res = await request(app).get(range).set(auth).expect(200);
    expect(res.body.country).toBe('PH');
    expect(res.body.holidays).toContainEqual(
      expect.objectContaining({ date: '2026-12-30', name: 'Rizal Day' }),
    );

    await request(app)
      .put('/api/v1/account/preferences')
      .set(auth)
      .send({ holidays: { country: 'XX' } })
      .expect(400);
    await request(app).get('/api/v1/holidays?from=2026-01-01&to=2026-06-01').set(auth).expect(400);
    const countries = (await request(app).get('/api/v1/holidays/countries').set(auth).expect(200)).body
      .places;
    expect(countries).toContainEqual({ code: 'PH', name: 'Philippines' });
    const regions = (await request(app).get('/api/v1/holidays/regions?country=US').set(auth).expect(200)).body
      .places;
    expect(regions.length).toBeGreaterThan(40);
  });
});

describe('starter folders (B-01 B14)', () => {
  it("'simple' starts with one My garden folder; the default stays classic", async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'simple@niwa.test', password: 'garden-password-123', starter: 'simple' })
      .expect(201);
    const tree = await request(app)
      .get('/api/v1/tree')
      .set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(tree.body.items.map((i: { title: string }) => i.title)).toEqual(['My garden']);
  });
});

describe('POST /account/password', () => {
  it('needs the current password, then signs out other sessions and keeps this one', async () => {
    const app = buildApp();
    const { token, cookie: oldCookie } = await signUp(app);
    const phone = (
      await request(app).post('/api/v1/auth/login').set('x-client', 'mobile').send(creds).expect(200)
    ).body as { refreshToken: string };

    const wrong = await request(app)
      .post('/api/v1/account/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'not it', newPassword: 'a brand new long password' })
      .expect(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');

    const ok = await request(app)
      .post('/api/v1/account/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: creds.password, newPassword: 'a brand new long password' })
      .expect(200);
    const newCookie = refreshCookie(ok.headers['set-cookie'])!;

    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', oldCookie).expect(401);
    await request(app)
      .post('/api/v1/auth/refresh')
      .set('x-client', 'mobile')
      .send({ refreshToken: phone.refreshToken })
      .expect(401);
    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', newCookie).expect(200);

    await request(app).post('/api/v1/auth/login').send(creds).expect(401);
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: creds.email, password: 'a brand new long password' })
      .expect(200);
  });
});

describe('GET /account/export', () => {
  it("returns only this account's data as a JSON download", async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open' });
    const me = await signUp(app);
    await signUp(app, 'other@example.com');

    const res = await request(app)
      .get('/api/v1/account/export')
      .set('Authorization', `Bearer ${me.token}`)
      .expect(200);
    expect(res.headers['content-disposition']).toMatch(
      /attachment; filename="niwa-export-\d{4}-\d{2}-\d{2}\.json"/,
    );
    expect(res.body).toMatchObject({ format: 'niwa-export', version: 1, account: { email: creds.email } });
    expect(res.body.items.map((i: { title: string }) => i.title).sort()).toEqual(
      ['College', 'Knowledge', 'Personal', 'Projects'].sort(),
    );
    expect(res.body.items.every((i: { workspaceId: string }) => i.workspaceId === me.user.workspaceId)).toBe(
      true,
    );
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

describe('POST /account/delete', () => {
  it('checks the password, then removes the user and everything they own — and nothing else', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open' });
    const me = await signUp(app);
    const other = await signUp(app, 'other@example.com');
    const root = await ItemModel.findOne({ workspaceId: me.user.workspaceId }).lean();
    await request(app)
      .post('/api/v1/schedule')
      .set('Authorization', `Bearer ${me.token}`)
      .send({
        kind: 'event',
        title: 'Dentist',
        startAt: '2026-11-05T01:00:00.000Z',
        endAt: '2026-11-05T02:00:00.000Z',
      })
      .expect(201);
    expect(root).not.toBeNull();

    await request(app)
      .post('/api/v1/account/delete')
      .set('Authorization', `Bearer ${me.token}`)
      .send({ password: 'wrong' })
      .expect(401);
    expect(await UserModel.countDocuments()).toBe(2);

    const res = await request(app)
      .post('/api/v1/account/delete')
      .set('Authorization', `Bearer ${me.token}`)
      .send({ password: creds.password })
      .expect(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^niwa_rt=;/);

    expect(await UserModel.countDocuments({ _id: me.user.id })).toBe(0);
    expect(await WorkspaceModel.countDocuments({ _id: me.user.workspaceId })).toBe(0);
    expect(await ItemModel.countDocuments({ workspaceId: me.user.workspaceId })).toBe(0);
    expect(await ScheduleEntryModel.countDocuments({ workspaceId: me.user.workspaceId })).toBe(0);
    expect(await RefreshSessionModel.countDocuments({ userId: me.user.id })).toBe(0);

    expect(await ItemModel.countDocuments({ workspaceId: other.user.workspaceId })).toBe(4);
    await request(app).post('/api/v1/auth/login').send(creds).expect(401);
  });
});
