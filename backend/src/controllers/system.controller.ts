import type { HealthResponse } from '@niwa/contracts';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../config/env.ts';
import { authOf } from '../middleware/auth.ts';
import { workspaceService } from '../services/workspace.service.ts';

export function createSystemController(config: AppConfig) {
  const health: RequestHandler = (_req, res) => {
    const body: HealthResponse = { status: 'ok', env: config.APP_ENV, time: new Date().toISOString() };
    res.json(body);
  };

  const workspace: RequestHandler = async (_req, res) => {
    res.json({ workspace: await workspaceService.get(authOf(res.locals).workspaceId) });
  };

  return { health, workspace };
}
