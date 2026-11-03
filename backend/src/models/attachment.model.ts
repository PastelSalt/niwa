import { Schema, model, type Types } from 'mongoose';

/** An image stored in Cloudinary and used in an item body — DATA_MODEL.md §8. */
export interface AttachmentDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  itemId: Types.ObjectId;
  cloudinaryPublicId: string;
  secureUrl: string;
  mime: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  size: number;
  /** Set when no image node references it any more; cleaned up after a grace period. */
  orphanedAt: Date | null;
  createdAt: Date;
}

const attachmentSchema = new Schema<AttachmentDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    itemId: { type: Schema.Types.ObjectId, required: true, ref: 'Item' },
    cloudinaryPublicId: { type: String, required: true, unique: true },
    secureUrl: { type: String, required: true },
    mime: { type: String, enum: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], required: true },
    size: { type: Number, required: true },
    orphanedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

attachmentSchema.index({ workspaceId: 1, itemId: 1 });
attachmentSchema.index({ orphanedAt: 1 });

export const AttachmentModel = model<AttachmentDoc>('Attachment', attachmentSchema, 'attachments');
