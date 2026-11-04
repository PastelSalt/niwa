import {
  DEFAULT_PREFERENCES,
  natureOf,
  type Item,
  type ItemSummary,
  type PublicUser,
  type Workspace,
} from '@niwa/contracts';
import type { ItemDoc } from '../models/item.model.ts';
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
    onboarding: user.onboarding
      ? {
          status: user.onboarding.status,
          version: user.onboarding.version,
          at: user.onboarding.at.toISOString(),
        }
      : null,
    preferences: {
      theme: user.preferences?.theme ?? DEFAULT_PREFERENCES.theme,
      font: user.preferences?.font ?? DEFAULT_PREFERENCES.font,
      mode: user.preferences?.mode ?? DEFAULT_PREFERENCES.mode,
    },
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

export function toItem(doc: ItemDoc): Item {
  return {
    ...toItemSummary(doc),
    content: (doc.content ?? null) as Item['content'],
  };
}

export function toItemSummary(doc: ItemDoc): ItemSummary {
  const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
  return {
    id: doc._id.toString(),
    workspaceId: doc.workspaceId.toString(),
    parentId: doc.parentId ? doc.parentId.toString() : null,
    title: doc.title,
    type: doc.type,
    nature: natureOf(doc.type),
    status: doc.status,
    priority: doc.priority,
    orderKey: doc.orderKey,
    tags: doc.tags ?? [],
    dueAt: doc.dueAt ?? null,
    estimatedMinutes: doc.estimatedMinutes ?? null,
    reviewAt: doc.reviewAt ?? null,
    sourceUrl: doc.sourceUrl ?? null,
    inboxedAt: iso(doc.inboxedAt),
    suggestedParentId: doc.suggestedParentId ? doc.suggestedParentId.toString() : null,
    archivedAt: iso(doc.archivedAt),
    deletedAt: iso(doc.deletedAt),
    version: doc.version,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    completedAt: iso(doc.completedAt),
  };
}
