/**
 * useGoogleTasks Hook
 * 
 * Simple hook for Google Tasks authentication using better-auth.
 * Follows the same pattern as calendar authentication.
 */

'use client';

import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect, useState } from 'react';
import type { UseGoogleTasksReturn } from '../types/task';

export function useGoogleTasks(): UseGoogleTasksReturn {
    const { data: session, isPending: sessionLoading } = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [authUrl, setAuthUrl] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Check if user has Google connection (simplified - no scope checking)
    const checkAuthStatus = useCallback(async () => {
        try {
            setLoading(true);

            if (!session?.user) {
                setIsConnected(false);
                setPermissions([]);
                return;
            }

            // Check if user has any Google connection (simplified)
            const hasGoogleConnection = session.user.accounts?.some(
                account => account.provider === 'google'
            );

            setIsConnected(!!hasGoogleConnection);
            setPermissions(hasGoogleConnection ? ['https://www.googleapis.com/auth/tasks'] : []);
        } catch (error) {
            console.error('Failed to check auth status:', error);
            setIsConnected(false);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    }, [session]);

    // Get auth URL for Google OAuth
    const getAuthUrl = useCallback(async () => {
        const url = `${import.meta.env.VITE_PUBLIC_BACKEND_URL}/auth/signin/google`;
        setAuthUrl(url);
        return url;
    }, []);

    // Connect to Google Tasks
    const connect = useCallback(async () => {
        const url = await getAuthUrl();
        if (url && typeof window !== 'undefined') {
            window.location.href = url;
        }
    }, [getAuthUrl]);

    // Disconnect from Google Tasks (simplified)
    const disconnect = useCallback(async () => {
        setIsConnected(false);
        setPermissions([]);
    }, []);

    // Check auth status when session changes
    useEffect(() => {
        if (!sessionLoading) {
            checkAuthStatus();
        }
    }, [session, sessionLoading, checkAuthStatus]);

    return {
        isConnected,
        authUrl,
        connect,
        disconnect,
        permissions,
        loading: loading || sessionLoading
    };
}
