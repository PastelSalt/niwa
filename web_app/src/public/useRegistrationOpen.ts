import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider.tsx';

/**
 * Whether the server accepts new accounts (NIWA-PLAN-B-01 B1.P3). Treated as open until it answers or
 * if the call fails — the server still refuses a closed sign-up, so the worst case is a clear error.
 */
export function useRegistrationOpen(): boolean {
  const { api } = useAuth();
  const { data } = useQuery({
    queryKey: ['auth-config'],
    queryFn: () => api.auth.config(),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return data?.registrationOpen ?? true;
}
