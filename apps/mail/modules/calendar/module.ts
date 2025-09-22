import type { IFeatureModule } from '../types';

export const CalendarModule: IFeatureModule = {
  name: 'Calendar',
  routes: [
    { path: '/calendar', component: () => import('./pages/calendar-page.tsx') },
  ],
  getNavigation: () => null, // We are using static navigation for now.
  getAITools: () => [],
};
