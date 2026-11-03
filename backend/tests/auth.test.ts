import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ItemModel } from '../src/models/item.model.ts';
import { buildApp, refreshCookie, resetDb, startDb, stopDb } from './helpers.ts';

const creds = { email: 'Me@Example.com', password: 'correct horse battery staple' };
const csrf = { 'X-Requested-With': 'niwa' };

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

describe('register', () => {
  it('creates the account, workspace and root containers, and sets the refresh cookie', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/v1/auth/register').send(creds).expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.user).toMatchObject({ email: 'me@example.com', aiEnabled: false, hasAiKey: false });
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toMatch(/^niwa_rt=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);

    const roots = await ItemModel.find({ workspaceId: res.body.user.workspaceId })
      .sort({ orderKey: 1 })
      .lean();
    expect(roots.map((r) => r.title)).toEqual(['Knowledge', 'Projects', 'College', 'Personal']);
  });

  it('only allows the first user by default', async () => {
    const app = buildApp();
    await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'other@example.com', password: creds.password })
      .expect(403);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });

  it('rejects duplicate email when registration is open', async () => {
    const app = buildApp({ REGISTRATION_MODE: 'open' });
    await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const res = await request(app).post('/api/v1/auth/register').send(creds).expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates input with the contract schema', async () => {
    const res = await request(buildApp())
      .post('/api/v1/auth/register')
      .send({ email: 'nope', password: 'short' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'email' }),
        expect.objectContaining({ path: 'password' }),
      ]),
    );
  });
});

describe('login', () => {
  it('accepts correct credentials (email case-insensitive)', async () => {
    const app = buildApp();
    await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ME@example.COM', password: creds.password })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('gives the same error for wrong password and unknown email', async () => {
    const app = buildApp();
    await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const a = await request(app)
      .post('/api/v1/auth/login')
      .send({ ...creds, password: 'wrong password!!' });
    const b = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'x@example.com', password: 'whatever123' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(b.body.error.message).toBe(a.body.error.message);
  });
});

describe('access token', () => {
  it('protects /auth/me and /workspace', async () => {
    const app = buildApp();
    await request(app).get('/api/v1/auth/me').expect(401);
    await request(app).get('/api/v1/auth/me').set('Authorization', 'Bearer garbage').expect(401);

    const { body } = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const auth = { Authorization: `Bearer ${body.accessToken}` };
    const me = await request(app).get('/api/v1/auth/me').set(auth).expect(200);
    expect(me.body.user.email).toBe('me@example.com');
    const ws = await request(app).get('/api/v1/workspace').set(auth).expect(200);
    expect(ws.body.workspace.id).toBe(body.user.workspaceId);
  });
});

describe('refresh (web cookie)', () => {
  it('rotates the cookie on every use', async () => {
    const app = buildApp();
    const reg = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const first = refreshCookie(reg.headers['set-cookie']);

    const r1 = await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', first!).expect(200);
    const second = refreshCookie(r1.headers['set-cookie']);
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
    expect(r1.body.accessToken).toEqual(expect.any(String));

    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', second!).expect(200);
  });

  it('revokes the whole session family when a used token is replayed', async () => {
    const app = buildApp();
    const reg = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const first = refreshCookie(reg.headers['set-cookie'])!;
    const r1 = await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', first).expect(200);
    const second = refreshCookie(r1.headers['set-cookie'])!;

    // Replay of the already-rotated token → reuse detected.
    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', first).expect(401);
    // The legitimate successor is now dead too.
    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', second).expect(401);
  });

  it('requires the CSRF header for cookie-based refresh', async () => {
    const app = buildApp();
    const reg = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie(reg.headers['set-cookie'])!)
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('logout revokes the session and clears the cookie', async () => {
    const app = buildApp();
    const reg = await request(app).post('/api/v1/auth/register').send(creds).expect(201);
    const cookie = refreshCookie(reg.headers['set-cookie'])!;
    const out = await request(app).post('/api/v1/auth/logout').set(csrf).set('Cookie', cookie).expect(204);
    expect(String(out.headers['set-cookie'])).toMatch(/niwa_rt=;/);
    await request(app).post('/api/v1/auth/refresh').set(csrf).set('Cookie', cookie).expect(401);
  });
});

describe('refresh (native client)', () => {
  it('returns and accepts the refresh token in the body, no cookie', async () => {
    const app = buildApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .set('X-Client', 'desktop')
      .send(creds)
      .expect(201);
    expect(reg.headers['set-cookie']).toBeUndefined();
    expect(reg.body.refreshToken).toEqual(expect.any(String));

    const r1 = await request(app)
      .post('/api/v1/auth/refresh')
      .set('X-Client', 'desktop')
      .send({ refreshToken: reg.body.refreshToken })
      .expect(200);
    expect(r1.body.refreshToken).not.toBe(reg.body.refreshToken);
  });
});
