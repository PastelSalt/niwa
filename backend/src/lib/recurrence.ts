import type { Recurrence } from '@niwa/contracts';
import { daysInMonth, utcToWall, wallToUtc } from './tz.ts';

/**
 * Start of occurrence `n` of a series — SCHEDULER.md §3. Always computed from the anchor (never
 * chained), so monthly clamping (Jan 31 → Feb 28 → Mar 31) never drifts. All-day series use UTC.
 */
export function occurrenceStart(
  anchor: Date,
  rule: Exclude<Recurrence, 'none'>,
  n: number,
  timeZone: string,
  isAllDay: boolean,
): Date {
  const tz = isAllDay ? 'UTC' : timeZone;
  const w = utcToWall(anchor, tz);

  if (rule === 'monthly') {
    const monthIndex = w.month - 1 + n;
    const year = w.year + Math.floor(monthIndex / 12);
    const month = (((monthIndex % 12) + 12) % 12) + 1;
    return wallToUtc({ ...w, year, month, day: Math.min(w.day, daysInMonth(year, month)) }, tz);
  }

  const step = rule === 'daily' ? 1 : 7;
  // Let Date.UTC normalise day overflow into the right month/year.
  const d = new Date(Date.UTC(w.year, w.month - 1, w.day + step * n));
  return wallToUtc({ ...w, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }, tz);
}
