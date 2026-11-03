import { notFound } from '../lib/errors.ts';
import { workspaceRepo } from '../repositories/workspace.repo.ts';
import { toWorkspace } from './serializers.ts';

export const workspaceService = {
  async get(workspaceId: string) {
    const ws = await workspaceRepo.findById(workspaceId);
    if (!ws) throw notFound('Workspace');
    return toWorkspace(ws);
  },
};
