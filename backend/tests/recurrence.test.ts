import { describe, expect, it } from 'vitest';
import { occurrenceStart } from '../src/lib/recurrence.ts';
import { utcToWall, wallToUtc } from '../src/lib/tz.ts';

const iso = (d: Date) => d.toISOString();

describe('tz', () => {
  it('round-trips wall time in fixed and DST zones', () => {
    const w = { year: 2026, month: 7, day: 14, hour: 9, minute: 30, second: 0, ms: 0 };
    expect(iso(wallToUtc(w, 'Asia/Manila'))).toBe('2026-07-14T01:30:00.000Z'); // UTC+8
    expect(iso(wallToUtc(w, 'America/New_York'))).toBe('2026-07-14T13:30:00.000Z'); // EDT, UTC-4
    expect(utcToWall(new Date('2026-07-14T13:30:00Z'), 'America/New_York')).toMatchObject({
      hour: 9,
      minute: 30,
    });
  });

  it('resolves a wall time inside a spring-forward gap to after the gap', () => {
    // 2026-03-08 02:30 does not exist in New York.
    const d = wallToUtc(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0, ms: 0 },
      'America/New_York',
    );
    expect(utcToWall(d, 'America/New_York').hour).toBe(3);
  });
});

describe('occurrenceStart', () => {
  it('weekly stays at the same local time across DST', () => {
    const anchor = new Date('2026-03-03T14:00:00Z'); // Tue 09:00 EST
    const after = occurrenceStart(anchor, 'weekly', 2, 'America/New_York', false); // Tue Mar 17, EDT
    expect(iso(after)).toBe('2026-03-17T13:00:00.000Z');
    expect(utcToWall(after, 'America/New_York')).toMatchObject({ day: 17, hour: 9 });
  });

  it('daily crosses month and year boundaries', () => {
    const anchor = new Date('2026-12-30T08:00:00Z');
    expect(iso(occurrenceStart(anchor, 'daily', 3, 'UTC', false))).toBe('2027-01-02T08:00:00.000Z');
  });

  it('monthly clamps to month end without drifting', () => {
    const anchor = new Date('2026-01-31T10:00:00Z');
    const months = [0, 1, 2, 3].map((n) =>
      iso(occurrenceStart(anchor, 'monthly', n, 'UTC', false)).slice(0, 10),
    );
    expect(months).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
    expect(iso(occurrenceStart(anchor, 'monthly', 25, 'UTC', false)).slice(0, 10)).toBe('2028-02-29');
  });

  it('all-day series ignore the zone', () => {
    const anchor = new Date('2026-11-03T00:00:00Z');
    expect(iso(occurrenceStart(anchor, 'weekly', 1, 'Pacific/Auckland', true))).toBe(
      '2026-11-10T00:00:00.000Z',
    );
  });
});
