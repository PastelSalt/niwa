import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

export const Workspace = z
  .object({
    id: Id,
    name: z.string(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
  })
  .meta({ id: 'Workspace' });
export type Workspace = z.infer<typeof Workspace>;

/**
 * The classic top-level folders (specs §12.3) — still the default for `POST /auth/register` (mobile, older
 * clients). Since NIWA-PLAN-B-01 B14 the web asks for `starter: 'simple'` and offers these in the welcome dialog.
 */
export const ROOT_CONTAINERS = ['Knowledge', 'Projects', 'College', 'Personal'] as const;

/** `starter: 'simple'` (B14): one folder, so a new garden isn't pre-divided. */
export const STARTER_FOLDERS = ['My garden'] as const;
