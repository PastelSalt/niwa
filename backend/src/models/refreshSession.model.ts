import { Schema, model, type Types } from 'mongoose';

/**
 * One row per issued refresh token. Rotation revokes the old row and creates a new one in the
 * same `familyId`; presenting a revoked token revokes the whole family — specs §12.1.
 */
export interface RefreshSessionDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  familyId: string;
  /** SHA-256 of the opaque token; the token itself is never stored. */
  tokenHash: string;
  client: 'web' | 'desktop' | 'mobile';
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

const refreshSessionSchema = new Schema<RefreshSessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    client: { type: String, enum: ['web', 'desktop', 'mobile'], required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

// Mongo TTL: drop rows once expired.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// "Sign out everywhere" revokes by user.
refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshSessionModel = model<RefreshSessionDoc>(
  'RefreshSession',
  refreshSessionSchema,
  'refresh_sessions',
);
