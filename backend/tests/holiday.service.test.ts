import { describe, expect, it } from 'vitest';
import { holidayService } from '../src/services/holiday.service.ts';

const none = { country: null, region: null, observances: false };

describe('holidayService (B-01 B8)', () => {
  it('gives real public holidays for the Philippines, date-only', () => {
    const ph = holidayService.range({ ...none, country: 'PH' }, '2026-06-01', '2026-12-31');
    const byName = Object.fromEntries(ph.map((h) => [h.name, h.date]));
    expect(byName['Independence Day']).toBe('2026-06-12');
    expect(byName['Rizal Day']).toBe('2026-12-30');
    expect(ph.every((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.date))).toBe(true);
  });

  it('spans a year boundary and filters observances unless asked', () => {
    const us = { ...none, country: 'US' };
    const span = holidayService.range(us, '2026-12-20', '2027-01-05');
    expect(span.map((h) => h.date)).toEqual(expect.arrayContaining(['2026-12-25', '2027-01-01']));
    const feb = holidayService.range(us, '2026-02-01', '2026-02-28');
    expect(feb.some((h) => h.type === 'observance')).toBe(false);
    const withObs = holidayService.range({ ...us, observances: true }, '2026-02-01', '2026-02-28');
    expect(withObs.some((h) => h.type === 'observance')).toBe(true);
  });

  it('knows regions and rejects unknown places', () => {
    expect(holidayService.regions('US').some((r) => r.code === 'CA')).toBe(true);
    expect(() => holidayService.validate({ country: 'XX', region: null })).toThrow(/Unknown country/);
    expect(() => holidayService.validate({ country: 'US', region: 'ZZ' })).toThrow(/Unknown region/);
    expect(() => holidayService.validate({ country: null, region: 'CA' })).toThrow(/country/);
    expect(() => holidayService.validate({ country: 'US', region: 'CA' })).not.toThrow();
  });

  it('returns nothing without a country', () => {
    expect(holidayService.range(none, '2026-01-01', '2026-12-31')).toEqual([]);
  });
});
