import { describe, expect, it } from 'vitest';
import { repeatSummary } from './repeatSummary.ts';

describe('repeatSummary', () => {
  it('says the rule in words', () => {
    // 2027-03-11 is a Thursday.
    expect(repeatSummary('none', '2027-03-11', '10:00', false)).toBeNull();
    expect(repeatSummary('weekly', '2027-03-11', '10:00', false)).toMatch(/^Every Thursday at 10:00\sAM$/);
    expect(repeatSummary('daily', '2027-03-11', '09:30', true)).toBe('Every day, all day');
    expect(repeatSummary('monthly', '2027-03-01', '09:00', true)).toBe('Monthly on the 1st, all day');
    expect(repeatSummary('monthly', '2027-03-22', '09:00', true)).toBe('Monthly on the 22nd, all day');
    expect(repeatSummary('monthly', '2027-03-13', '09:00', true)).toBe('Monthly on the 13th, all day');
  });
});
