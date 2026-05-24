import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Notes } from '@/pages/Notes';
import { Focus } from '@/pages/Focus';
import { Auth } from '@/pages/Auth';
import { ComingSoon } from '@/pages/ComingSoon';
import { Tools } from '@/pages/Tools';
import { Tasks } from '@/pages/Tasks';
import { Analytics } from '@/pages/Analytics';
import { Music } from '@/pages/Music';
import { Settings } from '@/pages/Settings';
import { StudyMode } from '@/pages/StudyMode';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BatchPage } from '@/pages/Batch';
import { FloatingMusicPlayer } from '@/components/widgets/FloatingMusicPlayer';
import React from 'react';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <AmbientBackground />
      <AppLayout />
      <FloatingMusicPlayer />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: Auth,
});

const notesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notes',
  component: Notes,
});


const toolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tools',
  component: Tools,
});

const focusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/focus',
  component: Focus,
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: Tasks,
});

const musicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/music',
  component: Music,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: Analytics,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
});

const studyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/study',
  component: StudyMode,
});

const batchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/batch',
  component: BatchPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  notesRoute,
  toolsRoute,
  focusRoute,
  tasksRoute,
  musicRoute,
  analyticsRoute,
  settingsRoute,
  studyRoute,
  batchRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
