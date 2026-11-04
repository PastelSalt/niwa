import AutoStoriesOutlined from '@mui/icons-material/AutoStoriesOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import type { ReactNode } from 'react';

/** The six destinations — specs §3, CONCEPT.md §1. */
export interface Destination {
  key: 'knowledge' | 'actionable' | 'scheduler' | 'inbox' | 'search' | 'settings';
  label: string;
  path: string;
  icon: ReactNode;
  /** Second key after `g` (CONCEPT.md §1.4). */
  shortcut?: string;
  /** Lenses over the tree show the tree pane. */
  showsTree: boolean;
  /** Shown in the phone BottomNavigation (Settings lives in the account menu). */
  inBottomNav: boolean;
  /**
   * The screen already names itself (tree header, page heading), so the top bar's title is for screen
   * readers only — one visible name per screen (B-02 V2).
   */
  namedOnScreen: boolean;
}

export const DESTINATIONS: readonly Destination[] = [
  {
    key: 'knowledge',
    label: 'Knowledge',
    path: '/knowledge',
    icon: <AutoStoriesOutlined />,
    shortcut: 'k',
    showsTree: true,
    inBottomNav: true,
    namedOnScreen: true,
  },
  {
    key: 'actionable',
    label: 'Actionable',
    path: '/actionable',
    icon: <TaskAltOutlined />,
    shortcut: 'a',
    showsTree: true,
    inBottomNav: true,
    namedOnScreen: true,
  },
  {
    key: 'scheduler',
    label: 'Scheduler',
    path: '/scheduler',
    icon: <CalendarMonthOutlined />,
    shortcut: 's',
    showsTree: false,
    inBottomNav: true,
    namedOnScreen: false,
  },
  {
    key: 'inbox',
    label: 'Inbox',
    path: '/inbox',
    icon: <InboxOutlined />,
    shortcut: 'i',
    showsTree: false,
    inBottomNav: true,
    namedOnScreen: true,
  },
  {
    key: 'search',
    label: 'Search',
    path: '/search',
    icon: <SearchOutlined />,
    showsTree: false,
    inBottomNav: true,
    namedOnScreen: false,
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: <SettingsOutlined />,
    showsTree: false,
    inBottomNav: false,
    namedOnScreen: false,
  },
];

export function destinationForPath(pathname: string): Destination | undefined {
  return DESTINATIONS.find((d) => pathname === d.path || pathname.startsWith(`${d.path}/`));
}
