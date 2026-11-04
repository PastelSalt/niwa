import type { Recurrence } from '@niwa/contracts';
import { formatTime, parseDay } from '../../lib/dates.ts';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/**
 * The repeat rule in words for the entry dialog (B-02 V5): "Every Thursday at 10:00 AM",
 * "Every day, all day", "Monthly on the 5th at 9:00 AM". `time` is `HH:mm`; null when not repeating.
 */
export function repeatSummary(
  recurrence: Recurrence,
  day: string,
  time: string,
  allDay: boolean,
): string | null {
  if (recurrence === 'none') return null;
  const date = parseDay(day);
  const [h, m] = time.split(':').map(Number) as [number, number];
  const when = allDay
    ? ', all day'
    : ` at ${formatTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m))}`;
  if (recurrence === 'daily') return `Every day${when}`;
  if (recurrence === 'weekly')
    return `Every ${date.toLocaleDateString(undefined, { weekday: 'long' })}${when}`;
  return `Monthly on the ${ordinal(date.getDate())}${when}`;
}
