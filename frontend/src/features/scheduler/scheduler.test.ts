import { describe, expect, it } from 'vitest';
import { addDaysToKey, allDayKeys, monthGridStart, startOfWeek, utcMidnight } from '../../lib/dates.ts';
import { layoutDay } from './layout.ts';

describe('layoutDay', () => {
  const seg = (key: string, start: number, end: number) => ({ key, value: key, start, end });

  it('puts non-overlapping entries in one column', () => {
    const out = layoutDay([seg('a', 60, 120), seg('b', 120, 180)]);
    expect(out.map((p) => [p.key, p.column, p.columns])).toEqual([
      ['a', 0, 1],
      ['b', 0, 1],
    ]);
  });

  it('splits a cluster into the fewest columns and reuses freed columns', () => {
    const out = layoutDay([seg('a', 540, 660), seg('b', 570, 600), seg('c', 600, 630), seg('d', 720, 780)]);
    const by = Object.fromEntries(out.map((p) => [p.key, [p.column, p.columns]]));
    expect(by.a).toEqual([0, 2]);
    expect(by.b).toEqual([1, 2]);
    expect(by.c).toEqual([1, 2]); // reuses b's column once b ends
    expect(by.d).toEqual([0, 1]); // new cluster
  });
});

describe('dates', () => {
  it('weeks start on Monday and month grids start on the Monday before the 1st', () => {
    expect(startOfWeek(new Date(2026, 10, 8)).getDay()).toBe(1); // Sun Nov 8 → Mon Nov 2
    expect(startOfWeek(new Date(2026, 10, 8)).getDate()).toBe(2);
    const grid = monthGridStart(new Date(2026, 10, 15)); // Nov 2026 starts on a Sunday
    expect([grid.getMonth(), grid.getDate(), grid.getDay()]).toEqual([9, 26, 1]);
  });

  it('all-day entries cover calendar dates with an exclusive end', () => {
    expect(allDayKeys(utcMidnight('2026-11-20'), utcMidnight('2026-11-22'))).toEqual([
      '2026-11-20',
      '2026-11-21',
    ]);
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
  });
});
