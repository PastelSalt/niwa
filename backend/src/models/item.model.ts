import type { ItemPriority, ItemStatus, ItemType, ProseMirrorDoc } from '@niwa/contracts';
import { Schema, model, type Types } from 'mongoose';

/** One model for every item type — specs §6.1. `nature` is derived from `type`, not stored. */
export interface ItemDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  parentId: Types.ObjectId | null;
  title: string;
  content: ProseMirrorDoc | null;
  contentPlainText: string;
  type: ItemType;
  status: ItemStatus;
  priority: ItemPriority;
  orderKey: string;
  tags: string[];
  dueAt: string | null;
  estimatedMinutes: number | null;
  reviewAt: string | null;
  sourceUrl: string | null;
  inboxedAt: Date | null;
  /** Inbox only: where capture suggested filing it (CONCEPT.md §3.1). */
  suggestedParentId: Types.ObjectId | null;
  /** Idempotency key from an offline capture queue (CaptureInput.clientId); null otherwise. */
  captureClientId: string | null;
  archivedAt: Date | null;
  deletedAt: Date | null;
  deleteBatchId: string | null;
  /** True on the item the user deleted (the batch root shown in Trash); false on cascaded descendants. */
  deleteRoot: boolean;
  deletedParentId: Types.ObjectId | null;
  version: number;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItemDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    parentId: { type: Schema.Types.ObjectId, default: null, ref: 'Item' },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: Schema.Types.Mixed, default: null },
    contentPlainText: { type: String, default: '' },
    type: { type: String, enum: ['project', 'task', 'note', 'idea'], required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'blocked', 'completed'],
      default: 'not_started',
    },
    priority: { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'], default: 'none' },
    orderKey: { type: String, required: true },
    tags: { type: [String], default: [] },
    dueAt: { type: String, default: null },
    estimatedMinutes: { type: Number, default: null },
    reviewAt: { type: String, default: null },
    sourceUrl: { type: String, default: null },
    inboxedAt: { type: Date, default: null },
    suggestedParentId: { type: Schema.Types.ObjectId, default: null },
    captureClientId: { type: String, default: null },
    archivedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    deleteBatchId: { type: String, default: null },
    deleteRoot: { type: Boolean, default: false },
    deletedParentId: { type: Schema.Types.ObjectId, default: null },
    version: { type: Number, default: 1 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false, minimize: false },
);

// Indexes — specs §6.3, DATA_MODEL.md §1
itemSchema.index({ workspaceId: 1, parentId: 1, orderKey: 1 });
itemSchema.index({ workspaceId: 1, inboxedAt: 1 });
itemSchema.index({ workspaceId: 1, deletedAt: 1 });
itemSchema.index({ workspaceId: 1, status: 1, dueAt: 1 });
itemSchema.index({ workspaceId: 1, updatedAt: -1 });
itemSchema.index({ workspaceId: 1, deleteBatchId: 1 });
itemSchema.index({ workspaceId: 1, deleteRoot: 1, deletedAt: -1 });
itemSchema.index({ workspaceId: 1, tags: 1 });
// A retried offline capture must not duplicate (DATA_MODEL.md §1).
itemSchema.index(
  { workspaceId: 1, captureClientId: 1 },
  { unique: true, partialFilterExpression: { captureClientId: { $type: 'string' } } },
);
itemSchema.index(
  { title: 'text', tags: 'text', contentPlainText: 'text' },
  { weights: { title: 10, tags: 5, contentPlainText: 1 }, default_language: 'none', name: 'item_text' },
);

export const ItemModel = model<ItemDoc>('Item', itemSchema, 'items');
