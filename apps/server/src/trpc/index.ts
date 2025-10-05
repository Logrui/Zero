import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { getContext } from 'hono/context-storage';
import type { HonoContext } from '../ctx';
import { aiRouter } from './routes/ai';
import { bimiRouter } from './routes/bimi';
import { brainRouter } from './routes/brain';
import { calendarRouter } from './routes/calendar';
import { categoriesRouter } from './routes/categories';
import { connectionsRouter } from './routes/connections';
import { cookiePreferencesRouter } from './routes/cookies';
import { draftsRouter } from './routes/drafts';
import { labelsRouter } from './routes/label';
import { mailRouter } from './routes/mail';
import { meetRouter } from './routes/meet';
import { notesRouter } from './routes/notes';
import { settingsRouter } from './routes/settings';
import { shortcutRouter } from './routes/shortcut';
import { tasksRouter } from './routes/tasks';
import { templatesRouter } from './routes/templates';
import { userRouter } from './routes/user';
import { router } from './trpc';

export const appRouter = router({
  ai: aiRouter,
  bimi: bimiRouter,
  calendar: calendarRouter,
  tasks: tasksRouter,
  brain: brainRouter,
  categories: categoriesRouter,
  connections: connectionsRouter,
  cookiePreferences: cookiePreferencesRouter,
  drafts: draftsRouter,
  labels: labelsRouter,
  mail: mailRouter,
  notes: notesRouter,
  shortcut: shortcutRouter,
  settings: settingsRouter,
  user: userRouter,
  templates: templatesRouter,
  meet: meetRouter,
});

export type AppRouter = typeof appRouter;

export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;

export const serverTrpc = () => {
  const c = getContext<HonoContext>();
  return appRouter.createCaller({
    c,
    sessionUser: c.var.sessionUser,
    auth: c.var.auth,
  });
};
