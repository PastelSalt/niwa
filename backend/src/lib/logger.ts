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

/**
 * Request log entries without query strings: search terms (`/search?q=…`) and other query values are user
 * content, so only paths are kept — for the request URL and for the `Referer` header, which carries the
 * page the browser was on (Privacy Policy, owner decision 2026-11-04). pino-http passes the standard
 * serialized request (id, method, url, query, params, headers, remoteAddress, remotePort).
 */
export function requestWithoutQuery<
  T extends { url?: string; query?: unknown; headers?: Record<string, unknown> },
>(req: T) {
  const { query: _query, ...rest } = req;
  const path = (v: unknown) => (typeof v === 'string' ? v.split('?')[0] : v);
  return {
    ...rest,
    url: path(req.url) as string | undefined,
    ...(req.headers ? { headers: { ...req.headers, referer: path(req.headers.referer) } } : {}),
  };
}
