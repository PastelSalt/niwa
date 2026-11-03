import type { Recurrence, ScheduleKind } from '@niwa/contracts';
import { Schema, model, type Types } from 'mongoose';

/** One calendar row — an event or an item's time block (specs §12.2, SCHEDULER.md §1). */
export interface ScheduleEntryDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: ScheduleKind;
  itemId: Types.ObjectId | null;
  title: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  color: string | null;
  recurrence: Recurrence;
  seriesId: Types.ObjectId | null;
  seriesIndex: number | null;
  /** Edited as "this instance": later series changes leave it alone. */
  detached: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<ScheduleEntryDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    kind: { type: String, enum: ['event', 'block'], required: true },
    itemId: { type: Schema.Types.ObjectId, default: null, ref: 'Item' },
    title: { type: String, default: '', maxlength: 300 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    color: { type: String, default: null },
    recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    seriesId: { type: Schema.Types.ObjectId, default: null, ref: 'ScheduleSeries' },
    seriesIndex: { type: Number, default: null },
    detached: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

entrySchema.index({ workspaceId: 1, startAt: 1, endAt: 1 });
entrySchema.index({ workspaceId: 1, itemId: 1, startAt: 1 });
entrySchema.index(
  { seriesId: 1, seriesIndex: 1 },
  { unique: true, partialFilterExpression: { seriesId: { $type: 'objectId' } } },
);

export const ScheduleEntryModel = model<ScheduleEntryDoc>('ScheduleEntry', entrySchema, 'schedule_entries');

/** The rule behind recurring entries (SCHEDULER.md §3). */
export interface ScheduleSeriesDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  kind: ScheduleKind;
  itemId: Types.ObjectId | null;
  title: string;
  recurrence: Exclude<Recurrence, 'none'>;
  anchorAt: Date;
  durationMs: number;
  isAllDay: boolean;
  color: string | null;
  timeZone: string;
  /** Highest seriesIndex created so far (-1 = none). Never regenerate at or below this. */
  materializedThrough: number;
  /** Last valid index when the series was ended ("this and following"); null = open-ended. */
  untilIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const seriesSchema = new Schema<ScheduleSeriesDoc>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true, ref: 'Workspace' },
    kind: { type: String, enum: ['event', 'block'], required: true },
    itemId: { type: Schema.Types.ObjectId, default: null, ref: 'Item' },
    title: { type: String, default: '' },
    recurrence: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    anchorAt: { type: Date, required: true },
    durationMs: { type: Number, required: true },
    isAllDay: { type: Boolean, default: false },
    color: { type: String, default: null },
    timeZone: { type: String, default: 'UTC' },
    materializedThrough: { type: Number, default: -1 },
    untilIndex: { type: Number, default: null },
  },
  { timestamps: true, versionKey: false },
);

seriesSchema.index({ workspaceId: 1 });
seriesSchema.index({ workspaceId: 1, itemId: 1 });

export const ScheduleSeriesModel = model<ScheduleSeriesDoc>(
  'ScheduleSeries',
  seriesSchema,
  'schedule_series',
);
