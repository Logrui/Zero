/**
 * Google Tasks Authentication Component
 * 
 * Handles Google Tasks OAuth authentication.
 * Prompts user to connect their Google account for task sync.
 */

'use client';

import { useCallback, useState } from 'react';

export interface GoogleTasksAuthProps {
    authUrl: string;
    onConnect: () => void;
    onCancel: () => void;
    isReauth?: boolean;
    missingScopes?: string[];
}

export function GoogleTasksAuth({
    authUrl,
    onConnect,
    onCancel,
    isReauth = false,
    missingScopes = []
}: GoogleTasksAuthProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle connect
    const handleConnect = useCallback(() => {
        setIsConnecting(true);
        setError(null);

        try {
            // Open OAuth popup
            const popup = window.open(
                authUrl,
                'google-tasks-auth',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );

            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site.');
            }

            // Listen for popup close
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    setIsConnecting(false);
                    // TODO: Check if authentication was successful
                    onConnect();
                }
            }, 1000);

            // Cleanup after 5 minutes
            setTimeout(() => {
                clearInterval(checkClosed);
                if (!popup.closed) {
                    popup.close();
                }
                setIsConnecting(false);
            }, 300000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to open authentication window');
            setIsConnecting(false);
        }
    }, [authUrl, onConnect]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
                {/* Google Tasks Icon */}
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {isReauth ? 'Re-authenticate Google Tasks' : 'Connect Google Tasks'}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-6">
                    {isReauth ? (
                        <>
                            Your Google account needs additional permissions to access Google Tasks.
                            Please re-authenticate to grant the required permissions.
                        </>
                    ) : (
                        <>
                            Connect your Google account to sync tasks between ZeroOS and Google Tasks.
                            Your tasks will be automatically synchronized in both directions.
                        </>
                    )}
                </p>

                {/* Missing Scopes for Re-auth */}
                {isReauth && missingScopes.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-800">
                                    <strong>Missing permissions:</strong> {missingScopes.join(', ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Features */}
                <div className="text-left space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Bidirectional sync with Google Tasks
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Work offline with automatic sync
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ZeroOS-specific task extensions
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting 
                            ? (isReauth ? 'Re-authenticating...' : 'Connecting...') 
                            : (isReauth ? 'Re-authenticate Google Tasks' : 'Connect Google Tasks')
                        }
                    </button>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-gray-500 mt-4">
                    We only access your Google Tasks data and never store your Google credentials.
                    You can revoke access at any time in your Google account settings.
                </p>
            </div>
        </div>
    );
}
