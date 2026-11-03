import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ApiClient } from '@niwa/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from '../auth/AuthProvider.tsx';
import { routes } from './router.tsx';
import { theme } from './theme.ts';

const router = createBrowserRouter(routes);

export function App({ api }: { api: ApiClient }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <ThemeProvider theme={theme} defaultMode="system" noSsr>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <AuthProvider api={api}>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
