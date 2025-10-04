import { getZeroDB } from '../lib/server-utils';
import { GoogleTasksService } from './googleTasksService';

export interface PermissionCheckResult {
    hasRequiredPermissions: boolean;
    missingScopes: string[];
    needsReauth: boolean;
}

export class PermissionCheckService {
    private static readonly REQUIRED_SCOPES = [
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    /**
     * Check if user has required Google Tasks permissions
     */
    static async checkUserPermissions(userId: string): Promise<PermissionCheckResult> {
        try {
            const db = await getZeroDB(userId);
            const connection = await db.findConnection('google');
            
            if (!connection) {
                return {
                    hasRequiredPermissions: false,
                    missingScopes: this.REQUIRED_SCOPES,
                    needsReauth: true
                };
            }

            // Check if the connection has the required scopes
            const currentScopes = connection.scope?.split(' ') || [];
            const missingScopes = this.REQUIRED_SCOPES.filter(
                scope => !currentScopes.includes(scope)
            );

            if (missingScopes.length > 0) {
                return {
                    hasRequiredPermissions: false,
                    missingScopes,
                    needsReauth: true
                };
            }

            // Test if the connection is still valid by making a test API call
            try {
                const googleTasksService = new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID!,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                    redirectUri: `${process.env.VITE_PUBLIC_BACKEND_URL}/auth/callback/google`
                });

                // Test the connection by trying to list tasks
                await googleTasksService.listTasks(connection.accessToken);
                
                return {
                    hasRequiredPermissions: true,
                    missingScopes: [],
                    needsReauth: false
                };
            } catch (error) {
                // If the API call fails, the token might be expired or invalid
                return {
                    hasRequiredPermissions: false,
                    missingScopes: this.REQUIRED_SCOPES,
                    needsReauth: true
                };
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            return {
                hasRequiredPermissions: false,
                missingScopes: this.REQUIRED_SCOPES,
                needsReauth: true
            };
        }
    }

    /**
     * Get re-authentication URL for Google Tasks permissions
     */
    static async getReauthUrl(userId: string): Promise<string> {
        const googleTasksService = new GoogleTasksService({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            redirectUri: `${process.env.VITE_PUBLIC_BACKEND_URL}/auth/callback/google`
        });

        return googleTasksService.getAuthUrl(userId);
    }

    /**
     * Check if user needs to re-authenticate for Google Tasks
     */
    static async needsGoogleTasksReauth(userId: string): Promise<boolean> {
        const result = await this.checkUserPermissions(userId);
        return result.needsReauth;
    }
}
