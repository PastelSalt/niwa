/**
 * Calendar date helpers for the scheduler (docs/SCHEDULER.md §2).
 * Timed entries: UTC instants shown in local time. All-day entries: UTC date boundaries shown as
 * calendar dates (never shifted by the viewer's zone). Weeks start on Monday.
 */

export const MINUTE = 60_000;
export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day key `YYYY-MM-DD`. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a `YYYY-MM-DD` key. */
export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function isDayKey(v: string | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(parseDay(v).getTime());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  return addDays(s, -((s.getDay() + 6) % 7)); // Monday
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** 6 full weeks covering the month of `d`, starting Monday. */
export function monthGridStart(d: Date): Date {
  return startOfWeek(startOfMonth(d));
}

/** Minutes since local midnight. */
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function atMinutes(day: Date, minutes: number): Date {
  const r = startOfDay(day);
  r.setMinutes(minutes);
  return r;
}

// ---- All-day (UTC calendar dates) ----

/** `YYYY-MM-DD` of a UTC instant — used for all-day entries. */
export function utcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function utcMidnight(key: string): string {
  return `${key}T00:00:00.000Z`;
}

/** Calendar days covered by an all-day entry (end is exclusive). */
export function allDayKeys(startAt: string, endAt: string): string[] {
  const out: string[] = [];
  let t = Date.parse(utcMidnight(utcDayKey(startAt)));
  const end = Date.parse(endAt);
  while (t < end && out.length < 366) {
    out.push(new Date(t).toISOString().slice(0, 10));
    t += DAY_MS;
  }
  return out;
}

export function addDaysToKey(key: string, n: number): string {
  return new Date(Date.parse(utcMidnight(key)) + n * DAY_MS).toISOString().slice(0, 10);
}

// ---- Form inputs ----

export function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputs(day: string, time: string): Date {
  const [h, m] = time.split(':').map(Number) as [number, number];
  return atMinutes(parseDay(day), h * 60 + m);
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

// ---- Formatting ----

export const formatTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function formatRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function weekdayNames(): string[] {
  const monday = new Date(2026, 10, 2); // a Monday
  return Array.from({ length: 7 }, (_, i) =>
    addDays(monday, i).toLocaleDateString(undefined, { weekday: 'short' }),
  );
}

/** Snap minutes to a step (default 15). */
export function snap(minutes: number, step = 15): number {
  return Math.round(minutes / step) * step;
}
