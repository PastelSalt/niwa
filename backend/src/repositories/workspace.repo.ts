import type { Types } from 'mongoose';
import { WorkspaceModel, type WorkspaceDoc } from '../models/workspace.model.ts';

export const workspaceRepo = {
  findById(id: Types.ObjectId | string): Promise<WorkspaceDoc | null> {
    return WorkspaceModel.findById(id).lean<WorkspaceDoc>().exec();
  },

  async create(name: string): Promise<WorkspaceDoc> {
    const doc = await WorkspaceModel.create({ name });
    return doc.toObject<WorkspaceDoc>();
  },

  async deleteById(id: Types.ObjectId): Promise<void> {
    await WorkspaceModel.deleteOne({ _id: id }).exec();
  },
};
