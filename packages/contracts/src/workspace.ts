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

/** Root containers created for every new workspace — specs §12.3. */
export const ROOT_CONTAINERS = ['Knowledge', 'Projects', 'College', 'Personal'] as const;
