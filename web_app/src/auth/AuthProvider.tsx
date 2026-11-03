import type { ApiClient, Session } from '@niwa/api-client';
import type { LoginInput, PublicUser, RegisterInput } from '@niwa/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  api: ApiClient;
  login(input: LoginInput): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the session. The access token lives only inside the api client's memory (specs §12.1);
 * on load we try to restore a session from the HttpOnly refresh cookie.
 */
export function AuthProvider({ api, children }: { api: ApiClient; children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(api.getSession());
  const [restoring, setRestoring] = useState(!api.getSession());

  useEffect(() => {
    const unsubscribe = api.onSessionChange((next) => {
      setSession(next);
      if (!next) queryClient.clear();
    });
    if (!api.getSession()) {
      api
        .restoreSession()
        .catch(() => null)
        .finally(() => setRestoring(false));
    }
    return unsubscribe;
  }, [api, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: session ? 'authenticated' : restoring ? 'loading' : 'anonymous',
      user: session?.user ?? null,
      api,
      login: async (input) => void (await api.auth.login(input)),
      register: async (input) => void (await api.auth.register(input)),
      logout: () => api.auth.logout(),
    }),
    [api, session, restoring],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
