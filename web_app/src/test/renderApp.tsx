import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createApiClient } from '@niwa/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { vi } from 'vitest';
import { routes } from '../app/router.tsx';
import { theme } from '../app/theme.ts';
import { AuthProvider } from '../auth/AuthProvider.tsx';

export const testUser = {
  id: 'a'.repeat(24),
  email: 'gardener@niwa.test',
  workspaceId: 'b'.repeat(24),
  aiEnabled: false,
  hasAiKey: false,
  createdAt: '2026-11-03T00:00:00.000Z',
  // Tour already seen, so it doesn't cover the screens other tests look at.
  onboarding: { status: 'completed', version: 1, at: '2026-11-03T00:00:00.000Z' },
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const authOk = () => json(200, { accessToken: 'token', expiresIn: 600, user: testUser });
export const noSession = () => json(401, { error: { code: 'UNAUTHORIZED', message: 'No session.' } });
export const apiError = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

const emptyFocus = { inProgress: [], highPriority: [], overdue: [], upcoming: [], recentlyUpdated: [] };

/** Background reads every signed-in screen makes; tests override them as needed. */
const DEFAULT_HANDLERS: Record<string, Handler> = {
  'POST /auth/refresh': noSession,
  'GET /tree': () => json(200, { items: [] }),
  'GET /focus': () => json(200, emptyFocus),
  'GET /tags': () => json(200, { tags: [] }),
  'GET /trash': () => json(200, { items: [] }),
  'GET /schedule': () => json(200, { entries: [] }),
  'GET /review': () => json(200, { items: [] }),
  'GET /inbox': () => json(200, { items: [] }),
  'GET /search': () => json(200, { hits: [] }),
  'GET /auth/config': () => json(200, { registrationOpen: true }),
};

/**
 * Renders the real route tree with a real api client whose `fetch` is a router-style mock:
 * `{ 'POST /auth/login': () => authOk() }`. Unmatched calls reject and are recorded in `unhandled`.
 */
export function renderApp(path: string, handlers: Record<string, Handler> = {}) {
  const unhandled: string[] = [];
  const fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    const key = `${init.method ?? 'GET'} ${url.replace('/api/v1', '').split('?')[0]}`;
    const handler = handlers[key] ?? DEFAULT_HANDLERS[key];
    if (!handler) {
      unhandled.push(key);
      throw new Error(`Unhandled request in test: ${key}`);
    }
    return handler(url, init);
  });

  const api = createApiClient({ baseUrl: '/api/v1', fetch });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });

  const utils = render(
    <ThemeProvider theme={theme} defaultMode="light" noSsr>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider api={api}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...utils, router, fetch, api, unhandled };
}
