import type { Types } from 'mongoose';
import { LinkModel, type LinkDoc } from '../models/link.model.ts';

type Wid = Types.ObjectId;

export interface LinkKey {
  targetId: string;
  targetAnchorId: string | null;
}

export const linkRepo = {
  bySource(workspaceId: Wid, sourceId: Types.ObjectId | string): Promise<LinkDoc[]> {
    return LinkModel.find({ workspaceId, sourceId }).sort({ createdAt: 1 }).lean<LinkDoc[]>().exec();
  },

  byTarget(workspaceId: Wid, targetId: Types.ObjectId | string): Promise<LinkDoc[]> {
    return LinkModel.find({ workspaceId, targetId }).sort({ createdAt: 1 }).lean<LinkDoc[]>().exec();
  },

  findById(workspaceId: Wid, id: string): Promise<LinkDoc | null> {
    return LinkModel.findOne({ _id: id, workspaceId }).lean<LinkDoc>().exec();
  },

  async create(data: Omit<LinkDoc, '_id' | 'createdAt'>): Promise<LinkDoc> {
    const doc = await LinkModel.create(data);
    return doc.toObject<LinkDoc>();
  },

  async deleteById(workspaceId: Wid, id: Types.ObjectId | string): Promise<void> {
    await LinkModel.deleteOne({ _id: id, workspaceId }).exec();
  },

  /** Make the source's `content` links exactly `desired`. Manual links are untouched. */
  async syncContentLinks(workspaceId: Wid, sourceId: Types.ObjectId, desired: LinkKey[]): Promise<void> {
    const existing = await LinkModel.find({ workspaceId, sourceId, origin: 'content' })
      .lean<LinkDoc[]>()
      .exec();
    const key = (t: string, a: string | null) => `${t}#${a ?? ''}`;
    const want = new Map(desired.map((d) => [key(d.targetId, d.targetAnchorId), d]));
    const have = new Map(existing.map((l) => [key(l.targetId.toString(), l.targetAnchorId), l]));

    const stale = existing.filter((l) => !want.has(key(l.targetId.toString(), l.targetAnchorId)));
    const fresh = desired.filter((d) => !have.has(key(d.targetId, d.targetAnchorId)));

    if (stale.length) await LinkModel.deleteMany({ _id: { $in: stale.map((l) => l._id) } }).exec();
    if (fresh.length) {
      await LinkModel.insertMany(
        fresh.map((d) => ({
          workspaceId,
          sourceId,
          targetId: d.targetId,
          targetAnchorId: d.targetAnchorId,
          origin: 'content' as const,
        })),
        { ordered: false },
      ).catch((err: { code?: number }) => {
        if (err.code !== 11000) throw err; // a concurrent save already inserted it
      });
    }
  },

  /** Permanent delete: remove links in both directions. */
  async deleteForItems(workspaceId: Wid, ids: Types.ObjectId[]): Promise<void> {
    await LinkModel.deleteMany({
      workspaceId,
      $or: [{ sourceId: { $in: ids } }, { targetId: { $in: ids } }],
    }).exec();
  },
};
