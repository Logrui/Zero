import { ComponentType } from 'react';

export interface IRoute {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
}

export interface INavigationLink {
  path: string;
  name: string;
}

export interface IAITool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export interface IFeatureModule {
  name: string;
  routes: IRoute[];
  getNavigation: () => INavigationLink | null;
  getAITools: () => IAITool[];
}
