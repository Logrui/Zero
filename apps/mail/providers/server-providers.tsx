import { QueryProvider } from './query-provider';
import type { PropsWithChildren } from 'react';

export function ServerProviders({
  children,
  connectionId,
}: PropsWithChildren<{ connectionId: string | null }>) {
  return (
    <QueryProvider connectionId={connectionId}>{children}</QueryProvider>
  );
}
