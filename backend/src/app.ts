import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/env.ts';
import { createCloudinary, setCloudinary } from './lib/cloudinary.ts';
import { errorHandler, notFoundHandler } from './middleware/error.ts';
import { createRateLimiters } from './middleware/rateLimit.ts';
import { createV1Router } from './routes/v1/index.ts';
import { setUploadFolder } from './services/attachment.service.ts';
import { createAuthService } from './services/auth.service.ts';
import { createTokenService } from './services/token.service.ts';

export interface AppDeps {
  config: AppConfig;
  logger: Logger;
  redis: Redis | null;
  /** Injectable for tests (Cloudinary calls). */
  fetch?: typeof fetch;
}

export function createApp({ config, logger, redis, fetch: fetchImpl }: AppDeps): Express {
  const app = express();
  const tokens = createTokenService(config);
  const auth = createAuthService(config, tokens);
  setCloudinary(createCloudinary(config, fetchImpl));
  setUploadFolder(config.CLOUDINARY_FOLDER);
  const limiters = createRateLimiters(redis, config.RATE_LIMIT_AUTH_MAX, config.RATE_LIMIT_GENERAL_MAX);

  // Render (and the Vercel rewrite) sit in front of us: trust the first proxy hop for IP + secure cookies.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length <= 64 ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      // Same-origin via the Vercel rewrite needs no CORS; this list is for direct callers (OPS.md §6.1).
      origin: (origin, cb) => cb(null, !origin || config.CORS_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/v1', limiters.general, createV1Router({ config, tokens, auth, authLimiter: limiters.auth }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
