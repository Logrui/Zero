import { and, desc, eq } from 'drizzle-orm';
import { createDb } from '../db';
import type { UserPermission } from '../db/schema';
import { userPermissions } from '../db/schema';
import { env } from '../env';
import { getZeroDB } from '../lib/server-utils';

/**
 * UserPermissions Model
 * 
 * Handles OAuth state management for Google Tasks integration.
 * Provides permission tracking and token management for users.
 */

export interface CreateUserPermissionsData {
    userId: string;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    tokenExpiry?: Date;
    permissions?: string[];
    lastAuthCheck?: Date;
}

export interface UpdateUserPermissionsData {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    tokenExpiry?: Date;
    permissions?: string[];
    lastAuthCheck?: Date;
}

export interface TokenRefreshData {
    accessToken: string;
    refreshToken?: string;
    expiry: Date;
}

export interface PermissionScope {
    scope: string;
    description: string;
    required: boolean;
}

export class UserPermissionsModel {
    /**
     * Create user permissions
     */
    static async create(data: CreateUserPermissionsData): Promise<UserPermission> {
        // Validate user ID
        if (!data.userId || data.userId.trim().length === 0) {
            throw new Error('User ID is required');
        }

        // Validate permissions array
        if (data.permissions && !Array.isArray(data.permissions)) {
            throw new Error('Permissions must be an array');
        }

        // Validate token expiry
        if (data.tokenExpiry && data.tokenExpiry < new Date()) {
            throw new Error('Token expiry cannot be in the past');
        }

        const db = await getZeroDB(data.userId) as any;
        const [userPerms] = await db.insert(userPermissions).values({
            userId: data.userId,
            googleAccessToken: data.googleAccessToken,
            googleRefreshToken: data.googleRefreshToken,
            tokenExpiry: data.tokenExpiry,
            permissions: data.permissions || [],
            lastAuthCheck: data.lastAuthCheck
        }).returning();

        return userPerms;
    }

    /**
     * Get user permissions by user ID
     */
    static async getByUserId(userId: string): Promise<UserPermission | null> {
        const db = await getZeroDB(userId) as any;
        const userPerms = await db.select()
            .from(userPermissions)
            .where(eq(userPermissions.userId, userId))
            .limit(1);

        return userPerms[0] || null;
    }

    /**
     * Update user permissions
     */
    static async update(userId: string, data: UpdateUserPermissionsData): Promise<UserPermission> {
        // Validate permissions array if provided
        if (data.permissions && !Array.isArray(data.permissions)) {
            throw new Error('Permissions must be an array');
        }

        // Validate token expiry if provided
        if (data.tokenExpiry && data.tokenExpiry < new Date()) {
            throw new Error('Token expiry cannot be in the past');
        }

        const db = await getZeroDB(userId) as any;
        const [updatedPerms] = await db.update(userPermissions)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(userPermissions.userId, userId))
            .returning();

        if (!updatedPerms) {
            throw new Error('User permissions not found');
        }

