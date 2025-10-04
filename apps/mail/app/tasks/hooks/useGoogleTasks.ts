/**
 * useGoogleTasks Hook
 * 
 * Custom hook for managing Google Tasks authentication.
 * Handles OAuth flow, connection status, and permissions.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { googleTasksApi } from '../services/googleTasksApi';
import type { UseGoogleTasksReturn } from '../types/task';

export function useGoogleTasks(): UseGoogleTasksReturn {
    const [isConnected, setIsConnected] = useState(false);
    const [authUrl, setAuthUrl] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Check authentication status
    const checkAuthStatus = useCallback(async () => {
        try {
            setLoading(true);
            const authState = await googleTasksApi.checkAuthStatus();
            setIsConnected(authState.isConnected);
            setPermissions(authState.permissions);
        } catch (error) {
            console.error('Failed to check auth status:', error);
            setIsConnected(false);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get auth URL
    const getAuthUrl = useCallback(async () => {
        try {
            const url = await googleTasksApi.getAuthUrl();
            setAuthUrl(url);
            return url;
        } catch (error) {
            console.error('Failed to get auth URL:', error);
            throw error;
        }
    }, []);

    // Connect to Google Tasks
    const connect = useCallback(async () => {
        try {
            const url = await getAuthUrl();
            if (url) {
                // Open OAuth popup
                const popup = window.open(
                    url,
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
                        checkAuthStatus(); // Check if authentication was successful
                    }
                }, 1000);

                // Cleanup after 5 minutes
                setTimeout(() => {
                    clearInterval(checkClosed);
                    if (!popup.closed) {
                        popup.close();
                    }
                }, 300000);
            }
        } catch (error) {
            console.error('Failed to connect to Google Tasks:', error);
            throw error;
        }
    }, [getAuthUrl, checkAuthStatus]);

    // Disconnect from Google Tasks
    const disconnect = useCallback(async () => {
        try {
            await googleTasksApi.disconnect();
            setIsConnected(false);
            setPermissions([]);
        } catch (error) {
            console.error('Failed to disconnect from Google Tasks:', error);
            throw error;
        }
    }, []);

    // Handle OAuth callback
    const handleCallback = useCallback(async (code: string) => {
        try {
            await googleTasksApi.handleCallback(code);
            await checkAuthStatus();
        } catch (error) {
            console.error('Failed to handle OAuth callback:', error);
            throw error;
        }
    }, [checkAuthStatus]);

    // Initial auth check
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Handle OAuth callback from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state === 'google-tasks') {
            handleCallback(code);
        }
    }, [handleCallback]);

    return {
        isConnected,
        authUrl,
        connect,
        disconnect,
        permissions,
        loading
    };
}
