import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '../components/FullPageLoader.tsx';
import { NotFoundPage } from '../components/NotFoundPage.tsx';
import { PublicLayout } from '../public/PublicLayout.tsx';
import { useAuth } from './AuthProvider.tsx';

/** Signed-in screens; anything else under the guard is a 404. */
const APP_PATHS = ['/knowledge', '/actionable', '/scheduler', '/inbox', '/search', '/settings', '/items'];

/** Usability only — the API enforces authorization on every request (specs §13). */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'anonymous') {
    // A visitor on a URL that isn't an app screen gets a public 404, not a login wall (B-01 B1.P1).
    if (!APP_PATHS.some((p) => location.pathname.startsWith(p))) {
      return (
        <PublicLayout>
          <NotFoundPage />
        </PublicLayout>
      );
    }
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Login/register pages. Once signed in, go back to the page RequireAuth bounced us from. */
export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from?.startsWith('/') ? from : '/'} replace />;
  }
  return <Outlet />;
}
