import { Redis } from 'ioredis';
import type { Logger } from 'pino';
import type { AppConfig } from '../config/env.ts';

/**
 * Redis (Render Key Value in deployed envs). Returns null when REDIS_URL is unset,
 * which env validation only allows for local/test — callers fall back to in-memory stores.
 */
export function createRedis(config: AppConfig, logger: Logger): Redis | null {
  if (!config.REDIS_URL) {
    logger.warn('REDIS_URL not set — using in-memory rate limiting (local/test only)');
    return null;
  }
  const redis = new Redis(config.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: false });
  redis.on('error', (err) => logger.error({ err }, 'Redis error'));
  return redis;
}
