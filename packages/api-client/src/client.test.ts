import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './index.ts';

const user = {
  id: 'a'.repeat(24),
  email: 'me@example.com',
  workspaceId: 'b'.repeat(24),
  aiEnabled: false,
  hasAiKey: false,
  createdAt: '2026-11-03T00:00:00.000Z',
};

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const auth = (token: string) => ({ accessToken: token, expiresIn: 600, user });

describe('api-client', () => {
  it('sends the CSRF header on web and stores the session in memory', async () => {
    const fetch = vi.fn(async () => json(200, auth('t1')));
    const api = createApiClient({ baseUrl: '/api/v1/', fetch });
    const listener = vi.fn();
    api.onSessionChange(listener);

    await api.auth.login({ email: 'me@example.com', password: 'x' });

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/v1/auth/login');
    expect((init.headers as Record<string, string>)['x-requested-with']).toBe('niwa');
    expect(api.getSession()?.accessToken).toBe('t1');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 't1' }));
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(200, auth('old')))
      .mockResolvedValueOnce(json(401, { error: { code: 'UNAUTHORIZED', message: 'expired' } }))
      .mockResolvedValueOnce(json(200, auth('new')))
      .mockResolvedValueOnce(json(200, { user }));
    const api = createApiClient({ baseUrl: '/api/v1', fetch });
    await api.auth.login({ email: 'me@example.com', password: 'x' });

    await expect(api.auth.me()).resolves.toEqual({ user });
    expect(fetch.mock.calls[2]?.[0]).toBe('/api/v1/auth/refresh');
    const retryHeaders = (fetch.mock.calls[3]?.[1] as RequestInit).headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new');
  });

  it('shares one refresh between concurrent requests', async () => {
    let refreshCalls = 0;
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls++;
        return json(200, auth('fresh'));
      }
      return json(200, { user });
    });
    const api = createApiClient({ baseUrl: '/api/v1', fetch: fetch as unknown as typeof globalThis.fetch });
    await Promise.all([api.auth.me(), api.auth.me(), api.workspace.get()]);
    expect(refreshCalls).toBe(1);
  });

  it('clears the session when refresh is rejected', async () => {
    const fetch = vi.fn(async () => json(401, { error: { code: 'UNAUTHORIZED', message: 'no session' } }));
    const api = createApiClient({ baseUrl: '/api/v1', fetch });
    await expect(api.restoreSession()).resolves.toBeNull();
    await expect(api.auth.me()).rejects.toBeInstanceOf(ApiError);
    expect(api.getSession()).toBeNull();
  });

  it('maps the error envelope to ApiError', async () => {
    const fetch = vi.fn(async () =>
      json(403, { error: { code: 'REGISTRATION_CLOSED', message: 'closed', requestId: 'r1' } }),
    );
    const api = createApiClient({ baseUrl: '/api/v1', fetch });
    const err = await api.auth.register({ email: 'a@b.co', password: 'long enough pw' }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 403, code: 'REGISTRATION_CLOSED', requestId: 'r1' });
  });

  it('native clients use X-Client and the secure store instead of cookies', async () => {
    const store = {
      value: null as string | null,
      get: async () => store.value,
      set: async (v: string | null) => void (store.value = v),
    };
    const fetch = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
      json(200, { ...auth('t'), refreshToken: 'rt1' }),
    );
    const api = createApiClient({
      baseUrl: 'https://api.test/api/v1',
      client: 'desktop',
      refreshTokenStore: store,
      fetch,
    });
    await api.auth.login({ email: 'me@example.com', password: 'x' });
    const init = fetch.mock.calls[0]?.[1] as unknown as RequestInit;
    expect((init.headers as Record<string, string>)['x-client']).toBe('desktop');
    expect(init.credentials).toBe('omit');
    expect(store.value).toBe('rt1');
  });
});
