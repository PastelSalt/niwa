import { describe, expect, it } from 'vitest';
import { friendlyDate, timeAgo } from './friendlyTime.ts';

const now = new Date(2026, 10, 4, 15, 0); // 4 Nov 2026, 15:00 local

describe('friendly timestamps', () => {
  it('reads at a glance', () => {
    expect(timeAgo(new Date(2026, 10, 4, 14, 59, 40).toISOString(), now)).toBe('just now');
    expect(timeAgo(new Date(2026, 10, 4, 14, 55).toISOString(), now)).toBe('5 min ago');
    expect(timeAgo(new Date(2026, 10, 4, 13, 0).toISOString(), now)).toBe('2 h ago');
    expect(timeAgo(new Date(2026, 10, 3, 9, 0).toISOString(), now)).toBe('yesterday');
    expect(timeAgo(new Date(2026, 9, 1, 9, 0).toISOString(), now)).toBe(
      friendlyDate(new Date(2026, 9, 1).toISOString(), now),
    );
  });

  it('shows the year only when it differs (or is asked for)', () => {
    expect(friendlyDate(new Date(2026, 10, 4).toISOString(), now)).not.toMatch(/2026/);
    expect(friendlyDate(new Date(2025, 10, 4).toISOString(), now)).toMatch(/2025/);
    expect(friendlyDate(new Date(2026, 10, 4).toISOString(), now, true)).toMatch(/2026/);
  });
});
