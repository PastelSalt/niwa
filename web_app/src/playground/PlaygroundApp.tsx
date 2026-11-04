import CssBaseline from '@mui/material/CssBaseline';
import { createApiClient, type ApiClient } from '@niwa/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppearanceProvider } from '../app/appearance.tsx';
import { routes } from '../app/router.tsx';
import { AuthProvider } from '../auth/AuthProvider.tsx';
import { exampleWorkspace } from './exampleWorkspace.ts';
import { isToPlayground, type FromPlayground } from './protocol.ts';

/**
 * The landing page's playground (NIWA-PLAN-B-02 V11): the real app — same routes and components — running
 * in an iframe against an example garden held in memory. No account, no network calls, nothing saved: the
 * API is `MemoryWorkspace.fetch`, navigation is a memory router, and browser storage is swapped for an
 * in-memory one before anything reads it.
 */

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

export function bootPlayground(el: HTMLElement) {
  // Nothing the visitor does here may persist or leak into the real app's storage (same origin).
  for (const name of ['localStorage', 'sessionStorage'] as const)
    Object.defineProperty(window, name, { value: memoryStorage(), configurable: true });

  const ws = exampleWorkspace();
  const api = createApiClient({ baseUrl: '/api/v1', fetch: ws.fetch });
  const router = createMemoryRouter(routes, { initialEntries: ['/actionable'] });
  createRoot(el).render(
    <StrictMode>
      <PlaygroundApp api={api}>
        <RouterProvider router={router} />
      </PlaygroundApp>
    </StrictMode>,
  );
}

function PlaygroundApp({ api, children }: { api: ApiClient; children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }),
  );
  return (
    <AppearanceProvider defaultMode="light">
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <AuthProvider api={api}>
          <Bridge api={api} />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>
  );
}

/** Takes theme/font/mode from the landing page's customise panel and applies them like Settings would. */
function Bridge({ api }: { api: ApiClient }) {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!isToPlayground(e)) return;
      const { theme, font, mode } = e.data;
      void api.account.setPreferences({ theme, font, mode }).catch(() => {});
    };
    window.addEventListener('message', onMessage);
    const ready: FromPlayground = { source: 'niwa-playground', type: 'ready' };
    window.parent?.postMessage(ready, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, [api]);
  return null;
}
