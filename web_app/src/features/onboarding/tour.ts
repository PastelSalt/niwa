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
    body: 'Jot anything down with Capture (or press C). It waits in the Inbox until you sort it into your garden.',
    targets: ['capture'],
    path: '/today',
  },
  {
    id: 'today',
    title: 'Today',
    body: "Your home: what's on today, the next few tasks, and what's waiting in the Inbox.",
    targets: ['nav-today'],
    path: '/today',
  },
  {
    id: 'tree',
    title: 'One garden for everything',
    body: 'Pages, ideas, projects and tasks all live in one tree, nested as deep as you like. Drag to move things around.',
    targets: ['tree'],
    path: '/garden',
  },
  {
    id: 'garden',
    title: 'Notes and tasks',
    body: 'Use All · Notes · Tasks above the tree to see just your writing or just your to-dos. Tasks also lists what to focus on.',
    targets: ['tree', 'nav-garden'],
  },
  {
    id: 'calendar',
    title: 'Calendar',
    body: 'Plan your month, week or day. Give a task some time, or add events that repeat. Pick your country in Settings to see public holidays.',
    targets: ['nav-calendar'],
  },
  {
    id: 'search',
    title: 'Find or create anything',
    body: 'Press Ctrl K (or /) to jump to any page, make something new, or search everything.',
    targets: ['search'],
  },
  {
    id: 'settings',
    title: 'Make it yours',
    body: 'Settings has your theme and font, holidays, Trash, account options — and this tour.',
    targets: ['nav-settings', 'account'],
  },
];
