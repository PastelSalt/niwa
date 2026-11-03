import { z } from 'zod';
import { Id, IsoDateTime } from './common.ts';

/** Scheduler contract — docs/SCHEDULER.md, specs §4.3, §7, §12.2. */

export const ScheduleKind = z.enum(['event', 'block']).meta({ id: 'ScheduleKind' });
export type ScheduleKind = z.infer<typeof ScheduleKind>;

export const Recurrence = z.enum(['none', 'daily', 'weekly', 'monthly']).meta({ id: 'Recurrence' });
export type Recurrence = z.infer<typeof Recurrence>;

export const EditScope = z
  .enum(['instance', 'future'])
  .meta({ id: 'EditScope', description: '"this instance" or "this and future" — never silently "all"' });
export type EditScope = z.infer<typeof EditScope>;

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** IANA zone used to step recurring occurrences in wall-clock time (SCHEDULER.md §2). */
export const TimeZone = z
  .string()
  .max(64)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, 'Unknown time zone')
  .meta({ id: 'TimeZone', example: 'Asia/Manila' });

export const ScheduleEntry = z
  .object({
    id: Id,
    kind: ScheduleKind,
    itemId: Id.nullable(),
    title: z.string().meta({ description: 'Empty for blocks that use the item title' }),
    startAt: IsoDateTime,
    endAt: IsoDateTime,
    isAllDay: z.boolean(),
    color: z.string().nullable(),
    recurrence: Recurrence,
    seriesId: z.string().nullable(),
    seriesIndex: z.number().int().nullable(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
  })
  .meta({ id: 'ScheduleEntry' });
export type ScheduleEntry = z.infer<typeof ScheduleEntry>;

const Title = z.string().trim().max(300);

export const CreateScheduleEntryInput = z
  .object({
    kind: ScheduleKind,
    itemId: Id.nullable().optional().meta({ description: 'Required for `block`, forbidden for `event`' }),
    title: Title.optional().meta({
      description: 'Required for events; optional for blocks (item title is shown)',
    }),
    startAt: IsoDateTime,
    endAt: IsoDateTime,
    isAllDay: z.boolean().default(false),
    color: HexColor.nullable().optional(),
    recurrence: Recurrence.default('none'),
    timeZone: TimeZone.default('UTC'),
  })
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), {
    message: 'End must be after start',
    path: ['endAt'],
  })
  .refine((v) => (v.kind === 'block' ? !!v.itemId : !v.itemId), {
    message: 'block needs itemId; event must not have one',
    path: ['itemId'],
  })
  .refine((v) => v.kind === 'block' || !!v.title, { message: 'Events need a title', path: ['title'] })
  .meta({ id: 'CreateScheduleEntryInput' });
export type CreateScheduleEntryInput = z.infer<typeof CreateScheduleEntryInput>;

export const UpdateScheduleEntryInput = z
  .object({
    title: Title.optional(),
    startAt: IsoDateTime.optional(),
    endAt: IsoDateTime.optional(),
    isAllDay: z.boolean().optional(),
    color: HexColor.nullable().optional(),
    recurrence: Recurrence.optional(),
    timeZone: TimeZone.optional(),
  })
  .meta({ id: 'UpdateScheduleEntryInput' });
export type UpdateScheduleEntryInput = z.infer<typeof UpdateScheduleEntryInput>;

export const ScheduleScopeQuery = z.object({ scope: EditScope.default('instance') });

export const ScheduleRangeQuery = z
  .object({ from: IsoDateTime, to: IsoDateTime })
  .refine((v) => new Date(v.to) > new Date(v.from), { message: '`to` must be after `from`', path: ['to'] })
  .refine((v) => new Date(v.to).getTime() - new Date(v.from).getTime() <= 62 * 86_400_000, {
    message: 'Range is limited to 62 days',
    path: ['to'],
  });

export const ScheduleEntryResponse = z.object({ entry: ScheduleEntry }).meta({ id: 'ScheduleEntryResponse' });
export const ScheduleListResponse = z
  .object({ entries: z.array(ScheduleEntry) })
  .meta({ id: 'ScheduleListResponse' });
export type ScheduleListResponse = z.infer<typeof ScheduleListResponse>;
