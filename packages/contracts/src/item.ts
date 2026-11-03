import { z } from 'zod';
import { DateOnly, Id, IsoDateTime } from './common.ts';

export const ItemType = z.enum(['project', 'task', 'note', 'idea']).meta({ id: 'ItemType' });
export type ItemType = z.infer<typeof ItemType>;

export const ItemNature = z.enum(['knowledge', 'actionable']).meta({ id: 'ItemNature' });
export type ItemNature = z.infer<typeof ItemNature>;

export const ItemStatus = z
  .enum(['not_started', 'in_progress', 'blocked', 'completed'])
  .meta({ id: 'ItemStatus' });
export type ItemStatus = z.infer<typeof ItemStatus>;

export const ItemPriority = z
  .enum(['none', 'low', 'medium', 'high', 'critical'])
  .meta({ id: 'ItemPriority' });
export type ItemPriority = z.infer<typeof ItemPriority>;

/** `nature` is always derived from `type`, never accepted as input — specs §3.2. */
export function natureOf(type: ItemType): ItemNature {
  return type === 'project' || type === 'task' ? 'actionable' : 'knowledge';
}

// ---- Tags (DATA_MODEL.md §6) ----

export const TAG_MAX_LENGTH = 40;
export const TAGS_PER_ITEM = 20;
export const TAG_PATTERN = /^[\p{L}\p{N}_/-]+$/u;

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, '-').toLowerCase();
}

export function isValidTag(tag: string): boolean {
  return tag.length >= 1 && tag.length <= TAG_MAX_LENGTH && TAG_PATTERN.test(tag);
}

/** Accepts loose input, normalizes, then validates. */
export const TagInput = z.string().max(80).transform(normalizeTag).refine(isValidTag, 'Invalid tag');

export const TagList = z
  .array(TagInput)
  .max(TAGS_PER_ITEM)
  .transform((tags) => [...new Set(tags)]);

// ---- Content ----

/** ProseMirror JSON document (TipTap). Deeper structure is validated server-side. */
export const ProseMirrorDoc = z
  .looseObject({ type: z.literal('doc'), content: z.array(z.unknown()).optional() })
  .meta({ id: 'ProseMirrorDoc' });
export type ProseMirrorDoc = z.infer<typeof ProseMirrorDoc>;

export const CONTENT_MAX_BYTES = 1_000_000;

// ---- Item ----

