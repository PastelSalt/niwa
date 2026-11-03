import { Schema, model, type Types } from 'mongoose';

/**
 * Item → item link (DATA_MODEL.md §7). `content` links mirror `niwaLink` nodes in the source's body
 * and are re-synced on every content save; `manual` links come from the Related items picker.
 */
export interface LinkDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  sourceId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetAnchorId: string | null;
  label: string | null;
  origin: 'content' | 'manual';
  createdAt: Date;
}

const linkSchema = new Schema<LinkDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    sourceId: { type: Schema.Types.ObjectId, required: true, ref: 'Item' },
    targetId: { type: Schema.Types.ObjectId, required: true, ref: 'Item' },
    targetAnchorId: { type: String, default: null },
    label: { type: String, default: null },
    origin: { type: String, enum: ['content', 'manual'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

linkSchema.index({ workspaceId: 1, sourceId: 1 });
linkSchema.index({ workspaceId: 1, targetId: 1 });
linkSchema.index({ sourceId: 1, targetId: 1, targetAnchorId: 1, origin: 1 }, { unique: true });

export const LinkModel = model<LinkDoc>('Link', linkSchema, 'links');
