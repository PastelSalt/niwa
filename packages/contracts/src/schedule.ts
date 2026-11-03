import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

/**
 * Scheduler contract — provisional until docs/SCHEDULER.md (M5.P1) is accepted.
 * Specs §4.3, §7, §12.2.
 */

export const ScheduleKind = z.enum(['event', 'block']).meta({ id: 'ScheduleKind' });
export const Recurrence = z.enum(['none', 'daily', 'weekly', 'monthly']).meta({ id: 'Recurrence' });
export const EditScope = z
  .enum(['instance', 'future'])
  .meta({ id: 'EditScope', description: '"this instance" or "this and future" — never silently "all"' });

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ScheduleEntry = z
  .object({
    id: Id,
    kind: ScheduleKind,
    itemId: Id.nullable(),
    title: z.string(),
    startAt: IsoDateTime,
    endAt: IsoDateTime,
    isAllDay: z.boolean(),
    color: z.string().nullable(),
    recurrence: Recurrence,
    seriesId: z.string().nullable(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
  })
  .meta({ id: 'ScheduleEntry' });
export type ScheduleEntry = z.infer<typeof ScheduleEntry>;

export const CreateScheduleEntryInput = z
  .object({
    kind: ScheduleKind,
    itemId: Id.nullable().optional().meta({ description: 'Required for `block`, forbidden for `event`' }),
    title: z
      .string()
      .trim()
      .min(1)
      .max(300)
      .optional()
      .meta({ description: 'Defaults to item title for blocks' }),
    startAt: IsoDateTime,
    endAt: IsoDateTime,
    isAllDay: z.boolean().default(false),
    color: HexColor.nullable().optional(),
    recurrence: Recurrence.default('none'),
  })
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  })
  .refine((v) => (v.kind === 'block' ? !!v.itemId : !v.itemId), {
    message: 'block needs itemId; event must not have one',
    path: ['itemId'],
  })
  .meta({ id: 'CreateScheduleEntryInput' });
export type CreateScheduleEntryInput = z.infer<typeof CreateScheduleEntryInput>;

export const UpdateScheduleEntryInput = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    startAt: IsoDateTime.optional(),
    endAt: IsoDateTime.optional(),
    isAllDay: z.boolean().optional(),
    color: HexColor.nullable().optional(),
    recurrence: Recurrence.optional(),
  })
  .meta({ id: 'UpdateScheduleEntryInput' });

export const ScheduleScopeQuery = z.object({ scope: EditScope.default('instance') });

export const ScheduleRangeQuery = z.object({ from: IsoDateTime, to: IsoDateTime });

export const ScheduleEntryResponse = z.object({ entry: ScheduleEntry }).meta({ id: 'ScheduleEntryResponse' });
export const ScheduleListResponse = z
  .object({ entries: z.array(ScheduleEntry) })
  .meta({ id: 'ScheduleListResponse' });
