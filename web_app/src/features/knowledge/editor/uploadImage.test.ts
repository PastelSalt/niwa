import type { ApiClient } from '@niwa/api-client';
import { describe, expect, it, vi } from 'vitest';
import { altFromName, checkImage, deliveryUrl, uploadImage, UploadError } from './uploadImage.ts';

const sig = {
  cloudName: 'demo',
  apiKey: 'key123',
  timestamp: 1700000000,
  signature: 'abc',
  folder: 'niwa/local/w1',
  publicId: 'p1',
  tags: 'niwa-pending',
  allowedFormats: 'gif,jpeg,jpg,png,webp',
  uploadUrl: 'https://api.cloudinary.com/v1_1/demo/image/upload',
};

function fakeApi(confirm = vi.fn()) {
  return {
    uploads: { sign: vi.fn(async () => sig), confirm },
  } as unknown as ApiClient & { uploads: { confirm: typeof confirm } };
}

const png = (bytes = 10) =>
  new File([new Uint8Array(bytes)], 'bgp-path_selection.png', { type: 'image/png' });

describe('checks', () => {
  it('accepts allowed images and rejects others or oversized ones', () => {
    expect(() => checkImage(png())).not.toThrow();
    expect(() => checkImage(new File(['x'], 'a.svg', { type: 'image/svg+xml' }))).toThrow(UploadError);
    expect(() => checkImage(png(11 * 1024 * 1024))).toThrow(/10 MB/);
  });

  it('derives alt text and an optimised delivery URL', () => {
    expect(altFromName('bgp-path_selection.png')).toBe('bgp path selection');
    expect(deliveryUrl('https://res.cloudinary.com/demo/image/upload/v1/a.png')).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/a.png',
    );
  });
});

describe('uploadImage', () => {
  it('signs, uploads directly to Cloudinary with the signed fields, then confirms', async () => {
    const attachment = {
      id: 'a'.repeat(24),
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/x.png',
    };
    const api = fakeApi(vi.fn(async () => ({ attachment })));
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ public_id: 'niwa/local/w1/p1' }), { status: 200 }),
    );

    const res = await uploadImage(api, 'item1', png(), fetchImpl as unknown as typeof fetch);

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(sig.uploadUrl);
    const form = init!.body as FormData;
    expect(Object.fromEntries([...form.entries()].filter(([k]) => k !== 'file'))).toEqual({
      api_key: 'key123',
      timestamp: '1700000000',
      signature: 'abc',
      folder: 'niwa/local/w1',
      public_id: 'p1',
      tags: 'niwa-pending',
      allowed_formats: 'gif,jpeg,jpg,png,webp',
    });
    expect(form.get('file')).toBeInstanceOf(File);
    expect(api.uploads.confirm).toHaveBeenCalledWith({ itemId: 'item1', publicId: 'niwa/local/w1/p1' });
    expect(res.src).toContain('/upload/f_auto,q_auto/');
  });

  it("surfaces Cloudinary's error message", async () => {
    const api = fakeApi();
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ error: { message: 'Invalid image file' } }), { status: 400 }),
    );
    await expect(uploadImage(api, 'item1', png(), fetchImpl as unknown as typeof fetch)).rejects.toThrow(
      'Invalid image file',
    );
    expect(api.uploads.confirm).not.toHaveBeenCalled();
  });
});
