import { useCallback, useEffect, useState } from 'react';

export interface PermissionCheckResult {
    hasRequiredPermissions: boolean;
    missingScopes: string[];
    needsReauth: boolean;
    loading: boolean;
    error: string | null;
}

export interface ReauthUrlResult {
    reauthUrl: string;
    message: string;
}

/**
 * Hook to check Google Tasks permissions and handle re-authentication
 */
export function usePermissionCheck() {
    const [permissionResult, setPermissionResult] = useState<PermissionCheckResult>({
        hasRequiredPermissions: false,
        missingScopes: [],
        needsReauth: false,
        loading: true,
        error: null
    });

    const [reauthUrl, setReauthUrl] = useState<string | null>(null);

    /**
     * Check if user has required Google Tasks permissions
     */
    const checkPermissions = useCallback(async () => {
        try {
            setPermissionResult(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/tasks/permissions/check', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to check permissions: ${response.status}`);
            }

            const data = await response.json();
            
            setPermissionResult({
                hasRequiredPermissions: data.hasRequiredPermissions,
                missingScopes: data.missingScopes,
                needsReauth: data.needsReauth,
                loading: false,
                error: null
            });

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to check permissions';
            setPermissionResult(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));
            throw error;
        }
    }, []);

    /**
     * Get re-authentication URL
     */
    const getReauthUrl = useCallback(async () => {
        try {
            const response = await fetch('/api/tasks/permissions/reauth-url', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get reauth URL: ${response.status}`);
            }

            const data: ReauthUrlResult = await response.json();
            setReauthUrl(data.reauthUrl);
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get reauth URL';
            setPermissionResult(prev => ({
                ...prev,
                error: errorMessage
            }));
            throw error;
        }
    }, []);

    /**
     * Handle re-authentication
     */
    const handleReauth = useCallback(async () => {
        try {
            const data = await getReauthUrl();
            // Redirect to Google OAuth with the reauth URL
            window.location.href = data.reauthUrl;
        } catch (error) {
            console.error('Failed to initiate re-authentication:', error);
        }
    }, [getReauthUrl]);

    // Check permissions on mount
    useEffect(() => {
        checkPermissions();
    }, [checkPermissions]);

    return {
        ...permissionResult,
        reauthUrl,
        checkPermissions,
        getReauthUrl,
        handleReauth
    };
}
