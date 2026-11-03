import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

/** Signed Cloudinary uploads — specs §13, DATA_MODEL.md §8. */

export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Whether image uploads are available on this server (Cloudinary credentials present). */
export const UploadConfigResponse = z
  .object({ enabled: z.boolean(), maxBytes: z.number().int(), allowedMime: z.array(z.string()) })
  .meta({ id: 'UploadConfigResponse' });
export type UploadConfigResponse = z.infer<typeof UploadConfigResponse>;

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
    allowedFormats: z.string().meta({ description: 'Signed — send exactly as given' }),
    uploadUrl: z.url(),
  })
  .meta({ id: 'UploadSignatureResponse' });
export type UploadSignatureResponse = z.infer<typeof UploadSignatureResponse>;

export const ConfirmAttachmentInput = z
  .object({ itemId: Id, publicId: z.string().min(1).max(255) })
  .meta({ id: 'ConfirmAttachmentInput' });
export type ConfirmAttachmentInput = z.infer<typeof ConfirmAttachmentInput>;

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