export const Item = z
  .object({
    id: Id,
    workspaceId: Id,
    parentId: Id.nullable(),
    title: z.string(),
    content: ProseMirrorDoc.nullable(),
    type: ItemType,
    nature: ItemNature,
    status: ItemStatus,
    priority: ItemPriority,
    orderKey: z.string(),
    tags: z.array(z.string()),
    dueAt: DateOnly.nullable(),
    estimatedMinutes: z.number().int().nullable(),
    reviewAt: DateOnly.nullable(),
    sourceUrl: z.string().nullable(),
    inboxedAt: IsoDateTime.nullable(),
    suggestedParentId: Id.nullable().meta({ description: 'Inbox only: where capture suggested filing it' }),
    archivedAt: IsoDateTime.nullable(),
    deletedAt: IsoDateTime.nullable(),
    version: z.number().int(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
    completedAt: IsoDateTime.nullable(),
  })
  .meta({ id: 'Item' });
export type Item = z.infer<typeof Item>;

/** Lightweight shape for tree rows, Focus lists and search hits (no content body). */
export const ItemSummary = Item.omit({ content: true }).meta({ id: 'ItemSummary' });
export type ItemSummary = z.infer<typeof ItemSummary>;

const Title = z.string().trim().min(1).max(300);
const SourceUrl = z.url({ protocol: /^https?$/ }).max(2048);
const Estimate = z.number().int().min(1).max(10_000);

export const CreateItemInput = z
  .object({
    parentId: Id.nullable(),
    title: Title,
    type: ItemType.default('note'),
    content: ProseMirrorDoc.optional(),
    status: ItemStatus.optional(),
    priority: ItemPriority.optional(),
    tags: TagList.optional(),
    dueAt: DateOnly.nullable().optional(),
    estimatedMinutes: Estimate.nullable().optional(),
    reviewAt: DateOnly.nullable().optional(),
    sourceUrl: SourceUrl.nullable().optional(),
    afterId: Id.nullable().optional().meta({ description: 'Insert after this sibling; omitted = append' }),
  })
  .meta({ id: 'CreateItemInput' });
export type CreateItemInput = z.infer<typeof CreateItemInput>;

/** Partial update; `version` is required for optimistic concurrency. */
export const UpdateItemInput = z
  .object({
    version: z.number().int(),
    title: Title.optional(),
    type: ItemType.optional(),
    content: ProseMirrorDoc.nullable().optional(),
    status: ItemStatus.optional(),
    priority: ItemPriority.optional(),
    tags: TagList.optional(),
    dueAt: DateOnly.nullable().optional(),
    estimatedMinutes: Estimate.nullable().optional(),
    reviewAt: DateOnly.nullable().optional(),
    sourceUrl: SourceUrl.nullable().optional(),
  })
  .meta({ id: 'UpdateItemInput' });
export type UpdateItemInput = z.infer<typeof UpdateItemInput>;

/** Move/reorder. The server computes the new `orderKey` from neighbours — DATA_MODEL.md §4. */
export const MoveItemInput = z
  .object({
    version: z.number().int(),
    parentId: Id.nullable(),
    beforeId: Id.nullable().optional(),
    afterId: Id.nullable().optional(),
  })
  .meta({ id: 'MoveItemInput' });
export type MoveItemInput = z.infer<typeof MoveItemInput>;

export const VersionInput = z.object({ version: z.number().int() }).meta({ id: 'VersionInput' });

export const ListItemsQuery = z.object({
  parentId: z
    .union([Id, z.literal('root')])
    .optional()
    .meta({ description: '`root` = top-level items' }),
  nature: ItemNature.optional(),
  type: ItemType.optional(),
  status: ItemStatus.optional(),
  tag: z.string().optional(),
  includeArchived: z.stringbool().optional(),
});
export type ListItemsQuery = z.infer<typeof ListItemsQuery>;

export const ItemResponse = z.object({ item: Item }).meta({ id: 'ItemResponse' });
export const ItemListResponse = z.object({ items: z.array(ItemSummary) }).meta({ id: 'ItemListResponse' });

/**
 * The whole filed tree in one call (single-user workspace — CONCEPT.md §2). Excludes deleted and
 * inboxed items; archived ones only with `includeArchived`. Clients build the hierarchy from parentId.
 */
export const TreeQuery = z.object({ includeArchived: z.stringbool().optional() });

/** `restoredTo: 'inbox'` when the original parent no longer exists (DATA_MODEL.md §5). */
export const RestoreResponse = z
  .object({ item: Item, restoredTo: z.enum(['original', 'inbox']), restoredCount: z.number().int() })
  .meta({ id: 'RestoreResponse' });
export type RestoreResponse = z.infer<typeof RestoreResponse>;

export const DeleteResponse = z
  .object({ ok: z.literal(true), affected: z.number().int() })
  .meta({ id: 'DeleteResponse', description: 'Number of items (item + descendants) affected' });
export type DeleteResponse = z.infer<typeof DeleteResponse>;

/** Focus sections for the Actionable base — specs §4.2. */
export const FocusResponse = z
  .object({
    inProgress: z.array(ItemSummary),
    highPriority: z.array(ItemSummary),
    overdue: z.array(ItemSummary),
    upcoming: z.array(ItemSummary),
    recentlyUpdated: z.array(ItemSummary),
  })
  .meta({ id: 'FocusResponse' });
export type FocusResponse = z.infer<typeof FocusResponse>;

export const FocusQuery = z.object({
  today: DateOnly.meta({ description: "Client's local calendar day; drives overdue/upcoming" }),
  upcomingDays: z.coerce.number().int().min(1).max(60).default(7),
});

// ---- Inbox (specs §12.8, CONCEPT.md §3) ----

export const CaptureInput = z
  .object({
    title: Title,
    type: ItemType.default('idea'),
    content: ProseMirrorDoc.optional(),
    suggestedParentId: Id.nullable().optional(),
  })
  .meta({ id: 'CaptureInput' });
export type CaptureInput = z.infer<typeof CaptureInput>;

export const FileItemInput = z
  .object({
    version: z.number().int(),
    parentId: Id,
    type: ItemType.optional(),
    dueAt: DateOnly.nullable().optional(),
    tags: TagList.optional(),
  })
  .meta({ id: 'FileItemInput' });
export type FileItemInput = z.infer<typeof FileItemInput>;

// ---- Heading promotion (CONCEPT.md §4) ----

export const PromoteSectionInput = z
  .object({ version: z.number().int(), anchorId: z.string().min(1).max(64) })
  .meta({ id: 'PromoteSectionInput' });

export const PromoteSectionResponse = z
  .object({ parent: Item, child: Item })
  .meta({ id: 'PromoteSectionResponse' });

// ---- Review, tags ----

export const ReviewQuery = z.object({ today: DateOnly });

export const TagCount = z.object({ tag: z.string(), count: z.number().int() }).meta({ id: 'TagCount' });
export const TagListResponse = z.object({ tags: z.array(TagCount) }).meta({ id: 'TagListResponse' });

export const RenameTagInput = z.object({ from: TagInput, to: TagInput }).meta({ id: 'RenameTagInput' });
export const RenameTagResponse = z.object({ updated: z.number().int() }).meta({ id: 'RenameTagResponse' });
