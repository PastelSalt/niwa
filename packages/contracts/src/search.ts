import { z } from 'zod';
import { ItemNature, ItemStatus, ItemSummary, ItemType } from './item.ts';

export const SearchQuery = z.object({
  q: z.string().trim().min(1).max(200),
  type: ItemType.optional(),
  nature: ItemNature.optional(),
  status: ItemStatus.optional(),
  tag: z.string().optional(),
  includeArchived: z.stringbool().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type SearchQuery = z.infer<typeof SearchQuery>;

export const SearchHit = z
  .object({
    item: ItemSummary,
    snippet: z.string().nullable().meta({ description: 'Up to ~160 chars around the first match' }),
    score: z.number(),
  })
  .meta({ id: 'SearchHit' });

export const SearchResponse = z.object({ hits: z.array(SearchHit) }).meta({ id: 'SearchResponse' });
