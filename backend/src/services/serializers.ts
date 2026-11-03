import type { PublicUser, Workspace } from '@niwa/contracts';
import type { UserDoc } from '../models/user.model.ts';
import type { WorkspaceDoc } from '../models/workspace.model.ts';

/** DB documents → contract DTOs. Secrets (passwordHash, AI key) never leave here. */

export function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    workspaceId: user.workspaceId.toString(),
    aiEnabled: user.aiEnabled,
    hasAiKey: !!user.aiApiKeyEncrypted,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toWorkspace(ws: WorkspaceDoc): Workspace {
  return {
    id: ws._id.toString(),
    name: ws.name,
    createdAt: ws.createdAt.toISOString(),
    updatedAt: ws.updatedAt.toISOString(),
  };
}
