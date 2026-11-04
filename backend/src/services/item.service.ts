import { randomUUID } from 'node:crypto';
import {
  natureOf,
  type CaptureInput,
  type CreateItemInput,
  type DeleteResponse,
  type FileItemInput,
  type FocusResponse,
  type Item,
  type ItemSummary,
  type ListItemsQuery,
  type MoveItemInput,
  type RestoreResponse,
  type UpdateItemInput,
} from '@niwa/contracts';
import type { Types, UpdateQuery } from 'mongoose';
import { extractContentLinks, findSection, replaceSectionWithLink } from '../lib/contentDoc.ts';
import { assertContentSize, extractPlainText } from '../lib/contentText.ts';
import { AppError, notFound } from '../lib/errors.ts';
import { keyBetween, keysAfter, ORDER_KEY_REBALANCE_LENGTH } from '../lib/orderKey.ts';
import type { ItemDoc } from '../models/item.model.ts';
import { itemRepo, toObjectId } from '../repositories/item.repo.ts';
import { linkRepo } from '../repositories/link.repo.ts';
import { attachmentService } from './attachment.service.ts';
import { linkService } from './link.service.ts';
import { scheduleService } from './schedule.service.ts';
import { toItem, toItemSummary } from './serializers.ts';

const ACTIONABLE_TYPES = ['project', 'task'] as const;
const FOCUS_LIMIT = 50;
const RECENT_LIMIT = 15;

