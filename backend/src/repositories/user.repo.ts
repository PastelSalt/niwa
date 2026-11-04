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

  update(
    id: Types.ObjectId | string,
    set: Partial<Pick<UserDoc, 'passwordHash' | 'onboarding' | 'disabledAt' | 'disabledReason'>>,
  ): Promise<UserDoc | null> {
    return UserModel.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).lean<UserDoc>().exec();
  },

  async deleteById(id: Types.ObjectId | string): Promise<void> {
    await UserModel.deleteOne({ _id: id }).exec();
  },

  async create(data: { email: string; passwordHash: string; workspaceId: Types.ObjectId }): Promise<UserDoc> {
    const doc = await UserModel.create(data);
    return doc.toObject<UserDoc>();
  },
};
