import { AuthWrapper } from '@/components/auth-wrapper';
import { ErrorBoundary as AppErrorBoundary, NetworkStatusProvider } from '@/components/error-boundaries';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';
import { siteConfig } from '@/lib/site-config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { ClientProviders } from '@/providers/client-providers';
import { ServerProviders } from '@/providers/server-providers';
import { Analytics as DubAnalytics } from '@dub/analytics/react';
import * as Sentry from '@sentry/react';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@zero/server/trpc';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, type PropsWithChildren } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
  type MetaFunction,
} from 'react-router';
import superjson from 'superjson';
import type { Route } from './+types/root';
import './globals.css';

const getUrl = () => import.meta.env.VITE_PUBLIC_BACKEND_URL + '/api/trpc';

export const getServerTrpc = (req: Request) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        maxItems: 1,
        url: getUrl(),
        transformer: superjson,
        headers: req.headers,
      }),
    ],
  });

export const meta: MetaFunction = () => {
  return [
    { title: siteConfig.title },
    { name: 'description', content: siteConfig.description },
    { property: 'og:title', content: siteConfig.title },
    { property: 'og:description', content: siteConfig.description },
    { property: 'og:image', content: siteConfig.openGraph.images[0].url },
    { property: 'og:url', content: siteConfig.alternates.canonical },
    { property: 'og:type', content: 'website' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ];
};

export function Layout({ children }: PropsWithChildren) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#141414" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="manifest" href="/manifest.json" />
        <Meta />
        {import.meta.env.REACT_SCAN && (
          <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
        )}
        <Links />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ServerProviders connectionId={null}>
          <ClientProviders>{children}</ClientProviders>
          <DubAnalytics
            domainsConfig={{
              refer: 'mail0.com',
            }}
          />
        </ServerProviders>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center" suppressHydrationWarning>
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <NetworkStatusProvider>
      <AppErrorBoundary>
        <AuthWrapper requireAuth={false}>
          <Outlet />
        </AuthWrapper>
      </AppErrorBoundary>
    </NetworkStatusProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;
  let isNetworkError = false;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
    if (error.status === 404) {
      return <NotFound />;
    }
    // Check if it's a network/backend error
    isNetworkError = error.status >= 500 ||
      error.statusText?.toLowerCase().includes('connection') ||
      error.statusText?.toLowerCase().includes('network');
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
    // Check if it's a network error
    isNetworkError = error.message?.toLowerCase().includes('connection') ||
      error.message?.toLowerCase().includes('fetch failed') ||
      error.message?.toLowerCase().includes('network');
  }

  useEffect(() => {
    console.error(error);
    console.error({ message, details, stack });

    // Report error to Sentry
    if (isRouteErrorResponse(error)) {
      Sentry.captureException(new Error(`Route Error ${error.status}: ${error.statusText}`), {
        tags: {
          type: 'route_error',
          status: error.status,
        },
        extra: {
          statusText: error.statusText,
          data: error.data,
        },
      });
    } else if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: {
          type: 'app_error',
        },
      });
    } else {
      Sentry.captureException(new Error('Unknown error occurred'), {
        tags: {
          type: 'unknown_error',
        },
        extra: {
          error: error,
        },
      });
    }
  }, [error, message, details, stack]);

  // For network/backend errors, show a friendly fallback instead of the error screen
  if (isNetworkError) {
    return (
      <div className="dark:bg-background flex w-full items-center justify-center bg-white text-center">
        <div className="flex-col items-center justify-center md:flex dark:text-gray-100">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Connection Issue</h2>
            <p className="text-muted-foreground max-w-md">
              We're experiencing some connection issues. You can still browse our site and learn about Zero OS.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                Go to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark:bg-background flex w-full items-center justify-center bg-white text-center">
      <div className="flex-col items-center justify-center md:flex dark:text-gray-100">
        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Something went wrong!</h2>
          <p className="text-muted-foreground">See the console for more information.</p>
          <pre className="text-muted-foreground">{JSON.stringify(error, null, 2)}</pre>
        </div>

        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-muted-foreground gap-2"
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="text-muted-foreground gap-2"
          >
            Log Out and Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="dark:bg-background flex w-full items-center justify-center bg-white text-center">
      <div className="flex-col items-center justify-center md:flex dark:text-gray-100">
        <div className="relative">
          <h1 className="text-muted-foreground/20 select-none text-[150px] font-bold">404</h1>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <AlertCircle className="text-muted-foreground h-20 w-20" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {m['pages.error.notFound.title']()}
          </h2>
          <p className="text-muted-foreground">{m['pages.error.notFound.description']()}</p>
        </div>

        {/* Buttons */}
        <div className="mt-2 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="text-muted-foreground gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {m['pages.error.notFound.goBack']()}
          </Button>
        </div>
      </div>
    </div>
  );
}
