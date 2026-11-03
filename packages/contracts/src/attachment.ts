import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

/** Signed Cloudinary uploads — specs §13, DATA_MODEL.md §8. */

export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const UploadSignatureRequest = z.object({ itemId: Id }).meta({ id: 'UploadSignatureRequest' });

export const UploadSignatureResponse = z
  .object({
    cloudName: z.string(),
    apiKey: z.string().meta({ description: 'Public Cloudinary API key (not the secret)' }),
    timestamp: z.number().int(),
    signature: z.string(),
    folder: z.string(),
    publicId: z.string(),
    tags: z.string(),
    uploadUrl: z.url(),
  })
  .meta({ id: 'UploadSignatureResponse' });

export const ConfirmAttachmentInput = z
  .object({ itemId: Id, publicId: z.string().min(1).max(255) })
  .meta({ id: 'ConfirmAttachmentInput' });

export const Attachment = z
  .object({
    id: Id,
    itemId: Id,
    cloudinaryPublicId: z.string(),
    secureUrl: z.url(),
    mime: z.enum(ALLOWED_IMAGE_MIME),
    size: z.number().int(),
    createdAt: IsoDateTime,
  })
  .meta({ id: 'Attachment' });
export type Attachment = z.infer<typeof Attachment>;

export const AttachmentResponse = z.object({ attachment: Attachment }).meta({ id: 'AttachmentResponse' });
