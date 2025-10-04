import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { userPermissions } from '../../src/db/schema';

/**
 * Unit Tests: UserPermissions Model
 * 
 * Tests the UserPermissions model and OAuth state management.
 * These tests MUST FAIL initially (TDD approach).
 * 
 * Test Cases:
 * 1. UserPermissions creation and management
 * 2. OAuth token management
 * 3. Permission scopes
 * 4. Token expiry handling
 * 5. Authentication state tracking
 */

describe('UserPermissions Model - Unit Tests', () => {
    let testUserId: string;

    beforeEach(async () => {
        testUserId = 'test-user-' + Date.now();
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(userPermissions).where(eq(userPermissions.userId, testUserId));
    });

    describe('UserPermissions Creation', () => {
        it('should create user permissions with default values', async () => {
            const permissionsData = {
                userId: testUserId,
                permissions: []
            };

            const [permissions] = await db.insert(userPermissions).values(permissionsData).returning();

            expect(permissions).toMatchObject({
                userId: testUserId,
                permissions: [],
                googleAccessToken: null,
                googleRefreshToken: null,
                tokenExpiry: null,
                lastAuthCheck: null
            });
            expect(permissions.id).toBeDefined();
            expect(permissions.createdAt).toBeDefined();
            expect(permissions.updatedAt).toBeDefined();
        });

        it('should create user permissions with OAuth tokens', async () => {
            const permissionsData = {
                userId: testUserId,
                googleAccessToken: 'access-token-123',
                googleRefreshToken: 'refresh-token-456',
                tokenExpiry: new Date('2024-12-20T10:00:00Z'),
                permissions: ['https://www.googleapis.com/auth/tasks']
            };

            const [permissions] = await db.insert(userPermissions).values(permissionsData).returning();

            expect(permissions.googleAccessToken).toBe('access-token-123');
            expect(permissions.googleRefreshToken).toBe('refresh-token-456');
            expect(permissions.tokenExpiry).toEqual(new Date('2024-12-20T10:00:00Z'));
            expect(permissions.permissions).toEqual(['https://www.googleapis.com/auth/tasks']);
        });

        it('should enforce unique user ID', async () => {
            const permissionsData1 = {
                userId: testUserId,
                permissions: []
            };

            const permissionsData2 = {
                userId: testUserId,
                permissions: []
            };

            await db.insert(userPermissions).values(permissionsData1);

            await expect(
                db.insert(userPermissions).values(permissionsData2)
            ).rejects.toThrow();
        });
    });

    describe('OAuth Token Management', () => {
        it('should store access token', async () => {
            const [permissions] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            const accessToken = 'new-access-token-789';
            await db.update(userPermissions)
                .set({
                    googleAccessToken: accessToken,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, permissions.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, permissions.id));

            expect(updatedPermissions.googleAccessToken).toBe(accessToken);
        });

        it('should store refresh token', async () => {
            const [permissions] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            const refreshToken = 'new-refresh-token-101';
            await db.update(userPermissions)
                .set({
                    googleRefreshToken: refreshToken,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, permissions.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, permissions.id));

            expect(updatedPermissions.googleRefreshToken).toBe(refreshToken);
        });

        it('should update both tokens together', async () => {
            const [permissions] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            const accessToken = 'updated-access-token';
            const refreshToken = 'updated-refresh-token';
            const expiry = new Date('2024-12-25T15:00:00Z');

            await db.update(userPermissions)
                .set({
                    googleAccessToken: accessToken,
                    googleRefreshToken: refreshToken,
                    tokenExpiry: expiry,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, permissions.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, permissions.id));

            expect(updatedPermissions.googleAccessToken).toBe(accessToken);
            expect(updatedPermissions.googleRefreshToken).toBe(refreshToken);
            expect(updatedPermissions.tokenExpiry).toEqual(expiry);
        });

        it('should clear tokens on logout', async () => {
            const [permissions] = await db.insert(userPermissions).values({
                userId: testUserId,
                googleAccessToken: 'access-token',
                googleRefreshToken: 'refresh-token',
                tokenExpiry: new Date('2024-12-20T10:00:00Z'),
                permissions: ['https://www.googleapis.com/auth/tasks']
            }).returning();

            // Clear tokens
            await db.update(userPermissions)
                .set({
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    tokenExpiry: null,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, permissions.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, permissions.id));

            expect(updatedPermissions.googleAccessToken).toBeNull();
            expect(updatedPermissions.googleRefreshToken).toBeNull();
            expect(updatedPermissions.tokenExpiry).toBeNull();
        });
    });

    describe('Permission Scopes', () => {
        it('should store Google Tasks permissions', async () => {
            const permissions = [
                'https://www.googleapis.com/auth/tasks',
                'https://www.googleapis.com/auth/tasks.readonly'
            ];

            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions
            }).returning();

            expect(userPerms.permissions).toEqual(permissions);
        });

        it('should store multiple permission scopes', async () => {
            const permissions = [
                'https://www.googleapis.com/auth/tasks',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ];

            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions
            }).returning();

            expect(userPerms.permissions).toEqual(permissions);
            expect(userPerms.permissions).toHaveLength(3);
        });

        it('should update permission scopes', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: ['https://www.googleapis.com/auth/tasks.readonly']
            }).returning();

            const newPermissions = [
                'https://www.googleapis.com/auth/tasks',
                'https://www.googleapis.com/auth/userinfo.email'
            ];

            await db.update(userPermissions)
                .set({
                    permissions: newPermissions,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(updatedPermissions.permissions).toEqual(newPermissions);
        });

        it('should handle empty permissions array', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            expect(userPerms.permissions).toEqual([]);
        });
    });

    describe('Token Expiry Handling', () => {
        it('should store token expiry timestamp', async () => {
            const expiry = new Date('2024-12-20T15:30:00Z');
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                tokenExpiry: expiry,
                permissions: []
            }).returning();

            expect(userPerms.tokenExpiry).toEqual(expiry);
        });

        it('should update token expiry', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                tokenExpiry: new Date('2024-12-20T10:00:00Z'),
                permissions: []
            }).returning();

            const newExpiry = new Date('2024-12-21T10:00:00Z');
            await db.update(userPermissions)
                .set({
                    tokenExpiry: newExpiry,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(updatedPermissions.tokenExpiry).toEqual(newExpiry);
        });

        it('should handle expired tokens', async () => {
            const pastExpiry = new Date('2024-12-01T10:00:00Z');
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                tokenExpiry: pastExpiry,
                permissions: []
            }).returning();

            expect(userPerms.tokenExpiry).toEqual(pastExpiry);
            expect(userPerms.tokenExpiry!.getTime()).toBeLessThan(Date.now());
        });

        it('should handle null expiry for refresh tokens', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                tokenExpiry: null,
                permissions: []
            }).returning();

            expect(userPerms.tokenExpiry).toBeNull();
        });
    });

    describe('Authentication State Tracking', () => {
        it('should track last authentication check', async () => {
            const lastCheck = new Date('2024-12-19T14:30:00Z');
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                lastAuthCheck: lastCheck,
                permissions: []
            }).returning();

            expect(userPerms.lastAuthCheck).toEqual(lastCheck);
        });

        it('should update last authentication check', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                lastAuthCheck: new Date('2024-12-19T10:00:00Z'),
                permissions: []
            }).returning();

            const newCheck = new Date('2024-12-19T16:00:00Z');
            await db.update(userPermissions)
                .set({
                    lastAuthCheck: newCheck,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [updatedPermissions] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(updatedPermissions.lastAuthCheck).toEqual(newCheck);
        });

        it('should handle null last auth check', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                lastAuthCheck: null,
                permissions: []
            }).returning();

            expect(userPerms.lastAuthCheck).toBeNull();
        });

        it('should maintain timestamp consistency', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            expect(userPerms.updatedAt.getTime()).toBeGreaterThanOrEqual(userPerms.createdAt.getTime());
        });
    });

    describe('Complete OAuth Flow', () => {
        it('should handle complete OAuth authorization flow', async () => {
            // Initial state - no tokens
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                permissions: []
            }).returning();

            expect(userPerms.googleAccessToken).toBeNull();
            expect(userPerms.googleRefreshToken).toBeNull();

            // After authorization - store tokens
            const accessToken = 'initial-access-token';
            const refreshToken = 'initial-refresh-token';
            const expiry = new Date(Date.now() + 3600000); // 1 hour from now
            const permissions = ['https://www.googleapis.com/auth/tasks'];

            await db.update(userPermissions)
                .set({
                    googleAccessToken: accessToken,
                    googleRefreshToken: refreshToken,
                    tokenExpiry: expiry,
                    permissions,
                    lastAuthCheck: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [authorizedPerms] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(authorizedPerms.googleAccessToken).toBe(accessToken);
            expect(authorizedPerms.googleRefreshToken).toBe(refreshToken);
            expect(authorizedPerms.tokenExpiry).toEqual(expiry);
            expect(authorizedPerms.permissions).toEqual(permissions);
            expect(authorizedPerms.lastAuthCheck).toBeDefined();

            // Token refresh - update access token
            const newAccessToken = 'refreshed-access-token';
            const newExpiry = new Date(Date.now() + 3600000);

            await db.update(userPermissions)
                .set({
                    googleAccessToken: newAccessToken,
                    tokenExpiry: newExpiry,
                    lastAuthCheck: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [refreshedPerms] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(refreshedPerms.googleAccessToken).toBe(newAccessToken);
            expect(refreshedPerms.googleRefreshToken).toBe(refreshToken); // Refresh token stays same
            expect(refreshedPerms.tokenExpiry).toEqual(newExpiry);
        });

        it('should handle OAuth revocation', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                googleAccessToken: 'access-token',
                googleRefreshToken: 'refresh-token',
                tokenExpiry: new Date('2024-12-20T10:00:00Z'),
                permissions: ['https://www.googleapis.com/auth/tasks'],
                lastAuthCheck: new Date()
            }).returning();

            // Revoke OAuth - clear all tokens and permissions
            await db.update(userPermissions)
                .set({
                    googleAccessToken: null,
                    googleRefreshToken: null,
                    tokenExpiry: null,
                    permissions: [],
                    lastAuthCheck: null,
                    updatedAt: new Date()
                })
                .where(eq(userPermissions.id, userPerms.id));

            const [revokedPerms] = await db.select()
                .from(userPermissions)
                .where(eq(userPermissions.id, userPerms.id));

            expect(revokedPerms.googleAccessToken).toBeNull();
            expect(revokedPerms.googleRefreshToken).toBeNull();
            expect(revokedPerms.tokenExpiry).toBeNull();
            expect(revokedPerms.permissions).toEqual([]);
            expect(revokedPerms.lastAuthCheck).toBeNull();
        });
    });

    describe('Data Integrity', () => {
        it('should handle long token strings', async () => {
            const longToken = 'a'.repeat(1000); // Very long token
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                googleAccessToken: longToken,
                permissions: []
            }).returning();

            expect(userPerms.googleAccessToken).toBe(longToken);
        });

        it('should handle special characters in tokens', async () => {
            const specialToken = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                googleAccessToken: specialToken,
                permissions: []
            }).returning();

            expect(userPerms.googleAccessToken).toBe(specialToken);
        });

        it('should handle empty string tokens', async () => {
            const [userPerms] = await db.insert(userPermissions).values({
                userId: testUserId,
                googleAccessToken: '',
                googleRefreshToken: '',
                permissions: []
            }).returning();

            expect(userPerms.googleAccessToken).toBe('');
            expect(userPerms.googleRefreshToken).toBe('');
        });
    });
});
