import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import LocalFloristOutlined from '@mui/icons-material/LocalFloristOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import WbSunnyOutlined from '@mui/icons-material/WbSunnyOutlined';
import type { ReactNode } from 'react';

/**
 * Where you can go (NIWA-PLAN-B-01 B9): four places in the nav — Today, Garden, Calendar, Inbox. Search is the
 * command box (Ctrl+K) with a full results page; Settings sits in the avatar menu and at the rail's foot.
 */
export interface Destination {
  key: 'today' | 'garden' | 'calendar' | 'inbox' | 'search' | 'settings';
  label: string;
  path: string;
  /** Other paths that belong to this place (Garden's Notes and Tasks filters). */
  aliases?: string[];
  icon: ReactNode;
  /** Second key after `g`. */
  shortcut?: string;
  /** Shows the tree pane beside the content. */
  showsTree: boolean;
  /** One of the four main places (rail and phone bottom nav). */
  inNav: boolean;
  /**
   * The screen already names itself (tree header, page heading), so the top bar's title is for screen
   * readers only — one visible name per screen (B-02 V2).
   */
  namedOnScreen: boolean;
}

export const DESTINATIONS: readonly Destination[] = [
  {
    key: 'today',
    label: 'Today',
    path: '/today',
    icon: <WbSunnyOutlined />,
    shortcut: 't',
    showsTree: false,
    inNav: true,
    namedOnScreen: true,
  },
  {
    key: 'garden',
    label: 'Garden',
    path: '/garden',
    aliases: ['/knowledge', '/actionable'],
    icon: <LocalFloristOutlined />,
    shortcut: 'g',
    showsTree: true,
    inNav: true,
    namedOnScreen: true,
  },
  {
    key: 'calendar',
    label: 'Calendar',
    path: '/scheduler',
    icon: <CalendarMonthOutlined />,
    shortcut: 'c',
    showsTree: false,
    inNav: true,
    namedOnScreen: false,
  },
  {
    key: 'inbox',
    label: 'Inbox',
    path: '/inbox',
    icon: <InboxOutlined />,
    shortcut: 'i',
    showsTree: false,
    inNav: true,
    namedOnScreen: true,
  },
  {
    key: 'search',
    label: 'Search',
    path: '/search',
    icon: <SearchOutlined />,
    shortcut: 's',
    showsTree: false,
    inNav: false,
    namedOnScreen: false,
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <SettingsOutlined />,
    showsTree: false,
    inNav: false,
    namedOnScreen: false,
  },
];

const under = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

export function destinationForPath(pathname: string): Destination | undefined {
  return DESTINATIONS.find((d) => [d.path, ...(d.aliases ?? [])].some((p) => under(pathname, p)));
}

/** Garden's filter for a path: All (`/garden`), Notes (`/knowledge`) or Tasks (`/actionable`). */
export type GardenFilter = 'all' | 'knowledge' | 'actionable';
export function gardenFilterFor(pathname: string): GardenFilter | null {
  if (under(pathname, '/knowledge')) return 'knowledge';
  if (under(pathname, '/actionable')) return 'actionable';
  if (under(pathname, '/garden')) return 'all';
  return null;
}

export const GARDEN_FILTERS: { key: GardenFilter; label: string; path: string }[] = [
  { key: 'all', label: 'All', path: '/garden' },
  { key: 'knowledge', label: 'Notes', path: '/knowledge' },
  { key: 'actionable', label: 'Tasks', path: '/actionable' },
];
