import Box from '@mui/material/Box';
import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider.tsx';
import { FullPageLoader } from '../components/FullPageLoader.tsx';
import { PublicLayout } from './PublicLayout.tsx';

// Own chunk: signed-in users never download the landing page, and visitors don't download the app.
const LandingPage = lazy(async () => ({ default: (await import('./LandingPage.tsx')).LandingPage }));

/** `/` — the landing page for visitors, Knowledge for signed-in users (NIWA-PLAN-B-01 B1.P1). */
export function HomeRoute() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to="/knowledge" replace />;
  return (
    <PublicLayout>
      {/* Keep the footer below the fold while the chunk loads, so it doesn't jump (CLS, B-01 B6). */}
      <Suspense fallback={<Box sx={{ minHeight: '100dvh' }} />}>
        <LandingPage />
      </Suspense>
    </PublicLayout>
  );
}
