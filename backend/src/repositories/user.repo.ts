import type { Types } from 'mongoose';
import { UserModel, type UserDoc } from '../models/user.model.ts';

export const userRepo = {
  findByEmail(email: string): Promise<UserDoc | null> {
    return UserModel.findOne({ email }).lean<UserDoc>().exec();
  },

  findById(id: Types.ObjectId | string): Promise<UserDoc | null> {
    return UserModel.findById(id).lean<UserDoc>().exec();
  },

  count(): Promise<number> {
    return UserModel.estimatedDocumentCount().exec();
  },

  async create(data: { email: string; passwordHash: string; workspaceId: Types.ObjectId }): Promise<UserDoc> {
    const doc = await UserModel.create(data);
    return doc.toObject<UserDoc>();
  },
};
