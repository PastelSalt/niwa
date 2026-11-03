import type { ItemType } from '@niwa/contracts';
import { Types, type UpdateQuery } from 'mongoose';
import { keysAfter } from '../lib/orderKey.ts';
import { ItemModel, type ItemDoc } from '../models/item.model.ts';

type Wid = Types.ObjectId;
type Oid = Types.ObjectId | string;

/** Live = filed into the tree: not deleted, not in the Inbox. */
const live = (workspaceId: Wid) => ({ workspaceId, deletedAt: null, inboxedAt: null });

/** Every query is scoped by workspaceId and, unless stated, excludes soft-deleted rows. */
export const itemRepo = {
  /** Root containers for a new workspace — specs §12.3. */
  async createRootContainers(workspaceId: Wid, titles: readonly string[]): Promise<void> {
    const keys = keysAfter(null, titles.length);
    await ItemModel.insertMany(
      titles.map((title, i) => ({ workspaceId, parentId: null, title, type: 'note', orderKey: keys[i] })),
    );
  },

  async deleteAllInWorkspace(workspaceId: Wid): Promise<void> {
    await ItemModel.deleteMany({ workspaceId }).exec();
  },

  async create(
    data: Partial<ItemDoc> & { workspaceId: Wid; title: string; type: ItemType; orderKey: string },
  ) {
    const doc = await ItemModel.create(data);
    return doc.toObject<ItemDoc>();
  },

  /** Any non-deleted item (filed or inboxed). */
  findById(workspaceId: Wid, id: Oid): Promise<ItemDoc | null> {
    return ItemModel.findOne({ _id: id, workspaceId, deletedAt: null }).lean<ItemDoc>().exec();
  },

  findByIdIncludingDeleted(workspaceId: Wid, id: Oid): Promise<ItemDoc | null> {
    return ItemModel.findOne({ _id: id, workspaceId }).lean<ItemDoc>().exec();
  },

  /** Filed items only; `content` excluded (summaries). */
  listTree(workspaceId: Wid, includeArchived: boolean): Promise<ItemDoc[]> {
    return ItemModel.find({ ...live(workspaceId), ...(includeArchived ? {} : { archivedAt: null }) })
      .select({ content: 0, contentPlainText: 0 })
      .sort({ orderKey: 1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  /** Filed items by default; `includeInbox` widens to any non-deleted item. Archived filtering is the caller's. */
  list(
    workspaceId: Wid,
    filter: Record<string, unknown>,
    opts: { includeInbox?: boolean; includeArchived?: boolean } = {},
  ): Promise<ItemDoc[]> {
    const base = opts.includeInbox ? { workspaceId, deletedAt: null } : live(workspaceId);
    return ItemModel.find({ ...base, ...filter })
      .select({ content: 0, contentPlainText: 0 })
      .sort({ orderKey: 1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  /** Live siblings in order, optionally excluding one item (the one being moved). */
  siblings(workspaceId: Wid, parentId: Oid | null, excludeId?: Oid): Promise<ItemDoc[]> {
    return ItemModel.find({
      ...live(workspaceId),
      parentId,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
      .select({ _id: 1, orderKey: 1 })
      .sort({ orderKey: 1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  lastSiblingKey(workspaceId: Wid, parentId: Oid | null): Promise<string | null> {
    return ItemModel.findOne({ ...live(workspaceId), parentId })
      .sort({ orderKey: -1 })
      .select({ orderKey: 1 })
      .lean<ItemDoc>()
      .exec()
      .then((d) => d?.orderKey ?? null);
  },

  /** Optimistic-concurrency update: applies only if `version` still matches. Bumps version. */
  updateVersioned(
    workspaceId: Wid,
    id: Oid,
    version: number,
    update: UpdateQuery<ItemDoc>,
  ): Promise<ItemDoc | null> {
    return ItemModel.findOneAndUpdate(
      { _id: id, workspaceId, deletedAt: null, version },
      { ...update, $inc: { version: 1 } },
      { returnDocument: 'after' },
    )
      .lean<ItemDoc>()
      .exec();
  },

  async setOrderKeys(workspaceId: Wid, updates: { id: Oid; orderKey: string }[]): Promise<void> {
    if (updates.length === 0) return;
    await ItemModel.bulkWrite(
      updates.map((u) => ({
        updateOne: { filter: { _id: u.id, workspaceId }, update: { $set: { orderKey: u.orderKey } } },
      })),
    );
  },

  /** Ancestor chain from the direct parent upward (nearest first). Stops at root or a missing link. */
  async ancestors(workspaceId: Wid, start: ItemDoc): Promise<ItemDoc[]> {
    const chain: ItemDoc[] = [];
    const seen = new Set<string>();
    let parentId = start.parentId;
    while (parentId && !seen.has(parentId.toString())) {
      seen.add(parentId.toString());
      const parent = await ItemModel.findOne({ _id: parentId, workspaceId })
        .select({ content: 0, contentPlainText: 0 })
        .lean<ItemDoc>()
        .exec();
      if (!parent) break;
      chain.push(parent);
      parentId = parent.parentId;
    }
    return chain;
  },

  /** All descendant ids, level by level. `onlyLive` skips subtrees already soft-deleted. */
  async descendantIds(
    workspaceId: Wid,
    rootId: Types.ObjectId,
    onlyLive: boolean,
  ): Promise<Types.ObjectId[]> {
    const out: Types.ObjectId[] = [];
    let frontier = [rootId];
    while (frontier.length > 0) {
      const children = await ItemModel.find({
        workspaceId,
        parentId: { $in: frontier },
        ...(onlyLive ? { deletedAt: null } : {}),
      })
        .select({ _id: 1 })
        .lean<{ _id: Types.ObjectId }[]>()
        .exec();
      frontier = children.map((c) => c._id);
      out.push(...frontier);
    }
    return out;
  },

  async softDelete(
    workspaceId: Wid,
    root: ItemDoc,
    descendantIds: Types.ObjectId[],
    batchId: string,
    now: Date,
  ): Promise<void> {
    await ItemModel.updateOne(
      { _id: root._id, workspaceId },
      {
        $set: { deletedAt: now, deleteBatchId: batchId, deleteRoot: true, deletedParentId: root.parentId },
        $inc: { version: 1 },
      },
    ).exec();
    if (descendantIds.length > 0) {
      await ItemModel.updateMany(
        { _id: { $in: descendantIds }, workspaceId },
        { $set: { deletedAt: now, deleteBatchId: batchId, deleteRoot: false }, $inc: { version: 1 } },
      ).exec();
    }
  },

  async restoreBatch(workspaceId: Wid, batchId: string): Promise<number> {
    const res = await ItemModel.updateMany(
      { workspaceId, deleteBatchId: batchId },
      {
        $set: { deletedAt: null, deleteBatchId: null, deleteRoot: false, deletedParentId: null },
        $inc: { version: 1 },
      },
    ).exec();
    return res.modifiedCount;
  },

  async hardDelete(workspaceId: Wid, ids: Types.ObjectId[]): Promise<number> {
    const res = await ItemModel.deleteMany({ workspaceId, _id: { $in: ids } }).exec();
    return res.deletedCount;
  },

  /** Trash shows only what the user deleted, newest first. */
  /** Inbox, newest capture first (specs §12.8). */
  listInbox(workspaceId: Wid): Promise<ItemDoc[]> {
    return ItemModel.find({ workspaceId, inboxedAt: { $ne: null }, deletedAt: null })
      .select({ content: 0, contentPlainText: 0 })
      .sort({ inboxedAt: -1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  /** Whole-word search on the weighted text index (title 10, tags 5, body 1). Includes the body text. */
  textSearch(workspaceId: Wid, q: string, filter: Record<string, unknown>, limit: number) {
    return ItemModel.find(
      { workspaceId, deletedAt: null, ...filter, $text: { $search: q } },
      { score: { $meta: 'textScore' }, content: 0 },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean<(ItemDoc & { score: number })[]>()
      .exec();
  },

  /** Substring fallback so partial words ("netw") still match. */
  substringSearch(workspaceId: Wid, pattern: RegExp, filter: Record<string, unknown>, limit: number) {
    return ItemModel.find(
      {
        workspaceId,
        deletedAt: null,
        ...filter,
        $or: [{ title: pattern }, { tags: pattern }, { contentPlainText: pattern }],
      },
      { content: 0 },
    )
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean<ItemDoc[]>()
      .exec();
  },

  listTrash(workspaceId: Wid): Promise<ItemDoc[]> {
    return ItemModel.find({ workspaceId, deleteRoot: true, deletedAt: { $ne: null } })
      .select({ content: 0, contentPlainText: 0 })
      .sort({ deletedAt: -1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  findMany(workspaceId: Wid, filter: Record<string, unknown>, sort: Record<string, 1 | -1>, limit: number) {
    return ItemModel.find({ ...live(workspaceId), archivedAt: null, ...filter })
      .select({ content: 0, contentPlainText: 0 })
      .sort(sort)
      .limit(limit)
      .lean<ItemDoc[]>()
      .exec();
  },

  tagCounts(workspaceId: Wid): Promise<{ tag: string; count: number }[]> {
    return ItemModel.aggregate<{ tag: string; count: number }>([
      { $match: { workspaceId, deletedAt: null } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]).exec();
  },

  /** Replace `from` with `to` on every item that has it (merge if `to` already present). */
  async renameTag(workspaceId: Wid, from: string, to: string): Promise<number> {
    const res = await ItemModel.updateMany(
      { workspaceId, tags: from },
      [
        {
          $set: {
            tags: {
              $concatArrays: [
                {
                  $filter: {
                    input: '$tags',
                    cond: { $and: [{ $ne: ['$$this', from] }, { $ne: ['$$this', to] }] },
                  },
                },
                [to],
              ],
            },
            version: { $add: ['$version', 1] },
          },
        },
      ],
      { updatePipeline: true },
    ).exec();
    return res.modifiedCount;
  },
};

export const toObjectId = (id: string) => new Types.ObjectId(id);
