import { rateLimit, type Options } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { AppError } from '../lib/errors.ts';

/** Centralized rate limiting — Redis-backed when available, in-memory otherwise (local/test only). */
export function createRateLimiters(redis: Redis | null) {
  const make = (prefix: string, limit: number, windowMs: number) => {
    const options: Partial<Options> = {
      windowMs,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(new AppError('RATE_LIMITED', 'Too many requests. Slow down a little.')),
    };
    if (redis) {
      options.store = new RedisStore({
        prefix: `niwa:rl:${prefix}:`,
        sendCommand: (command: string, ...args: string[]) =>
          redis.call(command, ...args) as Promise<RedisReply>,
      });
    }
    return rateLimit(options);
  };

  return {
    /** Every /api/v1 request. */
    general: make('general', 300, 60_000),
    /** Login / register / refresh — brute-force protection. */
    auth: make('auth', 20, 15 * 60_000),
  };
}