/** Business rules for the one item tree — specs §6, DATA_MODEL.md §2–6. */
export const itemService = {
  async tree(workspaceId: string, includeArchived: boolean): Promise<ItemSummary[]> {
    return (await itemRepo.listTree(toObjectId(workspaceId), includeArchived)).map(toItemSummary);
  },

  async list(workspaceId: string, q: ListItemsQuery): Promise<ItemSummary[]> {
    const filter: Record<string, unknown> = {};
    if (q.parentId) filter.parentId = q.parentId === 'root' ? null : q.parentId;
    if (q.type) filter.type = q.type;
    else if (q.nature) filter.type = { $in: q.nature === 'actionable' ? ACTIONABLE_TYPES : ['note', 'idea'] };
    if (q.status) filter.status = q.status;
    if (q.tag) filter.tags = q.tag;
    if (!q.includeArchived) filter.archivedAt = null;
    return (await itemRepo.list(toObjectId(workspaceId), filter)).map(toItemSummary);
  },

  async get(workspaceId: string, id: string): Promise<Item> {
    const doc = await itemRepo.findById(toObjectId(workspaceId), id);
    if (!doc) throw notFound('Item');
    return toItem(doc);
  },

  async ancestors(workspaceId: string, id: string): Promise<ItemSummary[]> {
    const wid = toObjectId(workspaceId);
    const doc = await itemRepo.findById(wid, id);
    if (!doc) throw notFound('Item');
    return (await itemRepo.ancestors(wid, doc)).reverse().map(toItemSummary);
  },

  async create(workspaceId: string, input: CreateItemInput): Promise<Item> {
    const wid = toObjectId(workspaceId);
    if (input.parentId) await requireFiledParent(wid, input.parentId);
    assertContentSize(input.content);

    const orderKey = input.afterId
      ? await keyAfterSibling(wid, input.parentId, input.afterId)
      : keyBetween(await itemRepo.lastSiblingKey(wid, input.parentId), null);

    const status = input.status ?? 'not_started';
    const doc = await itemRepo.create({
      workspaceId: wid,
      parentId: input.parentId ? toObjectId(input.parentId) : null,
      title: input.title,
      type: input.type,
      content: input.content ?? null,
      contentPlainText: extractPlainText(input.content),
      status,
      priority: input.priority ?? 'none',
      tags: input.tags ?? [],
      dueAt: input.dueAt ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      reviewAt: input.reviewAt ?? null,
      sourceUrl: input.sourceUrl ?? null,
      orderKey,
      completedAt: status === 'completed' ? new Date() : null,
    });
    if (input.content) {
      await linkService.syncFromContent(wid, doc, extractContentLinks(input.content));
      await attachmentService.syncFromContent(wid, doc._id, input.content);
    }
    return toItem(doc);
  },

  async update(workspaceId: string, id: string, input: UpdateItemInput): Promise<Item> {
    const wid = toObjectId(workspaceId);
    const { version, ...fields } = input;
    const $set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) $set[key] = value;
    }
    if (fields.content !== undefined) {
      assertContentSize(fields.content);
      $set.contentPlainText = extractPlainText(fields.content);
    }
    // Type changes are always allowed; nature is derived on read (DATA_MODEL.md §3).
    // Actionable fields are kept when moving to a knowledge type, so a round trip is lossless.
    if (fields.status !== undefined) {
      $set.completedAt = fields.status === 'completed' ? new Date() : null;
    }

    const updated = await versioned(wid, id, version, { $set });
    // Content links mirror niwaLink nodes in the body (CONCEPT.md §5.2).
    if (fields.content !== undefined) {
      await linkService.syncFromContent(wid, updated, extractContentLinks(fields.content));
      await attachmentService.syncFromContent(wid, updated._id, fields.content);
    }
    return toItem(updated);
  },

  /** Promote a heading section to a child item — CONCEPT.md §4. */
  async promoteSection(workspaceId: string, id: string, version: number, anchorId: string) {
    const wid = toObjectId(workspaceId);
    const parent = await itemRepo.findById(wid, id);
    if (!parent) throw notFound('Item');
    if (parent.version !== version) {
      throw new AppError('VERSION_CONFLICT', 'This item was changed elsewhere. Reload and try again.', {
        current: toItem(parent),
      });
    }
    const section = parent.content ? findSection(parent.content, anchorId) : null;
    if (!section) throw new AppError('VALIDATION_ERROR', 'That heading no longer exists in this note.');

    const childContent = {
      type: 'doc' as const,
      content: section.body.length ? section.body : [{ type: 'paragraph' }],
    };
    const child = await this.create(workspaceId, {
      parentId: parent.inboxedAt ? null : parent._id.toString(),
      title: section.title.slice(0, 300) || 'Untitled section',
      type: natureOf(parent.type) === 'actionable' ? 'task' : 'note',
      content: childContent,
    });

    try {
      const updatedParent = await this.update(workspaceId, id, {
        version,
        content: replaceSectionWithLink(parent.content!, section, child),
      });
      return { parent: updatedParent, child };
    } catch (err) {
      // Keep it atomic from the user's view: no orphan child if the parent write fails.
      await itemRepo.hardDelete(wid, [toObjectId(child.id)]);
      throw err;
    }
  },

  /** Review queue — items whose reviewAt is today or earlier (specs §4.1). */
  /** Quick capture — specs §12.8, CONCEPT.md §3.1. Lands in the Inbox, outside the tree. */
  async capture(workspaceId: string, input: CaptureInput): Promise<Item> {
    const wid = toObjectId(workspaceId);
    // Idempotent retries from offline queues: the same clientId returns the first capture.
    if (input.clientId) {
      const earlier = await itemRepo.findByCaptureClientId(wid, input.clientId);
      if (earlier) return toItem(earlier);
    }
    assertContentSize(input.content);
    let suggestedParentId: Types.ObjectId | null = null;
    if (input.suggestedParentId) {
      const parent = await itemRepo.findById(wid, input.suggestedParentId);
      if (parent && !parent.inboxedAt) suggestedParentId = parent._id;
    }
    let doc: ItemDoc;
    try {
      doc = await itemRepo.create({
        workspaceId: wid,
        parentId: null,
        title: input.title,
        type: input.type,
        content: input.content ?? null,
        contentPlainText: extractPlainText(input.content),
        orderKey: keyBetween(null, null), // inbox order is by inboxedAt; a key is assigned on filing
        inboxedAt: new Date(),
        suggestedParentId,
        captureClientId: input.clientId ?? null,
      });
    } catch (err) {
      // Two copies of the same retry raced; the other one won.
      if (input.clientId && (err as { code?: number }).code === 11000) {
        const winner = await itemRepo.findByCaptureClientId(wid, input.clientId);
        if (winner) return toItem(winner);
      }
      throw err;
    }
    if (input.content) await linkService.syncFromContent(wid, doc, extractContentLinks(input.content));
    return toItem(doc);
  },

  async inbox(workspaceId: string): Promise<ItemSummary[]> {
    return (await itemRepo.listInbox(toObjectId(workspaceId))).map(toItemSummary);
  },

  /** File an inbox item into the tree (CONCEPT.md §3.3). */
  async file(workspaceId: string, id: string, input: FileItemInput): Promise<Item> {
    const wid = toObjectId(workspaceId);
    const item = await itemRepo.findById(wid, id);
    if (!item) throw notFound('Item');
    if (!item.inboxedAt) throw new AppError('CONFLICT', 'This item is already filed.');
    const parent = await requireFiledParent(wid, input.parentId);
    const $set: Record<string, unknown> = {
      parentId: parent._id,
      orderKey: keyBetween(await itemRepo.lastSiblingKey(wid, parent._id), null),
      inboxedAt: null,
      suggestedParentId: null,
    };
    if (input.type) $set.type = input.type;
    if (input.dueAt !== undefined) $set.dueAt = input.dueAt;
    if (input.tags) $set.tags = input.tags;
    return toItem(await versioned(wid, id, input.version, { $set }));
  },

  async review(workspaceId: string, today: string): Promise<ItemSummary[]> {
    const docs = await itemRepo.findMany(
      toObjectId(workspaceId),
      { reviewAt: { $ne: null, $lte: today } },
      { reviewAt: 1, orderKey: 1 },
      200,
    );
    return docs.map(toItemSummary);
  },

  async move(workspaceId: string, id: string, input: MoveItemInput): Promise<Item> {
    const wid = toObjectId(workspaceId);
    const item = await itemRepo.findById(wid, id);
    if (!item) throw notFound('Item');
    if (item.inboxedAt) throw new AppError('CONFLICT', 'File inbox items instead of moving them.');

    const parentId = input.parentId;
    if (parentId) {
      if (parentId === id) throw new AppError('VALIDATION_ERROR', 'An item cannot contain itself.');
      const parent = await requireFiledParent(wid, parentId);
      const chain = await itemRepo.ancestors(wid, parent);
      if (chain.some((a) => a._id.toString() === id)) {
        throw new AppError('VALIDATION_ERROR', 'An item cannot be moved inside its own descendant.');
      }
    }

    const siblings = await itemRepo.siblings(wid, parentId, id);
    const orderKey = keyForPosition(siblings, input.beforeId ?? null, input.afterId ?? null);

    const moved = await versioned(wid, id, input.version, {
      $set: { parentId: parentId ? toObjectId(parentId) : null, orderKey },
    });
    if (orderKey.length > ORDER_KEY_REBALANCE_LENGTH) await rebalance(wid, parentId);
    const fresh = await itemRepo.findById(wid, id);
    return toItem(fresh ?? moved);
  },

  async setArchived(workspaceId: string, id: string, version: number, archived: boolean): Promise<Item> {
    const wid = toObjectId(workspaceId);
    return toItem(await versioned(wid, id, version, { $set: { archivedAt: archived ? new Date() : null } }));
  },

  /** Soft delete with cascade — specs §12.6, DATA_MODEL.md §5. */
  async softDelete(workspaceId: string, id: string): Promise<DeleteResponse> {
    const wid = toObjectId(workspaceId);
    const item = await itemRepo.findById(wid, id);
    if (!item) throw notFound('Item');
    const descendants = await itemRepo.descendantIds(wid, item._id, true);
    await itemRepo.softDelete(wid, item, descendants, randomUUID(), new Date());
    return { ok: true, affected: descendants.length + 1 };
  },

  async restore(workspaceId: string, id: string): Promise<RestoreResponse> {
    const wid = toObjectId(workspaceId);
    const target = await itemRepo.findByIdIncludingDeleted(wid, id);
    if (!target || !target.deletedAt || !target.deleteBatchId) throw notFound('Deleted item');

    const batchId = target.deleteBatchId;
    const root = target.deleteRoot ? target : await findBatchRoot(wid, target);
    const originalParentId = root.deletedParentId;
    const parentAlive = originalParentId ? !!(await itemRepo.findById(wid, originalParentId)) : true;

    const restoredCount = await itemRepo.restoreBatch(wid, batchId);
    const placement: UpdateQuery<ItemDoc> = parentAlive
      ? {
          $set: {
            parentId: originalParentId,
            orderKey: keyBetween(await itemRepo.lastSiblingKey(wid, originalParentId), null),
          },
        }
      : { $set: { parentId: null, inboxedAt: new Date() } };
    const fresh = await itemRepo.findById(wid, root._id);
    const placed = await versioned(wid, root._id, fresh!.version, placement);

    return { item: toItem(placed), restoredTo: parentAlive ? 'original' : 'inbox', restoredCount };
  },

  /** Hard delete from Trash: the batch and everything still under it. */
  async purge(workspaceId: string, id: string): Promise<DeleteResponse> {
    const wid = toObjectId(workspaceId);
    const target = await itemRepo.findByIdIncludingDeleted(wid, id);
    if (!target || !target.deletedAt) {
      throw new AppError('CONFLICT', 'Only items in Trash can be deleted permanently.');
    }
    const root = target.deleteRoot ? target : await findBatchRoot(wid, target);
    const ids = [root._id, ...(await itemRepo.descendantIds(wid, root._id, false))];
    await scheduleService.purgeForItems(wid, ids);
    await attachmentService.purgeForItems(wid, ids);
    await linkRepo.deleteForItems(wid, ids);
    const affected = await itemRepo.hardDelete(wid, ids);
    return { ok: true, affected };
  },

  async trash(workspaceId: string): Promise<ItemSummary[]> {
    return (await itemRepo.listTrash(toObjectId(workspaceId))).map(toItemSummary);
  },

  /** Focus sections — specs §4.2. `today` is the client's local calendar day. */
  async focus(workspaceId: string, today: string, upcomingDays: number): Promise<FocusResponse> {
    const wid = toObjectId(workspaceId);
    const actionable = { type: { $in: ACTIONABLE_TYPES } };
    const open = { ...actionable, status: { $ne: 'completed' } };
    const horizon = addDays(today, upcomingDays);
    const byDue = { dueAt: 1, orderKey: 1 } as const;

    const [inProgress, highPriority, overdue, upcoming, recentlyUpdated] = await Promise.all([
      itemRepo.findMany(wid, { ...actionable, status: 'in_progress' }, { updatedAt: -1 }, FOCUS_LIMIT),
      itemRepo.findMany(
        wid,
        { ...open, priority: { $in: ['high', 'critical'] } },
        { priority: 1, ...byDue },
        FOCUS_LIMIT,
      ),
      itemRepo.findMany(wid, { ...open, dueAt: { $ne: null, $lt: today } }, byDue, FOCUS_LIMIT),
      itemRepo.findMany(wid, { ...open, dueAt: { $gte: today, $lte: horizon } }, byDue, FOCUS_LIMIT),
      itemRepo.findMany(wid, actionable, { updatedAt: -1 }, RECENT_LIMIT),
    ]);

    // 'critical' sorts after 'high' alphabetically; put it first.
    highPriority.sort((a, b) => Number(b.priority === 'critical') - Number(a.priority === 'critical'));

    return {
      inProgress: inProgress.map(toItemSummary),
      highPriority: highPriority.map(toItemSummary),
      overdue: overdue.map(toItemSummary),
      upcoming: upcoming.map(toItemSummary),
      recentlyUpdated: recentlyUpdated.map(toItemSummary),
    };
  },

  tags(workspaceId: string) {
    return itemRepo.tagCounts(toObjectId(workspaceId));
  },

  async renameTag(workspaceId: string, from: string, to: string): Promise<number> {
    if (from === to) return 0;
    return itemRepo.renameTag(toObjectId(workspaceId), from, to);
  },
};

