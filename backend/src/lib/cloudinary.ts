import { createHash } from 'node:crypto';
import type { AppConfig } from '../config/env.ts';
import { AppError } from './errors.ts';

/**
 * Minimal Cloudinary client — signed uploads (browser uploads directly), resource lookup,
 * destroy and tag removal. The API secret never leaves the server (specs §13).
 * `fetch` is injectable so tests never touch the network.
 */

export interface CloudResource {
  public_id: string;
  format: string;
  bytes: number;
  secure_url: string;
  created_at: string;
  tags?: string[];
}

export interface CloudinaryClient {
  enabled: boolean;
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  /** Signature for a set of upload params (Cloudinary's SHA-1 scheme). */
  sign(params: Record<string, string | number>): string;
  getResource(publicId: string): Promise<CloudResource | null>;
  destroy(publicId: string): Promise<void>;
  removeTag(publicId: string, tag: string): Promise<void>;
  listByTag(tag: string): Promise<CloudResource[]>;
}

export const PENDING_TAG = 'niwa-pending';

export function signParams(params: Record<string, string | number>, secret: string): string {
  const base = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] !== undefined)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1')
    .update(base + secret)
    .digest('hex');
}

export function createCloudinary(config: AppConfig, fetchImpl: typeof fetch = fetch): CloudinaryClient {
  const cloudName = config.CLOUDINARY_CLOUD_NAME ?? '';
  const apiKey = config.CLOUDINARY_API_KEY ?? '';
  const secret = config.CLOUDINARY_API_SECRET ?? '';
  const enabled = !!(cloudName && apiKey && secret);
  const api = `https://api.cloudinary.com/v1_1/${cloudName}`;
  const basic = `Basic ${Buffer.from(`${apiKey}:${secret}`).toString('base64')}`;

  const ensure = () => {
    if (!enabled) throw new AppError('NOT_CONFIGURED', 'Image uploads are not configured on this server.');
  };

  const signedPost = async (path: string, params: Record<string, string | number>) => {
    ensure();
    const timestamp = Math.floor(Date.now() / 1000);
    const all = { ...params, timestamp };
    const body = new URLSearchParams({
      ...Object.fromEntries(Object.entries(all).map(([k, v]) => [k, String(v)])),
      api_key: apiKey,
      signature: signParams(all, secret),
    });
    const res = await fetchImpl(`${api}${path}`, { method: 'POST', body });
    if (!res.ok) throw new AppError('UPSTREAM_ERROR', `Cloudinary request failed (${res.status}).`);
    return res.json() as Promise<Record<string, unknown>>;
  };

  const encodePath = (publicId: string) => publicId.split('/').map(encodeURIComponent).join('/');

  return {
    enabled,
    cloudName,
    apiKey,
    uploadUrl: `${api}/image/upload`,

    sign(params) {
      ensure();
      return signParams(params, secret);
    },

    async getResource(publicId) {
      ensure();
      const res = await fetchImpl(`${api}/resources/image/upload/${encodePath(publicId)}`, {
        headers: { Authorization: basic },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new AppError('UPSTREAM_ERROR', `Cloudinary lookup failed (${res.status}).`);
      return (await res.json()) as CloudResource;
    },

    async destroy(publicId) {
      await signedPost('/image/destroy', { public_id: publicId, invalidate: 'true' });
    },

    async removeTag(publicId, tag) {
      await signedPost('/image/tags', { command: 'remove', tag, public_ids: publicId });
    },

    async listByTag(tag) {
      ensure();
      const res = await fetchImpl(`${api}/resources/image/tags/${encodeURIComponent(tag)}?max_results=100`, {
        headers: { Authorization: basic },
      });
      if (!res.ok) throw new AppError('UPSTREAM_ERROR', `Cloudinary listing failed (${res.status}).`);
      return ((await res.json()) as { resources?: CloudResource[] }).resources ?? [];
    },
  };
}

// One client per process, set by createApp (keeps the service modules free of wiring).
let current: CloudinaryClient | null = null;

export function setCloudinary(client: CloudinaryClient): void {
  current = client;
}

export function cloudinary(): CloudinaryClient {
  if (!current) throw new AppError('NOT_CONFIGURED', 'Image uploads are not configured on this server.');
  return current;
}
