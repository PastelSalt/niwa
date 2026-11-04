/**
 * Friendly timestamps (NIWA-PLAN-B-02 V4): "4 Nov 2026", "2 h ago", "yesterday". The exact time belongs in a
 * tooltip or `<time dateTime>`; these are for reading at a glance.
 */

/** "4 Nov 2026" (year omitted when it's this year, unless `withYear`). */
export function friendlyDate(iso: string, now = new Date(), withYear = false): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(withYear || !sameYear ? { year: 'numeric' } : {}),
  });
}

/** "just now", "5 min ago", "2 h ago", "yesterday", then the date. */
export function timeAgo(iso: string, now = new Date()): string {
  const mins = Math.round((now.getTime() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const d = new Date(iso);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  )
    return 'yesterday';
  return friendlyDate(iso, now);
}

/** The full local date and time, for tooltips. */
export const exactTime = (iso: string) => new Date(iso).toLocaleString();