// ---- helpers ----

async function requireFiledParent(wid: Types.ObjectId, parentId: string | Types.ObjectId): Promise<ItemDoc> {
  const parent = await itemRepo.findById(wid, parentId);
  if (!parent) throw new AppError('VALIDATION_ERROR', 'Parent item not found.', { field: 'parentId' });
  if (parent.inboxedAt)
    throw new AppError('VALIDATION_ERROR', 'Inbox items cannot have children until filed.');
  return parent;
}

/** Version-checked write; distinguishes "gone" from "someone else changed it". */
async function versioned(
  wid: Types.ObjectId,
  id: string | Types.ObjectId,
  version: number,
  update: UpdateQuery<ItemDoc>,
): Promise<ItemDoc> {
  const updated = await itemRepo.updateVersioned(wid, id, version, update);
  if (updated) return updated;
  const current = await itemRepo.findById(wid, id);
  if (!current) throw notFound('Item');
  throw new AppError('VERSION_CONFLICT', 'This item was changed elsewhere. Reload and try again.', {
    current: toItem(current),
  });
}

async function keyAfterSibling(
  wid: Types.ObjectId,
  parentId: string | null,
  afterId: string,
): Promise<string> {
  const siblings = await itemRepo.siblings(wid, parentId);
  return keyForPosition(siblings, null, afterId);
}

