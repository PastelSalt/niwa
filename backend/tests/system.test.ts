import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env.ts';
import { buildApp } from './helpers.ts';

describe('health', () => {
  it('responds ok with security headers and a request id', async () => {
    const res = await request(buildApp()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', env: 'test' });
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('error envelope', () => {
  it('wraps unknown routes', async () => {
    const res = await request(buildApp()).get('/api/v1/nope').expect(404);
    expect(res.body.error).toMatchObject({ code: 'NOT_FOUND', requestId: expect.any(String) });
  });

  it('wraps malformed JSON', async () => {
    const res = await request(buildApp())
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('env validation', () => {
  const base = { MONGODB_URI: 'mongodb://x', JWT_ACCESS_SECRET: 'x'.repeat(32) };

  it('fails fast on missing secrets', () => {
    expect(() => loadConfig({ MONGODB_URI: 'mongodb://x' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('requires Redis and CORS origins in production', () => {
    expect(() => loadConfig({ ...base, APP_ENV: 'production' })).toThrow(/REDIS_URL[\s\S]*CORS_ORIGINS/);
  });

  it('uses secure cookies outside local/test', () => {
    const cfg = loadConfig({
      ...base,
      APP_ENV: 'production',
      REDIS_URL: 'redis://x',
      CORS_ORIGINS: 'https://niwa.vercel.app',
    });
    expect(cfg.secureCookies).toBe(true);
    expect(cfg.CORS_ORIGINS).toEqual(['https://niwa.vercel.app']);
  });
});
