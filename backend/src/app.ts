import { randomUUID } from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Redis } from 'ioredis';
import type { Logger } from 'pino';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import type { AppConfig } from './config/env.ts';
import { createCloudinary, setCloudinary } from './lib/cloudinary.ts';
import { requestWithoutQuery } from './lib/logger.ts';
import { setQuotas } from './lib/quota.ts';
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
  setQuotas({
    items: config.MAX_ITEMS_PER_ACCOUNT,
    imageBytes: config.MAX_IMAGE_MB_PER_ACCOUNT * 1024 * 1024,
  });
  const limiters = createRateLimiters(redis, {
    authMax: config.RATE_LIMIT_AUTH_MAX,
    generalMax: config.RATE_LIMIT_GENERAL_MAX,
    accountMax: config.RATE_LIMIT_ACCOUNT_MAX,
    signupPerHour: config.RATE_LIMIT_SIGNUP_PER_HOUR,
  });

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
      serializers: { req: requestWithoutQuery },
    }),
  );
  app.use(helmet());
  // gzip/brotli JSON: a full tree at the item quota is ~4.7 MB raw, a few hundred KB compressed.
  app.use(compression());
  app.use(
    cors({
      // Same-origin via the Vercel rewrite needs no CORS; this list is for direct callers (OPS.md §6.1).
      origin: (origin, cb) => cb(null, !origin || config.CORS_ORIGINS.includes(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api/v1', limiters.general, createV1Router({ config, tokens, auth, limiters }));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
