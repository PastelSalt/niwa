import type { Types } from 'mongoose';
import { keysAfter } from '../lib/orderKey.ts';
import { ItemModel, type ItemDoc } from '../models/item.model.ts';

/** Every query is scoped by workspaceId and, unless stated, excludes soft-deleted rows. */
export const itemRepo = {
  listRoots(workspaceId: Types.ObjectId): Promise<ItemDoc[]> {
    return ItemModel.find({ workspaceId, parentId: null, inboxedAt: null, deletedAt: null })
      .sort({ orderKey: 1 })
      .lean<ItemDoc[]>()
      .exec();
  },

  /** Root containers for a new workspace — specs §12.3. */
  async createRootContainers(workspaceId: Types.ObjectId, titles: readonly string[]): Promise<void> {
    const keys = keysAfter(null, titles.length);
    await ItemModel.insertMany(
      titles.map((title, i) => ({ workspaceId, parentId: null, title, type: 'note', orderKey: keys[i] })),
    );
  },

  async deleteAllInWorkspace(workspaceId: Types.ObjectId): Promise<void> {
    await ItemModel.deleteMany({ workspaceId }).exec();
  },
};
