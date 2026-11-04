import { randomUUID } from 'node:crypto';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  type Attachment,
  type ConfirmAttachmentInput,
  type ProseMirrorDoc,
  type UploadConfigResponse,
  type UploadSignatureResponse,
} from '@niwa/contracts';
import type { Types } from 'mongoose';
import { cloudinary, PENDING_TAG } from '../lib/cloudinary.ts';
import { AppError, notFound } from '../lib/errors.ts';
import { AttachmentModel, type AttachmentDoc } from '../models/attachment.model.ts';
import { itemRepo, toObjectId } from '../repositories/item.repo.ts';
import { assertImageQuota } from '../lib/quota.ts';

/** Signed Cloudinary uploads + attachment lifecycle — DATA_MODEL.md §8. */

const FORMAT_TO_MIME: Record<string, AttachmentDoc['mime']> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};
const ALLOWED_FORMATS = 'gif,jpeg,jpg,png,webp';
const ORPHAN_GRACE_MS = 7 * 86_400_000;
const PENDING_GRACE_MS = 86_400_000;

let folderRoot = 'niwa/local';
export function setUploadFolder(root: string) {
  folderRoot = root.replace(/\/+$/, '');
}
const folderFor = (workspaceId: string) => `${folderRoot}/${workspaceId}`;

export function toAttachment(a: AttachmentDoc): Attachment {
  return {
    id: a._id.toString(),
    itemId: a.itemId.toString(),
    cloudinaryPublicId: a.cloudinaryPublicId,
    secureUrl: a.secureUrl,
    mime: a.mime,
    size: a.size,
    createdAt: a.createdAt.toISOString(),
  };
}

/** `attachmentId`s referenced by image nodes in a body. */
export function referencedAttachments(doc: ProseMirrorDoc | null | undefined): Set<string> {
  const ids = new Set<string>();
  const walk = (n: { type?: unknown; attrs?: Record<string, unknown>; content?: unknown[] }) => {
    if (n.type === 'image' && typeof n.attrs?.attachmentId === 'string') ids.add(n.attrs.attachmentId);
    for (const c of n.content ?? []) walk(c as typeof n);
  };
  if (doc) walk(doc as never);
  return ids;
}

async function destroyQuietly(publicId: string) {
  try {
    await cloudinary().destroy(publicId);
  } catch {
    // Best effort: a failed remote delete must not block local cleanup; the pending sweep retries tagged leftovers.
  }
}

