import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';
import { ItemSummary } from './item.ts';

export const LinkOrigin = z.enum(['content', 'manual']).meta({ id: 'LinkOrigin' });

export const Link = z
  .object({
    id: Id,
    sourceId: Id,
    targetId: Id,
    targetAnchorId: z.string().nullable(),
    label: z.string().nullable(),
    origin: LinkOrigin,
    createdAt: IsoDateTime,
  })
  .meta({ id: 'Link' });
export type Link = z.infer<typeof Link>;

/** Manual "related item" link. Content links are synced from the editor on save. */
export const CreateLinkInput = z
  .object({
    sourceId: Id,
    targetId: Id,
    targetAnchorId: z.string().min(1).max(64).nullable().optional(),
    label: z.string().trim().max(120).nullable().optional(),
  })
  .meta({ id: 'CreateLinkInput' });
export type CreateLinkInput = z.infer<typeof CreateLinkInput>;

export const LinkWithItem = z
  .object({ link: Link, item: ItemSummary })
  .meta({ id: 'LinkWithItem', description: '`item` is the other end of the link' });

export const ItemLinksResponse = z
  .object({ outgoing: z.array(LinkWithItem), backlinks: z.array(LinkWithItem) })
  .meta({ id: 'ItemLinksResponse' });