        return updatedPerms;
    }

    /**
     * Set OAuth tokens
     */
    static async setTokens(userId: string, tokens: TokenRefreshData): Promise<UserPermission> {
        return await this.update(userId, {
            googleAccessToken: tokens.accessToken,
            googleRefreshToken: tokens.refreshToken,
            tokenExpiry: tokens.expiry,
            lastAuthCheck: new Date()
        });
    }

    /**
     * Refresh access token
     */
    static async refreshAccessToken(userId: string, newAccessToken: string, newExpiry: Date): Promise<UserPermission> {
        return await this.update(userId, {
            googleAccessToken: newAccessToken,
            tokenExpiry: newExpiry,
            lastAuthCheck: new Date()
        });
    }

    /**
     * Clear all tokens (logout)
     */
    static async clearTokens(userId: string): Promise<UserPermission> {
        return await this.update(userId, {
            googleAccessToken: undefined,
            googleRefreshToken: undefined,
            tokenExpiry: undefined,
            lastAuthCheck: undefined
        });
    }

    /**
     * Add permission scope
     */
    static async addPermission(userId: string, permission: string): Promise<UserPermission> {
        const currentPerms = await this.getByUserId(userId);
        if (!currentPerms) {
            throw new Error('User permissions not found');
        }

        const updatedPermissions = [...currentPerms.permissions];
        if (!updatedPermissions.includes(permission)) {
            updatedPermissions.push(permission);
        }

        return await this.update(userId, {
            permissions: updatedPermissions
        });
    }

    /**
     * Remove permission scope
     */
    static async removePermission(userId: string, permission: string): Promise<UserPermission> {
        const currentPerms = await this.getByUserId(userId);
        if (!currentPerms) {
            throw new Error('User permissions not found');
        }

        const updatedPermissions = currentPerms.permissions.filter(p => p !== permission);

        return await this.update(userId, {
            permissions: updatedPermissions
        });
    }

    /**
     * Check if user has permission
     */
    static async hasPermission(userId: string, permission: string): Promise<boolean> {
        const userPerms = await this.getByUserId(userId);
        if (!userPerms) {
            return false;
        }

        return userPerms.permissions.includes(permission);
    }

    /**
     * Check if tokens are valid
     */
    static async areTokensValid(userId: string): Promise<boolean> {
        const userPerms = await this.getByUserId(userId);
        if (!userPerms) {
            return false;
        }

        if (!userPerms.googleAccessToken) {
            return false;
        }

        if (userPerms.tokenExpiry && userPerms.tokenExpiry < new Date()) {
            return false;
        }

        return true;
    }

    /**
     * Check if tokens need refresh
     */
    static async needsTokenRefresh(userId: string, bufferMinutes: number = 5): Promise<boolean> {
        const userPerms = await this.getByUserId(userId);
        if (!userPerms || !userPerms.tokenExpiry) {
            return false;
        }

        const bufferTime = new Date();
        bufferTime.setMinutes(bufferTime.getMinutes() + bufferMinutes);

        return userPerms.tokenExpiry < bufferTime;
    }

    /**
     * Get users with expired tokens
     */
    static async getUsersWithExpiredTokens(): Promise<UserPermission[]> {
        const now = new Date();
        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            const result = await db.select()
                .from(userPermissions)
                .where(and(
                    eq(userPermissions.googleAccessToken, ''),
                    eq(userPermissions.tokenExpiry, now)
                ));
            return result;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get users needing token refresh
     */
    static async getUsersNeedingTokenRefresh(bufferMinutes: number = 5): Promise<UserPermission[]> {
        const bufferTime = new Date();
        bufferTime.setMinutes(bufferTime.getMinutes() + bufferMinutes);
        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            return await db.select()
                .from(userPermissions)
                .where(and(
                    eq(userPermissions.googleAccessToken, ''),
                    eq(userPermissions.tokenExpiry, bufferTime)
                ));
        } finally {
            await conn.end();
        }
    }

    /**
     * Get permission statistics
     */
    static async getPermissionStats(): Promise<{
        totalUsers: number;
        usersWithTokens: number;
        usersWithExpiredTokens: number;
        usersNeedingRefresh: number;
        mostCommonPermissions: { [key: string]: number };
    }> {
        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            const allPerms = await db.select().from(userPermissions);
            const now = new Date();
            const bufferTime = new Date();
            bufferTime.setMinutes(bufferTime.getMinutes() + 5);

            const usersWithTokens = allPerms.filter(perm => perm.googleAccessToken).length;
            const usersWithExpiredTokens = allPerms.filter(perm =>
                perm.tokenExpiry && perm.tokenExpiry < now
            ).length;
            const usersNeedingRefresh = allPerms.filter(perm =>
                perm.tokenExpiry && perm.tokenExpiry < bufferTime
            ).length;

            const permissionCounts: { [key: string]: number } = {};
            for (const perm of allPerms) {
                for (const permission of perm.permissions) {
                    permissionCounts[permission] = (permissionCounts[permission] || 0) + 1;
                }
            }

            return {
                totalUsers: allPerms.length,
                usersWithTokens,
                usersWithExpiredTokens,
                usersNeedingRefresh,
                mostCommonPermissions: permissionCounts
            };
        } finally {
            await conn.end();
        }
    }

    /**
     * Get required permissions for Google Tasks
     */
    static getRequiredPermissions(): PermissionScope[] {
        return [
            {
                scope: 'https://www.googleapis.com/auth/tasks',
                description: 'Read and write access to Google Tasks',
                required: true
            },
            {
                scope: 'https://www.googleapis.com/auth/tasks.readonly',
                description: 'Read-only access to Google Tasks',
                required: false
            },
            {
                scope: 'https://www.googleapis.com/auth/userinfo.email',
                description: 'Access to user email address',
                required: true
            },
            {
                scope: 'https://www.googleapis.com/auth/userinfo.profile',
                description: 'Access to user profile information',
                required: true
            }
        ];
    }

    /**
     * Validate permission scopes
     */
    static validatePermissions(permissions: string[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const requiredPerms = this.getRequiredPermissions().filter(p => p.required);

        // Check for required permissions
        for (const required of requiredPerms) {
            if (!permissions.includes(required.scope)) {
                errors.push(`Missing required permission: ${required.scope}`);
            }
        }

        // Check for invalid permissions
        const validScopes = this.getRequiredPermissions().map(p => p.scope);
        for (const permission of permissions) {
            if (!validScopes.includes(permission)) {
                errors.push(`Invalid permission scope: ${permission}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update last auth check
     */
    static async updateLastAuthCheck(userId: string): Promise<UserPermission> {
        return await this.update(userId, {
            lastAuthCheck: new Date()
        });
    }

    /**
     * Get users by permission
     */
    static async getUsersByPermission(permission: string): Promise<UserPermission[]> {
        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            return await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.permissions, [permission]));
        } finally {
            await conn.end();
        }
    }

    /**
     * Clean up old permissions
     */
    static async cleanupOldPermissions(olderThanDays: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            const result = await db.delete(userPermissions)
                .where(and(
                    eq(userPermissions.lastAuthCheck, cutoffDate),
                    eq(userPermissions.googleAccessToken, '')
                ));

            return result.length || 0;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get permission history
     */
    static async getPermissionHistory(userId: string): Promise<UserPermission[]> {
        const db = await getZeroDB(userId) as any;
        return await db.select()
            .from(userPermissions)
            .where(eq(userPermissions.userId, userId))
            .orderBy(desc(userPermissions.updatedAt));
    }

    /**
     * Validate user permissions data
     */
    static validateUserPermissionsData(data: CreateUserPermissionsData | UpdateUserPermissionsData): void {
        if ('userId' in data && data.userId && (!data.userId || data.userId.trim().length === 0)) {
            throw new Error('User ID is required');
        }

        if ('permissions' in data && data.permissions && !Array.isArray(data.permissions)) {
            throw new Error('Permissions must be an array');
        }

        if ('tokenExpiry' in data && data.tokenExpiry && data.tokenExpiry < new Date()) {
            throw new Error('Token expiry cannot be in the past');
        }
    }
}
