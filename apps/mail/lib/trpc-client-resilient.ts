import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@zero/server/trpc';
import superjson from 'superjson';
import { useState } from 'react';

// Create a resilient TRPC client that handles connection failures
export const trpc = createTRPCReact<AppRouter>();

const getUrl = () => import.meta.env.VITE_PUBLIC_BACKEND_URL + '/api/trpc';

// Enhanced error handling for TRPC
const createResilientTRPCClient = () => {
    return trpc.createClient({
        links: [
            httpBatchLink({
                url: getUrl(),
                fetch: async (url, options) => {
                    try {
                        const response = await fetch(url, {
                            ...options,
                            credentials: 'include',
                            // Add timeout
                            signal: AbortSignal.timeout(10000), // 10 second timeout
                        });

                        if (!response.ok) {
                            // Handle specific error cases
                            if (response.status === 500) {
                                console.warn('Server error (500) - this might be a connection issue');
                                throw new Error('Server connection failed');
                            }

                            if (response.status >= 500) {
                                throw new Error('Server error - please try again later');
                            }
                        }

                        return response;
                    } catch (error) {
                        console.error('TRPC fetch error:', error);

                        // Check if it's a network error
                        if (error instanceof TypeError && error.message.includes('fetch')) {
                            throw new Error('Network connection failed');
                        }

                        if (error instanceof Error && error.name === 'AbortError') {
                            throw new Error('Request timeout - please check your connection');
                        }

                        throw error;
                    }
                },
                transformer: superjson,
            }),
        ],
    });
};

export const trpcClient = createResilientTRPCClient();

// Hook for handling TRPC errors gracefully
export function useTRPCErrorHandler() {
    const [hasShownError, setHasShownError] = useState(false);

    const handleError = (error: any) => {
        if (hasShownError) return;

        const isNetworkError = error?.message?.toLowerCase().includes('network') ||
            error?.message?.toLowerCase().includes('connection') ||
            error?.message?.toLowerCase().includes('fetch failed') ||
            error?.message?.toLowerCase().includes('timeout');

        if (isNetworkError) {
            console.warn('TRPC network error detected:', error);
            // Don't show toast for network errors to avoid spam
            setHasShownError(true);
        } else {
            console.error('TRPC error:', error);
            setHasShownError(true);
        }
    };

    return { handleError, hasShownError };
}

// Utility for retrying TRPC operations
export async function retryTRPCOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on certain errors
            if (error instanceof Error &&
                (error.message.includes('unauthorized') ||
                    error.message.includes('forbidden'))) {
                throw error;
            }

            if (attempt < maxRetries) {
                console.warn(`TRPC operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        } catch (error) {
            lastError = error as Error;
        }
    }

    throw lastError!;
}
