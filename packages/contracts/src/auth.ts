import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

export const Email = z
  .email()
  .max(254)
  .transform((v) => v.trim().toLowerCase())
  .meta({ example: 'me@example.com' });

export const Password = z.string().min(12, 'At least 12 characters').max(256);

export const RegisterInput = z
  .object({
    email: Email,
    password: Password,
    starter: z.enum(['simple', 'classic']).default('classic').meta({
      description:
        'simple: one "My garden" folder (web, B-01 B14) · classic: Knowledge, Projects, College, Personal',
    }),
  })
  .meta({ id: 'RegisterInput' });
export type RegisterInput = z.input<typeof RegisterInput>;

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

// ---- Appearance preferences (NIWA-PLAN-B-02 V10) ----

/** Colour themes and fonts the clients know; all themes are pastel, each with light and dark variants. */
export const THEME_IDS = ['garden', 'blossom', 'lavender', 'sky', 'peach'] as const;
export const FONT_IDS = ['fredoka', 'inter', 'atkinson', 'system'] as const;
export const ColorModePreference = z.enum(['system', 'light', 'dark']).meta({ id: 'ColorModePreference' });

/** Public holidays shown in the Calendar (NIWA-PLAN-B-01 B8). */
export const HolidayPreference = z
  .object({
    country: z.string().nullable().meta({ description: 'ISO 3166-1 alpha-2 code, or null for no holidays' }),
    region: z.string().nullable().meta({ description: 'State/region code within the country, or null' }),
    observances: z.boolean().meta({ description: 'Also show observances (not days off)' }),
  })
  .meta({ id: 'HolidayPreference' });
export type HolidayPreference = z.infer<typeof HolidayPreference>;

export const Preferences = z
  .object({
    theme: z.string().meta({ description: `One of ${THEME_IDS.join(', ')}; clients fall back to garden` }),
    font: z.string().meta({ description: `One of ${FONT_IDS.join(', ')}; clients fall back to fredoka` }),
    mode: ColorModePreference,
    holidays: HolidayPreference,
  })
  .meta({ id: 'Preferences', description: 'Appearance and calendar choices that follow the account' });
export type Preferences = z.infer<typeof Preferences>;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'garden',
  font: 'fredoka',
  mode: 'system',
  holidays: { country: null, region: null, observances: false },
};

/** Partial update; only known ids are accepted. */
export const PreferencesInput = z
  .object({
    theme: z.enum(THEME_IDS).optional(),
    font: z.enum(FONT_IDS).optional(),
    mode: ColorModePreference.optional(),
    holidays: z
      .object({
        country: z
          .string()
          .regex(/^[A-Z]{2}$/)
          .nullable()
          .optional(),
        region: z.string().max(10).nullable().optional(),
        observances: z.boolean().optional(),
      })
      .optional()
      .meta({ description: 'Country/region are checked against the server holiday list' }),
  })
  .meta({ id: 'PreferencesInput' });
export type PreferencesInput = z.infer<typeof PreferencesInput>;

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
    preferences: Preferences,
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
