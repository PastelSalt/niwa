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

/** First-run tour state, stored per account so web and mobile agree (NIWA-PLAN-B-01 B7). */
export const OnboardingStatus = z.enum(['completed', 'skipped']);
export type OnboardingStatus = z.infer<typeof OnboardingStatus>;

export const OnboardingState = z
  .object({
    status: OnboardingStatus,
    version: z.number().int().min(1).meta({ description: 'Tour version the user finished or skipped' }),
    at: IsoDateTime,
  })
  .meta({ id: 'OnboardingState' });
export type OnboardingState = z.infer<typeof OnboardingState>;

export const PublicUser = z
  .object({
    id: Id,
    email: z.string(),
    workspaceId: Id,
    aiEnabled: z.boolean(),
    hasAiKey: z.boolean(),
    createdAt: IsoDateTime,
    onboarding: OnboardingState.nullable().meta({
      description: 'null until the user finishes or skips the tour',
    }),
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

/** Public, unauthenticated: lets clients hide sign-up when the server would refuse it. */
export const AuthConfig = z.object({ registrationOpen: z.boolean() }).meta({ id: 'AuthConfig' });
export type AuthConfig = z.infer<typeof AuthConfig>;

export const OnboardingInput = z
  .object({ status: OnboardingStatus, version: z.number().int().min(1).max(1000) })
  .meta({ id: 'OnboardingInput' });
export type OnboardingInput = z.infer<typeof OnboardingInput>;

export const ChangePasswordInput = z
  .object({ currentPassword: z.string().min(1).max(256), newPassword: Password })
  .meta({ id: 'ChangePasswordInput' });
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;

export const DeleteAccountInput = z
  .object({ password: z.string().min(1).max(256) })
  .meta({ id: 'DeleteAccountInput' });
export type DeleteAccountInput = z.infer<typeof DeleteAccountInput>;

/**
 * "Export my data" (NIWA-PLAN-B-01 B4, OPS §9 row 3). Plain JSON of everything the account owns; ids are
 * strings and dates ISO strings. Images are listed with their URLs (the files stay on Cloudinary).
 */
export const ACCOUNT_EXPORT_FORMAT = 'niwa-export';
export const AccountExport = z
  .object({
    format: z.literal(ACCOUNT_EXPORT_FORMAT),
    version: z.literal(1),
    exportedAt: IsoDateTime,
    account: z.object({ email: z.string(), createdAt: IsoDateTime }),
    workspace: z.record(z.string(), z.unknown()),
    items: z.array(z.record(z.string(), z.unknown())),
    links: z.array(z.record(z.string(), z.unknown())),
    scheduleEntries: z.array(z.record(z.string(), z.unknown())),
    scheduleSeries: z.array(z.record(z.string(), z.unknown())),
    attachments: z.array(z.record(z.string(), z.unknown())),
  })
  .meta({ id: 'AccountExport' });
export type AccountExport = z.infer<typeof AccountExport>;

/** How much of the per-account limits is used (Settings › Account). */
export const AccountUsage = z
  .object({
    items: z.number().int(),
    itemLimit: z.number().int(),
    imageBytes: z.number().int(),
    imageByteLimit: z.number().int(),
  })
  .meta({ id: 'AccountUsage' });
export type AccountUsage = z.infer<typeof AccountUsage>;

export const REFRESH_COOKIE = 'niwa_rt';
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'niwa';
export const NATIVE_CLIENT_HEADER = 'x-client';
