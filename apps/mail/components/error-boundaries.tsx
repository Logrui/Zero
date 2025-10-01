import { Button } from '@/components/ui/button';
// Using simple text/icons instead of lucide-react
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ErrorBoundaryProps {
  children: any;
  fallback?: any;
  onError?: (error: Error) => void;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

export function ErrorBoundary({ children, fallback, onError }: ErrorBoundaryProps) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const maxRetries = 3;
  const retryDelay = 1000;

  const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    const networkErrorPatterns = [
      'connection attempt failed',
      'fetch failed',
      'network error',
      'connection refused',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
    ];

    const errorMessage = error.message || error.toString() || '';
    return networkErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  };

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Ignore null/undefined errors
      if (!event.error) {
        return;
      }

      console.error('Global error caught:', event.error);

      const isNetworkErrorResult = isNetworkError(event.error);

      setErrorState({
        hasError: true,
        error: event.error,
        isRetrying: false,
        retryCount: 0,
      });

      if (onError) {
        onError(event.error);
      }

      if (isNetworkErrorResult) {
        toast.error('Connection issue detected. Some features may be limited.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ignore null/undefined rejections
      if (!event.reason) {
        return;
      }

      console.error('Unhandled promise rejection:', event.reason);

      const isNetworkErrorResult = isNetworkError(event.reason);

      setErrorState({
        hasError: true,
        error: event.reason,
        isRetrying: false,
        retryCount: 0,
      });

      if (onError) {
        onError(event.reason);
      }

      if (isNetworkErrorResult) {
        toast.error('Connection issue detected. Some features may be limited.');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = async () => {
    if (errorState.retryCount >= maxRetries) {
      toast.error('Maximum retry attempts reached. Please refresh the page.');
      return;
    }

    setErrorState(prev => ({ ...prev, isRetrying: true }));

    try {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (errorState.retryCount + 1)));

      // Reset error state
      setErrorState({
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: errorState.retryCount + 1,
      });

      toast.success('Retrying connection...');
    } catch (error) {
      setErrorState(prev => ({ ...prev, isRetrying: false }));
      toast.error('Retry failed. Please try again.');
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (errorState.hasError) {
    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    const isNetworkErrorResult = errorState.error ? isNetworkError(errorState.error) : false;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
        <div className="max-w-md w-full bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8 text-center">
          <div className="flex justify-center mb-6">
            {isNetworkErrorResult ? (
              <div className="h-16 w-16 text-red-500 text-6xl">📶</div>
            ) : (
              <div className="h-16 w-16 text-yellow-500 text-6xl">⚠️</div>
            )}
          </div>

          <h2 className="text-2xl font-semibold text-white mb-4">
            {isNetworkErrorResult ? 'Connection Issue' : 'Something went wrong'}
          </h2>

          <p className="text-[#B7B7B7] mb-6">
            {isNetworkErrorResult
              ? 'Unable to connect to the server. Some features may be limited, but you can still browse the site.'
              : 'An unexpected error occurred. Please try again.'
            }
          </p>

          {errorState.error && import.meta.env.DEV && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-[#B7B7B7] mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-red-400 bg-[#0F0F0F] p-3 rounded overflow-auto max-h-32">
                {errorState.error.message}
                {errorState.error.stack && `\n\n${errorState.error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-3">
            {errorState.retryCount < maxRetries && (
              <Button
                onClick={handleRetry}
                disabled={errorState.isRetrying}
                className="w-full"
              >
                {errorState.isRetrying ? (
                  <>
                    <span className="mr-2">🔄</span>
                    Retrying...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔄</span>
                    Try Again ({maxRetries - errorState.retryCount} attempts left)
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleRefresh}
              className="w-full"
            >
              <span className="mr-2">🔄</span>
              Refresh Page
            </Button>

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
            >
              <span className="mr-2">🏠</span>
              Go to Home
            </Button>
          </div>

          {isNetworkErrorResult && (
            <div className="mt-6 p-4 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-center gap-2 text-sm text-[#B7B7B7]">
                <span>📶</span>
                <span>You can still browse the site in offline mode</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for handling async errors
export function useAsyncError() {
  const [, setError] = useState();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

// Component for handling network status
export function NetworkStatusProvider({ children }: { children: any }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
      toast.error('Connection lost. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      {showOfflineBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white p-2 text-center text-sm">
          <span className="inline mr-2">📶</span>
          You're offline. Some features may be limited.
        </div>
      )}
    </>
  );
}