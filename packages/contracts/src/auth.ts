import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

export const Email = z
  .email()
  .max(254)
  .transform((v) => v.trim().toLowerCase())
  .meta({ example: 'me@example.com' });

export const Password = z.string().min(12, 'At least 12 characters').max(256);

export const RegisterInput = z.object({ email: Email, password: Password }).meta({ id: 'RegisterInput' });
export type RegisterInput = z.infer<typeof RegisterInput>;

export const LoginInput = z
  .object({ email: Email, password: z.string().min(1).max(256) })
  .meta({ id: 'LoginInput' });
export type LoginInput = z.infer<typeof LoginInput>;

export const PublicUser = z
  .object({
    id: Id,
    email: z.string(),
    workspaceId: Id,
    aiEnabled: z.boolean(),
    hasAiKey: z.boolean(),
    createdAt: IsoDateTime,
  })
  .meta({ id: 'PublicUser' });
export type PublicUser = z.infer<typeof PublicUser>;

/**
 * Returned by register/login/refresh. The refresh token travels separately:
 * HttpOnly cookie on web; in the `refreshToken` field only when the client sends
 * `X-Client: desktop|mobile` (kept in OS keychain / secure storage) — specs §12.1.
 */
export const AuthResponse = z
  .object({
    accessToken: z.string(),
    expiresIn: z.number().int().meta({ description: 'Access token lifetime in seconds' }),
    refreshToken: z.string().optional(),
    user: PublicUser,
  })
  .meta({ id: 'AuthResponse' });
export type AuthResponse = z.infer<typeof AuthResponse>;

export const RefreshInput = z.object({ refreshToken: z.string().optional() }).meta({
  id: 'RefreshInput',
  description: 'Native clients send the token in the body; web uses the cookie.',
});
export type RefreshInput = z.infer<typeof RefreshInput>;

export const MeResponse = z.object({ user: PublicUser }).meta({ id: 'MeResponse' });

export const REFRESH_COOKIE = 'niwa_rt';
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'niwa';
export const NATIVE_CLIENT_HEADER = 'x-client';
