import { Router, type RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.ts';
import { createAuthController } from '../../controllers/auth.controller.ts';
import { createSystemController } from '../../controllers/system.controller.ts';
import { requireAuth } from '../../middleware/auth.ts';
import type { AuthService } from '../../services/auth.service.ts';
import type { TokenService } from '../../services/token.service.ts';

export interface V1Deps {
  config: AppConfig;
  tokens: TokenService;
  auth: AuthService;
  authLimiter: RequestHandler;
}

/** /api/v1 — paths mirror packages/contracts/src/openapi.ts. */
export function createV1Router({ config, tokens, auth, authLimiter }: V1Deps): Router {
  const router = Router();
  const system = createSystemController(config);
  const authCtl = createAuthController(config, auth);
  const protect = requireAuth(tokens);

  router.get('/health', system.health);

  router.post('/auth/register', authLimiter, authCtl.register);
  router.post('/auth/login', authLimiter, authCtl.login);
  router.post('/auth/refresh', authLimiter, authCtl.refresh);
  router.post('/auth/logout', authCtl.logout);
  router.get('/auth/me', protect, authCtl.me);

  router.get('/workspace', protect, system.workspace);

  return router;
}
