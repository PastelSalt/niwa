import CssBaseline from '@mui/material/CssBaseline';
import type { ApiClient } from '@niwa/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from '../auth/AuthProvider.tsx';
import { AppearanceProvider } from './appearance.tsx';
import { routes } from './router.tsx';

const router = createBrowserRouter(routes);

export function App({ api }: { api: ApiClient }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <AppearanceProvider>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <AuthProvider api={api}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </AppearanceProvider>
  );
}
