import { Navigate, type RouteObject } from 'react-router';
import { GuestOnly, RequireAuth } from '../auth/guards.tsx';
import { LoginPage } from '../auth/LoginPage.tsx';
import { RegisterPage } from '../auth/RegisterPage.tsx';
import { NotFoundPage } from '../components/NotFoundPage.tsx';
import {
  ActionablePage,
  InboxPage,
  KnowledgePage,
  SchedulerPage,
  SearchPage,
} from '../features/placeholders.tsx';
import { SettingsPage } from '../features/settings/SettingsPage.tsx';
import { AppShell } from '../layout/AppShell.tsx';

/** Routes — CONCEPT.md §1.3. */
export const routes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/knowledge" replace /> },
          { path: '/knowledge/*', element: <KnowledgePage /> },
          { path: '/actionable/*', element: <ActionablePage /> },
          { path: '/scheduler/*', element: <SchedulerPage /> },
          { path: '/inbox', element: <InboxPage /> },
          { path: '/search', element: <SearchPage /> },
          { path: '/settings', element: <Navigate to="/settings/appearance" replace /> },
          { path: '/settings/:section', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
