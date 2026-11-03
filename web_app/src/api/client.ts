import { ApiError, createApiClient, type ApiClient } from '@niwa/api-client';

/** Relative base → Vite proxy locally, Vercel rewrite in production (docs/OPS.md §6). */
export const api: ApiClient = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE ?? '/api/v1' });

/** Human-readable message for any thrown value. */
export function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return "Can't reach the NIWA server. Check your connection and try again.";
  return 'Something went wrong. Please try again.';
}
