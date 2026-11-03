import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '../components/FullPageLoader.tsx';
import { useAuth } from './AuthProvider.tsx';

/** Usability only — the API enforces authorization on every request (specs §13). */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'anonymous') {
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