/** Server-minted key between neighbours (DATA_MODEL.md §4). Neighbours must be siblings in the target scope. */
function keyForPosition(siblings: ItemDoc[], beforeId: string | null, afterId: string | null): string {
  const index = (id: string) => {
    const i = siblings.findIndex((s) => s._id.toString() === id);
    if (i < 0) throw new AppError('VALIDATION_ERROR', 'Neighbour is not a sibling in the target parent.');
    return i;
  };
  if (afterId) {
    const i = index(afterId);
    return keyBetween(siblings[i]!.orderKey, siblings[i + 1]?.orderKey ?? null);
  }
  if (beforeId) {
    const i = index(beforeId);
    return keyBetween(siblings[i - 1]?.orderKey ?? null, siblings[i]!.orderKey);
  }
  return keyBetween(siblings.at(-1)?.orderKey ?? null, null);
}

async function rebalance(wid: Types.ObjectId, parentId: string | null): Promise<void> {
  const siblings = await itemRepo.siblings(wid, parentId);
  const keys = keysAfter(null, siblings.length);
  await itemRepo.setOrderKeys(
    wid,
    siblings.map((s, i) => ({ id: s._id, orderKey: keys[i]! })),
  );
}

async function findBatchRoot(wid: Types.ObjectId, member: ItemDoc): Promise<ItemDoc> {
  const chain = await itemRepo.ancestors(wid, member);
  const root = chain.find((a) => a.deleteRoot && a.deleteBatchId === member.deleteBatchId);
  if (!root) throw notFound('Deleted item');
  return root;
}

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
