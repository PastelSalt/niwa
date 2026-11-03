import { pino, type Logger } from 'pino';
import type { AppConfig } from '../config/env.ts';

/** Never log passwords, tokens, keys, cookies or note content — specs §13. */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.passwordHash',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.content',
  '*.contentPlainText',
];

export function createLogger(config: Pick<AppConfig, 'LOG_LEVEL' | 'APP_ENV'>): Logger {
  return pino({
    level: config.APP_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
    ...(config.APP_ENV === 'local'
      ? { transport: { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } } }
      : {}),
  });
}
