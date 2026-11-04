import { z } from 'zod';

const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

const secret = z.string().min(32, 'Must be at least 32 characters');

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    APP_ENV: z.enum(['local', 'staging', 'production', 'test']).default('local'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

    MONGODB_URI: z.string().min(1),
    MONGODB_DB: z.string().min(1).default('niwa_dev'),
    REDIS_URL: z.string().optional(),

    JWT_ACCESS_SECRET: secret,
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(300).max(900).default(600),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(7).max(30).default(14),

    /** `open` in production (NIWA is open to everyone); the code default stays safe for fresh installs. */
    REGISTRATION_MODE: z.enum(['first_user_only', 'open', 'closed']).default('first_user_only'),
    /** Login/register attempts per 15 min per IP. Raised only for local e2e runs. */
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
    /** All /api/v1 requests per minute per IP (autosave + page loads stay well under this). */
    RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().min(1).default(600),
    /** Signed-in requests per minute per account, whatever the IP (multi-user readiness). */
    RATE_LIMIT_ACCOUNT_MAX: z.coerce.number().int().min(1).default(600),
    /** New accounts per hour across the whole server — caps sign-up bursts from many IPs. */
    RATE_LIMIT_SIGNUP_PER_HOUR: z.coerce.number().int().min(1).default(30),

    /** Per-account limits (lib/quota.ts). Trash counts until purged. */
    MAX_ITEMS_PER_ACCOUNT: z.coerce.number().int().min(10).default(10_000),
    MAX_IMAGE_MB_PER_ACCOUNT: z.coerce.number().int().min(1).default(200),

    CORS_ORIGINS: csv,

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_FOLDER: z.string().default('niwa/local'),

    AI_ENCRYPTION_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const deployed = env.APP_ENV === 'staging' || env.APP_ENV === 'production';
    if (deployed && !env.REDIS_URL) {
      ctx.addIssue({ code: 'custom', path: ['REDIS_URL'], message: 'Required outside local/test' });
    }
    if (deployed && env.CORS_ORIGINS.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Required outside local/test' });
    }
  });

export type AppConfig = z.infer<typeof EnvSchema> & {
  /** Cookies get `Secure` everywhere except plain-http local dev and tests. */
  secureCookies: boolean;
};

/** Validates env at startup and fails fast — specs §11.2. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  const env = parsed.data;
  return { ...env, secureCookies: env.APP_ENV !== 'local' && env.APP_ENV !== 'test' };
}
