import type { Types } from 'mongoose';
import {
  ScheduleEntryModel,
  ScheduleSeriesModel,
  type ScheduleEntryDoc,
  type ScheduleSeriesDoc,
} from '../models/schedule.model.ts';

type Wid = Types.ObjectId;
type Oid = Types.ObjectId | string;

export type NewEntry = Omit<ScheduleEntryDoc, '_id' | 'createdAt' | 'updatedAt'>;

export const scheduleRepo = {
  findEntry(wid: Wid, id: Oid): Promise<ScheduleEntryDoc | null> {
    return ScheduleEntryModel.findOne({ _id: id, workspaceId: wid }).lean<ScheduleEntryDoc>().exec();
  },

  findOccurrence(seriesId: Types.ObjectId, index: number): Promise<ScheduleEntryDoc | null> {
    return ScheduleEntryModel.findOne({ seriesId, seriesIndex: index }).lean<ScheduleEntryDoc>().exec();
  },

  async createEntry(data: NewEntry): Promise<ScheduleEntryDoc> {
    return (await ScheduleEntryModel.create(data)).toObject<ScheduleEntryDoc>();
  },

  /** Insert occurrences; duplicates (a concurrent materialization) are ignored. */
  async insertOccurrences(rows: NewEntry[]): Promise<void> {
    if (!rows.length) return;
    await ScheduleEntryModel.insertMany(rows, { ordered: false }).catch((err: { code?: number }) => {
      if (err.code !== 11000) throw err;
    });
  },

  updateEntry(wid: Wid, id: Oid, set: Partial<ScheduleEntryDoc>): Promise<ScheduleEntryDoc | null> {
    return ScheduleEntryModel.findOneAndUpdate(
      { _id: id, workspaceId: wid },
      { $set: set },
      { returnDocument: 'after' },
    )
      .lean<ScheduleEntryDoc>()
      .exec();
  },

  async deleteEntry(wid: Wid, id: Oid): Promise<void> {
    await ScheduleEntryModel.deleteOne({ _id: id, workspaceId: wid }).exec();
  },

  /** Entries overlapping [from, to). */
  overlapping(wid: Wid, from: Date, to: Date): Promise<ScheduleEntryDoc[]> {
    return ScheduleEntryModel.find({ workspaceId: wid, startAt: { $lt: to }, endAt: { $gt: from } })
      .sort({ startAt: 1, endAt: -1 })
      .lean<ScheduleEntryDoc[]>()
      .exec();
  },

  upcomingForItem(wid: Wid, itemId: Oid, after: Date, limit: number): Promise<ScheduleEntryDoc[]> {
    return ScheduleEntryModel.find({ workspaceId: wid, itemId, endAt: { $gt: after } })
      .sort({ startAt: 1 })
      .limit(limit)
      .lean<ScheduleEntryDoc[]>()
      .exec();
  },

  findSeries(wid: Wid, id: Oid): Promise<ScheduleSeriesDoc | null> {
    return ScheduleSeriesModel.findOne({ _id: id, workspaceId: wid }).lean<ScheduleSeriesDoc>().exec();
  },

  /** Series that may still need occurrences (not ended before what's already materialized). */
  openSeries(wid: Wid, filter: Record<string, unknown> = {}): Promise<ScheduleSeriesDoc[]> {
    return ScheduleSeriesModel.find({
      workspaceId: wid,
      ...filter,
      $or: [{ untilIndex: null }, { $expr: { $lt: ['$materializedThrough', '$untilIndex'] } }],
    })
      .lean<ScheduleSeriesDoc[]>()
      .exec();
  },

  async createSeries(
    data: Omit<ScheduleSeriesDoc, '_id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ScheduleSeriesDoc> {
    return (await ScheduleSeriesModel.create(data)).toObject<ScheduleSeriesDoc>();
  },

  async markMaterialized(id: Types.ObjectId, through: number): Promise<void> {
    await ScheduleSeriesModel.updateOne({ _id: id }, { $max: { materializedThrough: through } }).exec();
  },

  /** End a series before index `n` and remove its occurrences from `n` on. */
  async endSeriesBefore(wid: Wid, series: ScheduleSeriesDoc, n: number): Promise<void> {
    await ScheduleEntryModel.deleteMany({
      workspaceId: wid,
      seriesId: series._id,
      seriesIndex: { $gte: n },
    }).exec();
    if (n <= 0) {
      await ScheduleSeriesModel.deleteOne({ _id: series._id }).exec();
    } else {
      await ScheduleSeriesModel.updateOne({ _id: series._id }, { $set: { untilIndex: n - 1 } }).exec();
    }
  },

  async deleteForItems(wid: Wid, itemIds: Types.ObjectId[]): Promise<void> {
    await ScheduleEntryModel.deleteMany({ workspaceId: wid, itemId: { $in: itemIds } }).exec();
    await ScheduleSeriesModel.deleteMany({ workspaceId: wid, itemId: { $in: itemIds } }).exec();
  },
};
