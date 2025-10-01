import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConnectionNotification } from './connection-notification';
import { ErrorBoundary } from './error-boundaries';

interface AuthWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAuth?: boolean;
}

interface AuthState {
    isLoading: boolean;
    hasError: boolean;
    error: Error | null;
    isRetrying: boolean;
    retryCount: number;
}

export function AuthWrapper({
    children,
    fallback,
    requireAuth = false
}: AuthWrapperProps) {
    const { data: session, error: sessionError, isLoading } = useSession();
    const [authState, setAuthState] = useState<AuthState>({
        isLoading: true,
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: 0,
    });
    const [showConnectionNotification, setShowConnectionNotification] = useState(false);

    const maxRetries = 3;
    const retryDelay = 2000;

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
            '500 Internal Server Error',
        ];

        const errorMessage = error.message || error.toString() || '';
        return networkErrorPatterns.some(pattern =>
            errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
    };

    useEffect(() => {
        if (sessionError) {
            const isNetworkErrorResult = isNetworkError(sessionError);

            setAuthState(prev => ({
                ...prev,
                hasError: true,
                error: sessionError,
                isLoading: false,
            }));

            if (isNetworkErrorResult) {
                console.log('Network error detected, showing notification');
                setShowConnectionNotification(true);
                // Don't auto-hide - let user dismiss manually
            }
        } else if (!isLoading) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                hasError: false,
                error: null,
            }));
            setShowConnectionNotification(false);
        }
    }, [sessionError, isLoading]);

    const handleRetry = async () => {
        if (authState.retryCount >= maxRetries) {
            toast.error('Maximum retry attempts reached. Please refresh the page.');
            return;
        }

        setAuthState(prev => ({ ...prev, isRetrying: true }));

        try {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * (authState.retryCount + 1)));

            // Force a session refresh
            window.location.reload();
        } catch (error) {
            setAuthState(prev => ({ ...prev, isRetrying: false }));
            toast.error('Retry failed. Please try again.');
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    // If we're still loading and haven't hit an error, show loading state
    if (authState.isLoading && !authState.hasError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-[#B7B7B7]">Loading...</p>
                </div>
            </div>
        );
    }

    // If we have an error, show error state
    if (authState.hasError) {
        const isNetworkErrorResult = authState.error ? isNetworkError(authState.error) : false;

        // If we don't require auth, always show children with notification overlay
        if (!requireAuth) {
            return (
                <>
                    {children}
                    <ConnectionNotification
                        isVisible={showConnectionNotification}
                        onRetry={handleRetry}
                        onDismiss={() => setShowConnectionNotification(false)}
                        showRetry={authState.retryCount < maxRetries}
                    />
                </>
            );
        }

        // Show full error state for auth-required pages or non-network errors
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
                <div className="max-w-md w-full bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8 text-center">
                    <div className="flex justify-center mb-6">
                        {isNetworkError ? (
                            <WifiOff className="h-16 w-16 text-red-500" />
                        ) : (
                            <AlertCircle className="h-16 w-16 text-yellow-500" />
                        )}
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-4">
                        {isNetworkError ? 'Connection Issue' : 'Authentication Error'}
                    </h2>

                    <p className="text-[#B7B7B7] mb-6">
                        {isNetworkError
                            ? 'Unable to connect to the authentication server. Please check your connection and try again.'
                            : 'There was an issue with authentication. Please try again.'
                        }
                    </p>

                    {authState.error && import.meta.env.DEV && (
                        <details className="mb-6 text-left">
                            <summary className="cursor-pointer text-sm text-[#B7B7B7] mb-2">
                                Error Details (Development)
                            </summary>
                            <pre className="text-xs text-red-400 bg-[#0F0F0F] p-3 rounded overflow-auto max-h-32">
                                {authState.error.message}
                                {authState.error.stack && `\n\n${authState.error.stack}`}
                            </pre>
                        </details>
                    )}

                    <div className="flex flex-col gap-3">
                        {authState.retryCount < maxRetries && (
                            <Button
                                onClick={handleRetry}
                                disabled={authState.isRetrying}
                                className="w-full"
                            >
                                {authState.isRetrying ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Retrying...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Try Again ({maxRetries - authState.retryCount} attempts left)
                                    </>
                                )}
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Page
                        </Button>
                    </div>

                    {isNetworkError && (
                        <div className="mt-6 p-4 bg-[#2A2A2A] rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-[#B7B7B7]">
                                <WifiOff className="h-4 w-4" />
                                <span>You can still browse the site in offline mode</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // If we require auth but no session, show login prompt
    if (requireAuth && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
                <div className="max-w-md w-full bg-[#1E1E1E] rounded-xl border border-[#2A2A2A] p-8 text-center">
                    <h2 className="text-2xl font-semibold text-white mb-4">Authentication Required</h2>
                    <p className="text-[#B7B7B7] mb-6">
                        Please log in to access this page.
                    </p>
                    <Button
                        onClick={() => window.location.href = '/login'}
                        className="w-full"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    // Everything is good, render children
    return (
        <ErrorBoundary>
            {children}
            <ConnectionNotification
                isVisible={showConnectionNotification}
                onRetry={handleRetry}
                onDismiss={() => setShowConnectionNotification(false)}
                showRetry={authState.retryCount < maxRetries}
            />
        </ErrorBoundary>
    );
}

// Hook for handling auth errors gracefully
export function useAuthErrorHandler() {
    const { error } = useSession();
    const [hasShownError, setHasShownError] = useState(false);

    useEffect(() => {
        if (error && !hasShownError) {
            const isNetworkError = error.message?.toLowerCase().includes('connection') ||
                error.message?.toLowerCase().includes('fetch failed') ||
                error.message?.toLowerCase().includes('network');

            if (isNetworkError) {
                // Don't show toast for network errors, let the notification handle it
                console.warn('Connection issue detected. Some features may be limited.');
            } else {
                toast.error('Authentication error. Please try again.');
            }

            setHasShownError(true);
        }
    }, [error, hasShownError]);

    return { error, hasShownError };
}
