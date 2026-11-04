import { rateLimit, type Options } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { AppError } from '../lib/errors.ts';

/** Centralized rate limiting — Redis-backed when available, in-memory otherwise (local/test only). */
export interface RateLimits {
  authMax: number;
  generalMax: number;
  accountMax: number;
  signupPerHour: number;
}

export function createRateLimiters(redis: Redis | null, limits: RateLimits) {
  const make = (prefix: string, limit: number, windowMs: number, extra: Partial<Options> = {}) => {
    const options: Partial<Options> = {
      windowMs,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      handler: (_req, _res, next) =>
        next(new AppError('RATE_LIMITED', 'Too many requests. Slow down a little.')),
      ...extra,
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
    /** Every /api/v1 request, per IP. */
    general: make('general', limits.generalMax, 60_000),
    /** Login / register / password checks, per IP — brute-force protection. */
    auth: make('auth', limits.authMax, 15 * 60_000),
    /**
     * Signed-in requests per account, whatever the IP — so one account spread over many addresses can't
     * hog the shared server. Mount after requireAuth (it keys on the verified user id).
     */
    account: make('account', limits.accountMax, 60_000, {
      keyGenerator: (_req, res) => `u:${(res.locals as Express.Locals).auth?.userId ?? 'anon'}`,
    }),
    /**
     * New accounts per hour across the whole server (one shared key). Only successful sign-ups count, so
     * typos and validation errors don't use it up. Hitting it is logged: it usually means a bot wave.
     */
    signup: make('signup', limits.signupPerHour, 60 * 60_000, {
      keyGenerator: () => 'all',
      skipFailedRequests: true,
      handler: (req, _res, next) => {
        req.log?.warn({ event: 'signup_cap_reached' }, 'Sign-up cap reached for this hour');
        next(
          new AppError('RATE_LIMITED', 'A lot of people are signing up right now. Please try again later.'),
        );
      },
    }),
  };
}
