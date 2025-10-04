import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { changes, syncStates, tasks } from '../../src/db/schema';

/**
 * Unit Tests: SyncState Model
 * 
 * Tests the SyncState model and conflict resolution logic.
 * These tests MUST FAIL initially (TDD approach).
 * 
 * Test Cases:
 * 1. SyncState creation and management
 * 2. Conflict resolution strategies
 * 3. Retry logic and error handling
 * 4. Timestamp tracking
 * 5. Relationship with tasks and changes
 */

describe('SyncState Model - Unit Tests', () => {
    let testUserId: string;
    let testTaskId: string;

    beforeEach(async () => {
        // Create test user and task
        testUserId = 'test-user-' + Date.now();

        const [task] = await db.insert(tasks).values({
            userId: testUserId,
            title: 'Test Task',
            status: 'needsAction' as const,
            priority: 'normal' as const
        }).returning();
        testTaskId = task.id;
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(changes).where(eq(changes.taskId, testTaskId));
        await db.delete(syncStates).where(eq(syncStates.taskId, testTaskId));
        await db.delete(tasks).where(eq(tasks.id, testTaskId));
    });

    describe('SyncState Creation', () => {
        it('should create sync state with default values', async () => {
            const syncStateData = {
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState).toMatchObject({
                taskId: testTaskId,
                conflictResolution: 'pending',
                retryCount: 0,
                lastError: null,
                lastSyncTimestamp: null
            });
            expect(syncState.id).toBeDefined();
            expect(syncState.createdAt).toBeDefined();
            expect(syncState.updatedAt).toBeDefined();
        });

        it('should create sync state with last sync timestamp', async () => {
            const lastSync = new Date('2024-12-19T10:00:00Z');
            const syncStateData = {
                taskId: testTaskId,
                lastSyncTimestamp: lastSync,
                conflictResolution: 'pending' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.lastSyncTimestamp).toEqual(lastSync);
        });

        it('should create sync state with error information', async () => {
            const syncStateData = {
                taskId: testTaskId,
                lastError: 'API rate limit exceeded',
                retryCount: 3,
                conflictResolution: 'pending' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.lastError).toBe('API rate limit exceeded');
            expect(syncState.retryCount).toBe(3);
        });
    });

    describe('Conflict Resolution', () => {
        it('should handle local resolution strategy', async () => {
            const syncStateData = {
                taskId: testTaskId,
                conflictResolution: 'local' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.conflictResolution).toBe('local');
        });

        it('should handle remote resolution strategy', async () => {
            const syncStateData = {
                taskId: testTaskId,
                conflictResolution: 'remote' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.conflictResolution).toBe('remote');
        });

        it('should handle pending resolution strategy', async () => {
            const syncStateData = {
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.conflictResolution).toBe('pending');
        });

        it('should reject invalid conflict resolution', async () => {
            const syncStateData = {
                taskId: testTaskId,
                conflictResolution: 'invalid-resolution' as any
            };

            await expect(
                db.insert(syncStates).values(syncStateData)
            ).rejects.toThrow();
        });
    });

    describe('Retry Logic', () => {
        it('should increment retry count', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            const [updatedSyncState] = await db.update(syncStates)
                .set({
                    retryCount: syncState.retryCount + 1,
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id))
                .returning();

            expect(updatedSyncState.retryCount).toBe(1);
        });

        it('should track retry attempts with timestamps', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            const retryTime = new Date();
            const [updatedSyncState] = await db.update(syncStates)
                .set({
                    retryCount: 1,
                    lastSyncTimestamp: retryTime,
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id))
                .returning();

            expect(updatedSyncState.retryCount).toBe(1);
            expect(updatedSyncState.lastSyncTimestamp).toEqual(retryTime);
        });

        it('should handle multiple retry attempts', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            // Simulate multiple retry attempts
            for (let i = 1; i <= 5; i++) {
                await db.update(syncStates)
                    .set({
                        retryCount: i,
                        lastError: `Attempt ${i} failed`,
                        updatedAt: new Date()
                    })
                    .where(eq(syncStates.id, syncState.id));
            }

            const [finalSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(finalSyncState.retryCount).toBe(5);
            expect(finalSyncState.lastError).toBe('Attempt 5 failed');
        });
    });

    describe('Error Handling', () => {
        it('should store error messages', async () => {
            const errorMessage = 'Google Tasks API returned 401 Unauthorized';
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                lastError: errorMessage,
                conflictResolution: 'pending' as const
            }).returning();

            expect(syncState.lastError).toBe(errorMessage);
        });

        it('should update error messages on retry', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                lastError: 'Initial error',
                conflictResolution: 'pending' as const
            }).returning();

            const newError = 'Retry failed with different error';
            await db.update(syncStates)
                .set({
                    lastError: newError,
                    retryCount: 1,
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id));

            const [updatedSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(updatedSyncState.lastError).toBe(newError);
        });

        it('should clear error on successful sync', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                lastError: 'Previous error',
                retryCount: 3,
                conflictResolution: 'pending' as const
            }).returning();

            // Simulate successful sync
            await db.update(syncStates)
                .set({
                    lastError: null,
                    retryCount: 0,
                    lastSyncTimestamp: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id));

            const [updatedSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(updatedSyncState.lastError).toBeNull();
            expect(updatedSyncState.retryCount).toBe(0);
            expect(updatedSyncState.lastSyncTimestamp).toBeDefined();
        });
    });

    describe('Timestamp Tracking', () => {
        it('should track last sync timestamp', async () => {
            const syncTime = new Date('2024-12-19T15:30:00Z');
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                lastSyncTimestamp: syncTime,
                conflictResolution: 'pending' as const
            }).returning();

            expect(syncState.lastSyncTimestamp).toEqual(syncTime);
        });

        it('should update sync timestamp on successful sync', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            const newSyncTime = new Date();
            await db.update(syncStates)
                .set({
                    lastSyncTimestamp: newSyncTime,
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id));

            const [updatedSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(updatedSyncState.lastSyncTimestamp).toEqual(newSyncTime);
        });

        it('should maintain timestamp consistency', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            expect(syncState.updatedAt.getTime()).toBeGreaterThanOrEqual(syncState.createdAt.getTime());
        });
    });

    describe('Relationship with Tasks and Changes', () => {
        it('should be deleted when task is deleted', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            // Delete parent task
            await db.delete(tasks).where(eq(tasks.id, testTaskId));

            // Check sync state is deleted
            const remainingSyncStates = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(remainingSyncStates).toHaveLength(0);
        });

        it('should maintain referential integrity', async () => {
            const invalidTaskId = 'invalid-task-id';

            await expect(
                db.insert(syncStates).values({
                    taskId: invalidTaskId,
                    conflictResolution: 'pending' as const
                })
            ).rejects.toThrow();
        });

        it('should work with change queue', async () => {
            // Create sync state
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            // Create change
            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Updated Task' },
                timestamp: new Date()
            }).returning();

            expect(syncState.taskId).toBe(testTaskId);
            expect(change.taskId).toBe(testTaskId);
        });
    });

    describe('Sync State Transitions', () => {
        it('should transition from pending to resolved', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            // Resolve conflict by choosing local
            await db.update(syncStates)
                .set({
                    conflictResolution: 'local' as const,
                    lastSyncTimestamp: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(syncStates.id, syncState.id));

            const [updatedSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(updatedSyncState.conflictResolution).toBe('local');
            expect(updatedSyncState.lastSyncTimestamp).toBeDefined();
        });

        it('should handle multiple conflict resolutions', async () => {
            const [syncState] = await db.insert(syncStates).values({
                taskId: testTaskId,
                conflictResolution: 'pending' as const
            }).returning();

            // First resolution attempt
            await db.update(syncStates)
                .set({ conflictResolution: 'local' as const })
                .where(eq(syncStates.id, syncState.id));

            // Second resolution attempt
            await db.update(syncStates)
                .set({ conflictResolution: 'remote' as const })
                .where(eq(syncStates.id, syncState.id));

            const [finalSyncState] = await db.select()
                .from(syncStates)
                .where(eq(syncStates.id, syncState.id));

            expect(finalSyncState.conflictResolution).toBe('remote');
        });
    });
});
