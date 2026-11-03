import type {
  CreateScheduleEntryInput,
  EditScope,
  Recurrence,
  ScheduleEntry,
  UpdateScheduleEntryInput,
} from '@niwa/contracts';
import type { Types } from 'mongoose';
import { AppError, notFound } from '../lib/errors.ts';
import { occurrenceStart } from '../lib/recurrence.ts';
import type { ScheduleEntryDoc, ScheduleSeriesDoc } from '../models/schedule.model.ts';
import { itemRepo, toObjectId } from '../repositories/item.repo.ts';
import { scheduleRepo, type NewEntry } from '../repositories/schedule.repo.ts';

/** Scheduler rules — docs/SCHEDULER.md. */

const DAY = 86_400_000;
const INITIAL_HORIZON_MS = 56 * DAY; // materialize ~8 weeks on create
const MAX_HORIZON_MS = 730 * DAY; // never more than 2 years past now
const MAX_PER_REQUEST = 500;
const UPCOMING_LIMIT = 50;

export function toEntry(e: ScheduleEntryDoc): ScheduleEntry {
  return {
    id: e._id.toString(),
    kind: e.kind,
    itemId: e.itemId ? e.itemId.toString() : null,
    title: e.title,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    isAllDay: e.isAllDay,
    color: e.color,
    recurrence: e.recurrence,
    seriesId: e.seriesId ? e.seriesId.toString() : null,
    seriesIndex: e.seriesIndex,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

interface Fields {
  title: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  color: string | null;
  recurrence: Recurrence;
  timeZone: string;
}

/** All-day entries are stored on UTC date boundaries (SCHEDULER.md §2). */
function normalise(f: Fields): Fields {
  if (!f.isAllDay) {
    if (f.endAt <= f.startAt)
      throw new AppError('VALIDATION_ERROR', 'End must be after start.', { field: 'endAt' });
    return f;
  }
  const start = new Date(
    Date.UTC(f.startAt.getUTCFullYear(), f.startAt.getUTCMonth(), f.startAt.getUTCDate()),
  );
  let end = new Date(Date.UTC(f.endAt.getUTCFullYear(), f.endAt.getUTCMonth(), f.endAt.getUTCDate()));
  if (end < f.endAt) end = new Date(end.getTime() + DAY); // a partial last day counts as a whole day
  if (end <= start) end = new Date(start.getTime() + DAY);
  return { ...f, startAt: start, endAt: end };
}

function occurrenceRow(s: ScheduleSeriesDoc, n: number): NewEntry {
  const startAt = occurrenceStart(s.anchorAt, s.recurrence, n, s.timeZone, s.isAllDay);
  return {
    workspaceId: s.workspaceId,
    kind: s.kind,
    itemId: s.itemId,
    title: s.title,
    startAt,
    endAt: new Date(startAt.getTime() + s.durationMs),
    isAllDay: s.isAllDay,
    color: s.color,
    recurrence: s.recurrence,
    seriesId: s._id,
    seriesIndex: n,
    detached: false,
  };
}

/** Create occurrences until one starts at/after `until` (bounded). Idempotent per index. */
async function materialize(s: ScheduleSeriesDoc, until: Date): Promise<void> {
  const cap = new Date(Math.min(until.getTime(), Date.now() + MAX_HORIZON_MS));
  const rows: NewEntry[] = [];
  let n = s.materializedThrough + 1;
  while (rows.length < MAX_PER_REQUEST && (s.untilIndex === null || n <= s.untilIndex)) {
    const row = occurrenceRow(s, n);
    if (row.startAt >= cap && n > 0) break;
    rows.push(row);
    n++;
  }
  if (!rows.length) return;
  await scheduleRepo.insertOccurrences(rows);
  await scheduleRepo.markMaterialized(s._id, rows.at(-1)!.seriesIndex!);
}

async function createSeriesFrom(
  wid: Types.ObjectId,
  base: { kind: ScheduleEntryDoc['kind']; itemId: Types.ObjectId | null },
  f: Fields,
): Promise<ScheduleEntryDoc> {
  const series = await scheduleRepo.createSeries({
    workspaceId: wid,
    kind: base.kind,
    itemId: base.itemId,
    title: f.title,
    recurrence: f.recurrence as Exclude<Recurrence, 'none'>,
    anchorAt: f.startAt,
    durationMs: f.endAt.getTime() - f.startAt.getTime(),
    isAllDay: f.isAllDay,
    color: f.color,
    timeZone: f.timeZone,
    materializedThrough: -1,
    untilIndex: null,
  });
  await materialize(series, new Date(Math.max(Date.now(), f.startAt.getTime()) + INITIAL_HORIZON_MS));
  return (await scheduleRepo.findOccurrence(series._id, 0))!;
}

function createSingle(
  wid: Types.ObjectId,
  base: { kind: ScheduleEntryDoc['kind']; itemId: Types.ObjectId | null },
  f: Fields,
) {
  return scheduleRepo.createEntry({
    workspaceId: wid,
    kind: base.kind,
    itemId: base.itemId,
    title: f.title,
    startAt: f.startAt,
    endAt: f.endAt,
    isAllDay: f.isAllDay,
    color: f.color,
    recurrence: 'none',
    seriesId: null,
    seriesIndex: null,
    detached: false,
  });
}

function merged(
  e: ScheduleEntryDoc,
  input: UpdateScheduleEntryInput,
  series: ScheduleSeriesDoc | null,
): Fields {
  return normalise({
    title: input.title ?? e.title,
    startAt: input.startAt ? new Date(input.startAt) : e.startAt,
    endAt: input.endAt ? new Date(input.endAt) : e.endAt,
    isAllDay: input.isAllDay ?? e.isAllDay,
    color: input.color === undefined ? e.color : input.color,
    recurrence: input.recurrence ?? e.recurrence,
    timeZone: input.timeZone ?? series?.timeZone ?? 'UTC',
  });
}

/** Hide blocks whose item is deleted (or no longer exists). */
async function visible(wid: Types.ObjectId, entries: ScheduleEntryDoc[]): Promise<ScheduleEntryDoc[]> {
  const itemIds = [...new Set(entries.filter((e) => e.itemId).map((e) => e.itemId!.toString()))];
  if (!itemIds.length) return entries;
  const alive = new Set(
    (await itemRepo.list(wid, { _id: { $in: itemIds } }, { includeInbox: true, includeArchived: true })).map(
      (i) => i._id.toString(),
    ),
  );
  return entries.filter((e) => !e.itemId || alive.has(e.itemId.toString()));
}

export const scheduleService = {
  async range(workspaceId: string, from: string, to: string): Promise<ScheduleEntry[]> {
    const wid = toObjectId(workspaceId);
    const until = new Date(to);
    for (const s of await scheduleRepo.openSeries(wid)) await materialize(s, until);
    const entries = await scheduleRepo.overlapping(wid, new Date(from), until);
    return (await visible(wid, entries)).map(toEntry);
  },

  async forItem(workspaceId: string, itemId: string): Promise<ScheduleEntry[]> {
    const wid = toObjectId(workspaceId);
    if (!(await itemRepo.findById(wid, itemId))) throw notFound('Item');
    for (const s of await scheduleRepo.openSeries(wid, { itemId: toObjectId(itemId) })) {
      await materialize(s, new Date(Date.now() + INITIAL_HORIZON_MS));
    }
    return (await scheduleRepo.upcomingForItem(wid, itemId, new Date(), UPCOMING_LIMIT)).map(toEntry);
  },

  async create(workspaceId: string, input: CreateScheduleEntryInput): Promise<ScheduleEntry> {
    const wid = toObjectId(workspaceId);
    let itemId: Types.ObjectId | null = null;
    if (input.kind === 'block') {
      const item = await itemRepo.findById(wid, input.itemId!);
      if (!item) throw new AppError('VALIDATION_ERROR', 'Item not found.', { field: 'itemId' });
      itemId = item._id;
    }
    const f = normalise({
      title: input.title ?? '',
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      isAllDay: input.isAllDay,
      color: input.color ?? null,
      recurrence: input.recurrence,
      timeZone: input.timeZone,
    });
    const base = { kind: input.kind, itemId };
    return toEntry(
      f.recurrence === 'none' ? await createSingle(wid, base, f) : await createSeriesFrom(wid, base, f),
    );
  },

  async update(
    workspaceId: string,
    id: string,
    input: UpdateScheduleEntryInput,
    scope: EditScope,
  ): Promise<ScheduleEntry> {
    const wid = toObjectId(workspaceId);
    const e = await scheduleRepo.findEntry(wid, id);
    if (!e) throw notFound('Entry');
    const series = e.seriesId ? await scheduleRepo.findSeries(wid, e.seriesId) : null;
    const f = merged(e, input, series);
    if (e.kind === 'event' && !f.title)
      throw new AppError('VALIDATION_ERROR', 'Events need a title.', { field: 'title' });
    const base = { kind: e.kind, itemId: e.itemId };

    // One-off entry: plain update, or turn it into a series.
    if (!series) {
      if (f.recurrence !== 'none') {
        await scheduleRepo.deleteEntry(wid, e._id);
        return toEntry(await createSeriesFrom(wid, base, f));
      }
      const { timeZone: _tz, recurrence: _r, ...set } = f;
      return toEntry((await scheduleRepo.updateEntry(wid, e._id, set))!);
    }

    if (scope === 'instance') {
      const { timeZone: _tz, recurrence: _r, ...set } = f;
      return toEntry((await scheduleRepo.updateEntry(wid, e._id, { ...set, detached: true }))!);
    }

    // "This and following": end the old series here and start a new one from the edited occurrence.
    await scheduleRepo.endSeriesBefore(wid, series, e.seriesIndex ?? 0);
    return toEntry(
      f.recurrence === 'none' ? await createSingle(wid, base, f) : await createSeriesFrom(wid, base, f),
    );
  },

  async remove(workspaceId: string, id: string, scope: EditScope): Promise<void> {
    const wid = toObjectId(workspaceId);
    const e = await scheduleRepo.findEntry(wid, id);
    if (!e) throw notFound('Entry');
    const series = e.seriesId ? await scheduleRepo.findSeries(wid, e.seriesId) : null;
    if (series && scope === 'future') {
      await scheduleRepo.endSeriesBefore(wid, series, e.seriesIndex ?? 0);
    } else {
      await scheduleRepo.deleteEntry(wid, e._id); // never regenerated: materializedThrough is past it
    }
  },

  /** Permanent item delete → its blocks and series go too (SCHEDULER.md §7). */
  purgeForItems(wid: Types.ObjectId, itemIds: Types.ObjectId[]) {
    return scheduleRepo.deleteForItems(wid, itemIds);
  },
};
