import type { FocusResponse, ItemSummary } from '@niwa/contracts';

/**
 * Focus sections in order of urgency (NIWA-PLAN-B-02 decision): a task shows once, in the first section that
 * holds it; its other facts (priority, due date, status) become chips on the row.
 */
export const FOCUS_SECTIONS: { key: keyof FocusResponse; title: string; empty: string }[] = [
  { key: 'overdue', title: 'Overdue', empty: 'Nothing overdue.' },
  { key: 'inProgress', title: 'In progress', empty: 'Nothing in progress.' },
  { key: 'highPriority', title: 'High priority', empty: 'No high-priority work open.' },
  { key: 'upcoming', title: 'Upcoming (7 days)', empty: 'Nothing due this week.' },
  { key: 'recentlyUpdated', title: 'Recently updated', empty: 'No recent changes.' },
];

export function dedupeFocus(data: FocusResponse): FocusResponse {
  const seen = new Set<string>();
  const out = {} as FocusResponse;
  for (const { key } of FOCUS_SECTIONS) {
    out[key] = data[key].filter((i: ItemSummary) => !seen.has(i.id) && seen.add(i.id));
  }
  return out;
}
