import { ApiError, type ApiClient } from '@niwa/api-client';
import { ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES, type Attachment } from '@niwa/contracts';

/**
 * Signed Cloudinary upload (DATA_MODEL.md §8): the server signs, the browser uploads the file
 * straight to Cloudinary, then the server verifies and records it. The API secret never reaches us.
 */

export class UploadError extends Error {}

export function checkImage(file: File): void {
  if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type)) {
    throw new UploadError('Only PNG, JPEG, WebP and GIF images can be added.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(`Images can be at most ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
  }
}

/** Cloudinary delivery URL with automatic format and quality. */
export function deliveryUrl(secureUrl: string): string {
  return secureUrl.includes('/upload/f_auto')
    ? secureUrl
    : secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

/** Default alt text from the file name ("bgp-path_selection.png" → "bgp path selection"). */
export function altFromName(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .slice(0, 120);
}

export async function uploadImage(
  api: ApiClient,
  itemId: string,
  file: File,
  fetchImpl: typeof fetch = fetch,
): Promise<{ attachment: Attachment; src: string }> {
  checkImage(file);
  const sig = await api.uploads.sign(itemId);
  const form = new FormData();
  form.set('file', file);
  form.set('api_key', sig.apiKey);
  form.set('timestamp', String(sig.timestamp));
  form.set('signature', sig.signature);
  form.set('folder', sig.folder);
  form.set('public_id', sig.publicId);
  form.set('tags', sig.tags);
  form.set('allowed_formats', sig.allowedFormats);

  const res = await fetchImpl(sig.uploadUrl, { method: 'POST', body: form });
  const body = (await res.json().catch(() => null)) as {
    public_id?: string;
    error?: { message?: string };
  } | null;
  if (!res.ok || !body?.public_id) {
    throw new UploadError(body?.error?.message ?? `Upload failed (HTTP ${res.status}).`);
  }
  try {
    const { attachment } = await api.uploads.confirm({ itemId, publicId: body.public_id });
    return { attachment, src: deliveryUrl(attachment.secureUrl) };
  } catch (err) {
    throw err instanceof ApiError ? new UploadError(err.message) : err;
  }
}
