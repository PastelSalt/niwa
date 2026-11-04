import type { AccountUsage } from '@niwa/contracts';
import type { Types } from 'mongoose';
import { AttachmentModel } from '../models/attachment.model.ts';
import { ItemModel } from '../models/item.model.ts';
import { AppError } from './errors.ts';

/**
 * Per-account limits (GAPS "Multi-user readiness"). Free-tier Atlas (512 MB) and Cloudinary are shared by
 * every account, so one heavy account mustn't fill them. Set from env at startup (`setQuotas`).
 * Items in Trash count until they are purged, because they still take space.
 */
let limits = { items: 10_000, imageBytes: 200 * 1024 * 1024 };

export function setQuotas(next: { items: number; imageBytes: number }): void {
  limits = next;
}

async function imageBytes(wid: Types.ObjectId): Promise<number> {
  const [row] = await AttachmentModel.aggregate<{ total: number }>([
    { $match: { workspaceId: wid } },
    { $group: { _id: null, total: { $sum: '$size' } } },
  ]);
  return row?.total ?? 0;
}

export async function usageOf(wid: Types.ObjectId): Promise<AccountUsage> {
  const [items, bytes] = await Promise.all([ItemModel.countDocuments({ workspaceId: wid }), imageBytes(wid)]);
  return { items, itemLimit: limits.items, imageBytes: bytes, imageByteLimit: limits.imageBytes };
}

export async function assertItemQuota(wid: Types.ObjectId, adding = 1): Promise<void> {
  const count = await ItemModel.countDocuments({ workspaceId: wid });
  if (count + adding > limits.items) {
    throw new AppError(
      'QUOTA_EXCEEDED',
      `This account has reached its limit of ${limits.items.toLocaleString('en')} items (Trash included). ` +
        'Empty the Trash or delete items you no longer need.',
    );
  }
}

export async function assertImageQuota(wid: Types.ObjectId, adding = 0): Promise<void> {
  if ((await imageBytes(wid)) + adding > limits.imageBytes) {
    throw new AppError(
      'QUOTA_EXCEEDED',
      `This account has used its ${Math.round(limits.imageBytes / 1024 / 1024)} MB of image storage. ` +
        'Remove images you no longer need to add more.',
    );
  }
}
