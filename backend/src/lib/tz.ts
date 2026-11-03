/**
 * Minimal IANA time-zone math on top of Intl (no date library).
 * Used to step recurring occurrences in wall-clock time — SCHEDULER.md §2–3.
 */

export interface Wall {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  ms: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(tz, f);
  }
  return f;
}

/** Wall-clock fields of an instant in `tz`. */
export function utcToWall(date: Date, tz: string): Wall {
  const parts = Object.fromEntries(
    formatter(tz)
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    ms: date.getUTCMilliseconds(),
  };
}

const wallAsUtcMs = (w: Wall) => Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second, w.ms);

/** Offset of `tz` from UTC at `date`, in ms (e.g. +8h for Asia/Manila). */
function offsetMs(date: Date, tz: string): number {
  return wallAsUtcMs(utcToWall(date, tz)) - date.getTime();
}

/**
 * The instant at which `tz`'s clock shows `wall`. A wall time skipped by a DST jump resolves to
 * just after the gap; a repeated hour resolves to one of its two instants.
 */
export function wallToUtc(wall: Wall, tz: string): Date {
  const guess = wallAsUtcMs(wall);
  const o1 = offsetMs(new Date(guess), tz);
  let t = guess - o1;
  const o2 = offsetMs(new Date(t), tz);
  if (o2 !== o1) {
    const t2 = guess - o2;
    // t2 is right if it maps back to the same wall time; otherwise we're inside a DST gap.
    t = wallAsUtcMs(utcToWall(new Date(t2), tz)) === guess ? t2 : Math.max(t, t2);
  }
  return new Date(t);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
