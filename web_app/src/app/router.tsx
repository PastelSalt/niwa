import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router';
import { GuestOnly, RequireAuth } from '../auth/guards.tsx';
import { LoginPage } from '../auth/LoginPage.tsx';
import { RegisterPage } from '../auth/RegisterPage.tsx';
import { NotFoundPage } from '../components/NotFoundPage.tsx';
import { RouteError } from '../components/RouteError.tsx';
import { ActionablePage, ItemRedirect, KnowledgePage } from '../features/pages.tsx';
import { AppShell } from '../layout/AppShell.tsx';

// Destinations load on demand so the first screen doesn't pay for the scheduler, search, etc.
// The shell's <Suspense> shows a slim progress bar while a chunk loads.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(async () => ({ default: (await load())[name] }));

const InboxPage = named(() => import('../features/inbox/InboxPage.tsx'), 'InboxPage');
const SearchPage = named(() => import('../features/search/SearchPage.tsx'), 'SearchPage');
const ReviewQueue = named(() => import('../features/knowledge/ReviewQueue.tsx'), 'ReviewQueue');
const SchedulerHome = named(() => import('../features/scheduler/SchedulerPage.tsx'), 'SchedulerHome');
const SchedulerPage = named(() => import('../features/scheduler/SchedulerPage.tsx'), 'SchedulerPage');
const SettingsPage = named(() => import('../features/settings/SettingsPage.tsx'), 'SettingsPage');

/** Routes — CONCEPT.md §1.3. */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
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
              {
                // A crashing screen renders the error inside the shell, so navigation still works.
                errorElement: <RouteError />,
                children: [
                  { index: true, element: <Navigate to="/knowledge" replace /> },
                  { path: '/knowledge/review', element: <ReviewQueue /> },
                  { path: '/knowledge/:itemId?', element: <KnowledgePage /> },
                  { path: '/actionable/:itemId?', element: <ActionablePage /> },
                  { path: '/items/:id', element: <ItemRedirect /> },
                  { path: '/scheduler', element: <SchedulerHome /> },
                  { path: '/scheduler/:view/:date', element: <SchedulerPage /> },
                  { path: '/inbox', element: <InboxPage /> },
                  { path: '/search', element: <SearchPage /> },
                  { path: '/settings', element: <Navigate to="/settings/appearance" replace /> },
                  { path: '/settings/:section', element: <SettingsPage /> },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
