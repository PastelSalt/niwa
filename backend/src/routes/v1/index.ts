import { Router, type RequestHandler } from 'express';
import type { AppConfig } from '../../config/env.ts';
import { createAuthController } from '../../controllers/auth.controller.ts';
import { itemController } from '../../controllers/item.controller.ts';
import { scheduleController } from '../../controllers/schedule.controller.ts';
import { uploadController } from '../../controllers/upload.controller.ts';
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
  // Refresh tokens are 256-bit random values (not guessable), so only the general limiter applies;
  // the strict limiter would lock out normal page reloads.
  router.post('/auth/refresh', authCtl.refresh);
  router.post('/auth/logout', authCtl.logout);
  router.post('/auth/logout-all', protect, authCtl.logoutAll);
  router.get('/auth/me', protect, authCtl.me);
  router.get('/auth/config', authCtl.config);

  // Account (NIWA-PLAN-B-01 B4, B7). Password checks go through the strict limiter like login.
  router.put('/account/onboarding', protect, authCtl.setOnboarding);
  router.post('/account/password', authLimiter, protect, authCtl.changePassword);
  router.get('/account/export', protect, authCtl.exportData);
  router.post('/account/delete', authLimiter, protect, authCtl.deleteAccount);

  router.get('/workspace', protect, system.workspace);

  // Items (M3)
  router.get('/tree', protect, itemController.tree);
  router.get('/items', protect, itemController.list);
  router.post('/items', protect, itemController.create);
  router.get('/items/:id', protect, itemController.get);
  router.patch('/items/:id', protect, itemController.update);
  router.delete('/items/:id', protect, itemController.remove);
  router.get('/items/:id/ancestors', protect, itemController.ancestors);
  router.post('/items/:id/move', protect, itemController.move);
  router.post('/items/:id/archive', protect, itemController.archive);
  router.post('/items/:id/unarchive', protect, itemController.unarchive);
  router.post('/items/:id/restore', protect, itemController.restore);
  router.delete('/items/:id/permanent', protect, itemController.purge);
  router.get('/trash', protect, itemController.trash);
  router.get('/focus', protect, itemController.focus);
  router.get('/tags', protect, itemController.tags);
  router.post('/tags/rename', protect, itemController.renameTag);

  // Knowledge (M4)
  router.get('/review', protect, itemController.review);
  router.post('/items/:id/promote-section', protect, itemController.promoteSection);
  router.get('/items/:id/links', protect, itemController.links);
  router.post('/links', protect, itemController.createLink);
  router.delete('/links/:id', protect, itemController.removeLink);

  // Inbox + Search (M6)
  router.get('/inbox', protect, itemController.inbox);
  router.post('/inbox', protect, itemController.capture);
  router.post('/items/:id/file', protect, itemController.file);
  router.get('/search', protect, itemController.search);

  // Uploads (M7)
  router.get('/uploads/config', protect, uploadController.config);
  router.post('/uploads/sign', protect, uploadController.sign);
  router.post('/attachments', protect, uploadController.confirm);
  router.delete('/attachments/:id', protect, uploadController.remove);

  // Scheduler (M5)
  router.get('/schedule', protect, scheduleController.range);
  router.post('/schedule', protect, scheduleController.create);
  router.patch('/schedule/:id', protect, scheduleController.update);
  router.delete('/schedule/:id', protect, scheduleController.remove);
  router.get('/items/:id/schedule', protect, scheduleController.forItem);

  return router;
}
