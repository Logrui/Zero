import { and, eq } from 'drizzle-orm';
import { createDb } from '../db';
import { connection } from '../db/schema';
import { env } from '../env';
// Removed GoogleTasksService - using better-auth instead

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
        let conn;
        try {
            const { db, conn: dbConn } = createDb(env.HYPERDRIVE.connectionString);
            conn = dbConn;

            // Find user's Google connection
            const userConnection = await db
                .select()
                .from(connection)
                .where(
                    and(
                        eq(connection.userId, userId),
                        eq(connection.providerId, 'google')
                    )
                )
                .limit(1);

            if (!userConnection.length) {
                return {
                    hasRequiredPermissions: false,
                    missingScopes: this.REQUIRED_SCOPES,
                    needsReauth: true
                };
            }

            const connData = userConnection[0];

            console.log('🔍 [PermissionCheck] Checking user permissions:', {
                userId,
                currentScopes: connData.scope?.split(' ') || [],
                requiredScopes: this.REQUIRED_SCOPES,
                hasAccessToken: !!connData.accessToken,
                expiresAt: connData.expiresAt
            });

            // Check if the connection has the required scopes
            const currentScopes = connData.scope?.split(' ') || [];
            const missingScopes = this.REQUIRED_SCOPES.filter(
                scope => !currentScopes.includes(scope)
            );

            if (missingScopes.length > 0) {
                console.log('❌ [PermissionCheck] Missing scopes:', missingScopes);
                return {
                    hasRequiredPermissions: false,
                    missingScopes,
                    needsReauth: true
                };
            }

            // Check if tokens exist
            if (!connData.accessToken) {
                return {
                    hasRequiredPermissions: false,
                    missingScopes: this.REQUIRED_SCOPES,
                    needsReauth: true
                };
            }

            // Check if token is expired
            if (connData.expiresAt && new Date(connData.expiresAt) < new Date()) {
                console.log('Access token is expired');
                return {
                    hasRequiredPermissions: false,
                    missingScopes: this.REQUIRED_SCOPES,
                    needsReauth: true
                };
            }

            // If we have all required scopes and a valid token, consider permissions granted
            // The actual API functionality will be tested when the user tries to use the tasks page
            console.log('✅ [PermissionCheck] User has required permissions');
            return {
                hasRequiredPermissions: true,
                missingScopes: [],
                needsReauth: false
            };
        } catch (error) {
            console.error('Error checking user permissions:', error);
            return {
                hasRequiredPermissions: false,
                missingScopes: this.REQUIRED_SCOPES,
                needsReauth: true
            };
        } finally {
            if (conn) {
                await conn.end();
            }
        }
    }

    /**
     * Get re-authentication URL for Google Tasks permissions
     */
    static async getReauthUrl(userId: string): Promise<string> {
        // Use better-auth OAuth flow for re-authentication
        return `${env.BASE_URL}/auth/signin/google`;
    }

    /**
     * Check if user needs to re-authenticate for Google Tasks
     */
    static async needsGoogleTasksReauth(userId: string): Promise<boolean> {
        const result = await this.checkUserPermissions(userId);
        return result.needsReauth;
    }
}
