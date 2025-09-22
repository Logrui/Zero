import type { IFeatureModule } from './types';
import { CalendarModule } from './calendar/module';

// Manually register all feature modules here.
// This list will be used by the dynamic route loader to discover and mount modules.
export const featureModules: IFeatureModule[] = [
  CalendarModule,
  // Future modules like DashboardModule, etc., will be added here.
];
