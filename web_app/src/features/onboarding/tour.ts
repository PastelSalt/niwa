/**
 * The first-run tour (NIWA-PLAN-B-01 B7). Each step points at real UI through a `data-tour` attribute;
 * when that element isn't on screen (e.g. the rail on phones) the step shows centred instead.
 * Bump TOUR_VERSION when the steps change enough to be worth showing again.
 */
export const TOUR_VERSION = 1;

export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** `data-tour` values to try in order; the first one on screen is highlighted. */
  targets: string[];
  /** Screen the step is about; the tour navigates there first. */
  path?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'capture',
    title: 'Capture first',
    body: 'Jot anything down with Capture (or press C). It waits in the Inbox until you decide where it belongs.',
    targets: ['capture'],
    path: '/knowledge',
  },
  {
    id: 'tree',
    title: 'One tree for everything',
    body: 'Notes, ideas, projects and tasks all live in this tree, nested as deep as you like. Drag to move things around.',
    targets: ['tree'],
    path: '/knowledge',
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    body: 'Write notes with headings and images, link them together, and revisit them in the review queue.',
    targets: ['nav-knowledge'],
  },
  {
    id: 'actionable',
    title: 'Actionable and Focus',
    body: 'The same tree as projects and tasks. Focus collects what is in progress, high priority, overdue or due soon.',
    targets: ['nav-actionable'],
  },
  {
    id: 'scheduler',
    title: 'Scheduler',
    body: 'Plan your month, week or day. Drag a task into a time block, or add events that repeat.',
    targets: ['nav-scheduler'],
  },
  {
    id: 'search',
    title: 'Search',
    body: 'One search across titles, tags and note text. Press / to jump here from anywhere.',
    targets: ['search'],
  },
  {
    id: 'settings',
    title: 'Make it yours',
    body: 'Settings has your theme, Trash, account options — and this tour, if you want to see it again.',
    targets: ['nav-settings', 'account'],
  },
];
