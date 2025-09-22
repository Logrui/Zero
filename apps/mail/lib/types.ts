import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../server/src/trpc';

type RouterOutput = inferRouterOutputs<AppRouter>;

export type Connection = {
  id: string;
  providerId: string;
  email: string;
  name: string | null;
  picture: string | null;
};

export type ConnectionsListOutput = RouterOutput['connections']['list'];
