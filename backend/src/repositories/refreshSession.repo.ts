import type { Types } from 'mongoose';
import { RefreshSessionModel, type RefreshSessionDoc } from '../models/refreshSession.model.ts';

export const refreshSessionRepo = {
  async create(data: {
    userId: Types.ObjectId;
    familyId: string;
    tokenHash: string;
    client: RefreshSessionDoc['client'];
    expiresAt: Date;
  }): Promise<void> {
    await RefreshSessionModel.create(data);
  },

  /**
   * Atomically revoke a live, unexpired session (one-time use). Returns the session it consumed,
   * or null if the token is unknown, expired, or was already used.
   */
  consume(tokenHash: string, now: Date): Promise<RefreshSessionDoc | null> {
    return RefreshSessionModel.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now } },
      { returnDocument: 'before' },
    )
      .lean<RefreshSessionDoc>()
      .exec();
  },

  findByHash(tokenHash: string): Promise<RefreshSessionDoc | null> {
    return RefreshSessionModel.findOne({ tokenHash }).lean<RefreshSessionDoc>().exec();
  },

  /** Every live session of a user, on every device ("sign out everywhere"). */
  async revokeAllForUser(userId: Types.ObjectId, now: Date): Promise<number> {
    const res = await RefreshSessionModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: now } },
    ).exec();
    return res.modifiedCount;
  },

  async revokeFamily(familyId: string, now: Date): Promise<void> {
    await RefreshSessionModel.updateMany({ familyId, revokedAt: null }, { $set: { revokedAt: now } }).exec();
  },
};