export const attachmentService = {
  config(): UploadConfigResponse {
    let enabled: boolean;
    try {
      enabled = cloudinary().enabled;
    } catch {
      enabled = false; // not initialised (e.g. scripts)
    }
    return { enabled, maxBytes: MAX_IMAGE_BYTES, allowedMime: [...ALLOWED_IMAGE_MIME] };
  },

  async sign(workspaceId: string, itemId: string): Promise<UploadSignatureResponse> {
    const wid = toObjectId(workspaceId);
    if (!(await itemRepo.findById(wid, itemId))) throw notFound('Item');
    await assertImageQuota(wid); // fail before the upload when already full
    const c = cloudinary();
    const params = {
      folder: folderFor(workspaceId),
      public_id: randomUUID(),
      tags: PENDING_TAG,
      allowed_formats: ALLOWED_FORMATS,
      timestamp: Math.floor(Date.now() / 1000),
    };
    return {
      cloudName: c.cloudName,
      apiKey: c.apiKey,
      timestamp: params.timestamp,
      signature: c.sign(params),
      folder: params.folder,
      publicId: params.public_id,
      tags: params.tags,
      allowedFormats: params.allowed_formats,
      uploadUrl: c.uploadUrl,
    };
  },

  /** After the browser uploaded: verify with Cloudinary, enforce limits, record it. */
  async confirm(workspaceId: string, input: ConfirmAttachmentInput): Promise<Attachment> {
    const wid = toObjectId(workspaceId);
    const item = await itemRepo.findById(wid, input.itemId);
    if (!item) throw notFound('Item');
    // Only images signed for this workspace's folder can be claimed.
    if (!input.publicId.startsWith(`${folderFor(workspaceId)}/`)) {
      throw new AppError('FORBIDDEN', 'That upload does not belong to this workspace.');
    }
    const existing = await AttachmentModel.findOne({
      cloudinaryPublicId: input.publicId,
    }).lean<AttachmentDoc>();
    if (existing) return toAttachment(existing);

    const c = cloudinary();
    const res = await c.getResource(input.publicId);
    if (!res) throw new AppError('VALIDATION_ERROR', 'Upload not found. Try again.');
    const mime = FORMAT_TO_MIME[res.format.toLowerCase()];
    if (!mime || res.bytes > MAX_IMAGE_BYTES) {
      await destroyQuietly(input.publicId);
      throw new AppError(
        'VALIDATION_ERROR',
        `Images must be PNG, JPEG, WebP or GIF and at most ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`,
      );
    }
    try {
      await assertImageQuota(wid, res.bytes);
    } catch (err) {
      await destroyQuietly(input.publicId);
      throw err;
    }
    const doc = await AttachmentModel.create({
      workspaceId: wid,
      itemId: item._id,
      cloudinaryPublicId: res.public_id,
      secureUrl: res.secure_url,
      mime,
      size: res.bytes,
      orphanedAt: null,
    });
    await c.removeTag(res.public_id, PENDING_TAG).catch(() => {});
    return toAttachment(doc.toObject<AttachmentDoc>());
  },

  async remove(workspaceId: string, id: string): Promise<void> {
    const wid = toObjectId(workspaceId);
    const a = await AttachmentModel.findOne({ _id: id, workspaceId: wid }).lean<AttachmentDoc>();
    if (!a) throw notFound('Attachment');
    await destroyQuietly(a.cloudinaryPublicId);
    await AttachmentModel.deleteOne({ _id: a._id });
  },

  /** On every body save: unreferenced images start their grace period; re-referenced ones are kept. */
  async syncFromContent(wid: Types.ObjectId, itemId: Types.ObjectId, doc: ProseMirrorDoc | null | undefined) {
    const used = [...referencedAttachments(doc)].filter((id) => /^[a-f0-9]{24}$/.test(id));
    await AttachmentModel.updateMany(
      { workspaceId: wid, itemId, _id: { $in: used }, orphanedAt: { $ne: null } },
      { $set: { orphanedAt: null } },
    );
    await AttachmentModel.updateMany(
      { workspaceId: wid, itemId, _id: { $nin: used }, orphanedAt: null },
      { $set: { orphanedAt: new Date() } },
    );
  },

  /** Permanent item delete: images go immediately. */
  async purgeForItems(wid: Types.ObjectId, itemIds: Types.ObjectId[]) {
    const list = await AttachmentModel.find({ workspaceId: wid, itemId: { $in: itemIds } }).lean<
      AttachmentDoc[]
    >();
    for (const a of list) await destroyQuietly(a.cloudinaryPublicId);
    await AttachmentModel.deleteMany({ workspaceId: wid, itemId: { $in: itemIds } });
  },

  /** Maintenance: expired orphans, and uploads signed but never confirmed. */
  async sweep(now = new Date()): Promise<{ orphans: number; pending: number }> {
    const expired = await AttachmentModel.find({
      orphanedAt: { $ne: null, $lt: new Date(now.getTime() - ORPHAN_GRACE_MS) },
    }).lean<AttachmentDoc[]>();
    for (const a of expired) await destroyQuietly(a.cloudinaryPublicId);
    await AttachmentModel.deleteMany({ _id: { $in: expired.map((a) => a._id) } });

    let pending = 0;
    const c = cloudinary();
    if (c.enabled) {
      const tagged = await c.listByTag(PENDING_TAG).catch(() => []);
      for (const r of tagged) {
        if (now.getTime() - Date.parse(r.created_at) < PENDING_GRACE_MS) continue;
        if (await AttachmentModel.exists({ cloudinaryPublicId: r.public_id })) continue;
        await destroyQuietly(r.public_id);
        pending++;
      }
    }
    return { orphans: expired.length, pending };
  },
};
