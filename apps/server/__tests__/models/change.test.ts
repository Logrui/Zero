import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { changes, tasks } from '../../src/db/schema';

/**
 * Unit Tests: Change Model
 * 
 * Tests the Change model and offline queue management.
 * These tests MUST FAIL initially (TDD approach).
 * 
 * Test Cases:
 * 1. Change creation and validation
 * 2. Offline queue management
 * 3. Retry logic
 * 4. Data integrity
 * 5. Relationship with tasks
 */

describe('Change Model - Unit Tests', () => {
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
        await db.delete(tasks).where(eq(tasks.id, testTaskId));
    });

    describe('Change Creation', () => {
        it('should create change with valid data', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'create' as const,
                data: { title: 'New Task', status: 'needsAction' },
                timestamp: new Date()
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change).toMatchObject({
                taskId: testTaskId,
                operation: 'create',
                data: { title: 'New Task', status: 'needsAction' },
                retryCount: 0
            });
            expect(change.id).toBeDefined();
            expect(change.createdAt).toBeDefined();
        });

        it('should create change with default retry count', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Updated Task' }
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.retryCount).toBe(0);
        });

        it('should create change with custom retry count', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'delete' as const,
                data: { id: testTaskId },
                retryCount: 3
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.retryCount).toBe(3);
        });
    });

    describe('Change Validation', () => {
        it('should reject invalid operation', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'invalid-operation' as any,
                data: { title: 'Test' }
            };

            await expect(
                db.insert(changes).values(changeData)
            ).rejects.toThrow();
        });

        it('should reject empty data', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'update' as const,
                data: {}
            };

            await expect(
                db.insert(changes).values(changeData)
            ).rejects.toThrow();
        });

        it('should require valid task ID', async () => {
            const changeData = {
                taskId: 'invalid-task-id',
                operation: 'create' as const,
                data: { title: 'Test' }
            };

            await expect(
                db.insert(changes).values(changeData)
            ).rejects.toThrow();
        });

        it('should reject negative retry count', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Test' },
                retryCount: -1
            };

            await expect(
                db.insert(changes).values(changeData)
            ).rejects.toThrow();
        });
    });

    describe('Operation Types', () => {
        it('should handle create operation', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'create' as const,
                data: {
                    title: 'New Task',
                    description: 'Task description',
                    status: 'needsAction',
                    priority: 'high'
                }
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.operation).toBe('create');
            expect(change.data).toEqual(changeData.data);
        });

        it('should handle update operation', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'update' as const,
                data: {
                    title: 'Updated Task Title',
                    status: 'completed'
                }
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.operation).toBe('update');
            expect(change.data).toEqual(changeData.data);
        });

        it('should handle delete operation', async () => {
            const changeData = {
                taskId: testTaskId,
                operation: 'delete' as const,
                data: { id: testTaskId }
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.operation).toBe('delete');
            expect(change.data).toEqual(changeData.data);
        });
    });

    describe('Offline Queue Management', () => {
        it('should queue multiple changes for same task', async () => {
            const changesData = [
                {
                    taskId: testTaskId,
                    operation: 'create' as const,
                    data: { title: 'First Change' }
                },
                {
                    taskId: testTaskId,
                    operation: 'update' as const,
                    data: { title: 'Second Change' }
                },
                {
                    taskId: testTaskId,
                    operation: 'delete' as const,
                    data: { id: testTaskId }
                }
            ];

            const createdChanges = await db.insert(changes).values(changesData).returning();

            expect(createdChanges).toHaveLength(3);
            expect(createdChanges[0].operation).toBe('create');
            expect(createdChanges[1].operation).toBe('update');
            expect(createdChanges[2].operation).toBe('delete');
        });

        it('should order changes by timestamp', async () => {
            const now = new Date();
            const changesData = [
                {
                    taskId: testTaskId,
                    operation: 'create' as const,
                    data: { title: 'First' },
                    timestamp: new Date(now.getTime() + 1000)
                },
                {
                    taskId: testTaskId,
                    operation: 'update' as const,
                    data: { title: 'Second' },
                    timestamp: new Date(now.getTime() + 2000)
                },
                {
                    taskId: testTaskId,
                    operation: 'delete' as const,
                    data: { id: testTaskId },
                    timestamp: new Date(now.getTime() + 3000)
                }
            ];

            await db.insert(changes).values(changesData);

            const orderedChanges = await db.select()
                .from(changes)
                .where(eq(changes.taskId, testTaskId))
                .orderBy(changes.timestamp);

            expect(orderedChanges[0].operation).toBe('create');
            expect(orderedChanges[1].operation).toBe('update');
            expect(orderedChanges[2].operation).toBe('delete');
        });

        it('should handle changes for different tasks', async () => {
            // Create another task
            const [task2] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Second Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();

            const changesData = [
                {
                    taskId: testTaskId,
                    operation: 'update' as const,
                    data: { title: 'Updated First Task' }
                },
                {
                    taskId: task2.id,
                    operation: 'update' as const,
                    data: { title: 'Updated Second Task' }
                }
            ];

            const createdChanges = await db.insert(changes).values(changesData).returning();

            expect(createdChanges).toHaveLength(2);
            expect(createdChanges[0].taskId).toBe(testTaskId);
            expect(createdChanges[1].taskId).toBe(task2.id);

            // Clean up
            await db.delete(changes).where(eq(changes.taskId, task2.id));
            await db.delete(tasks).where(eq(tasks.id, task2.id));
        });
    });

    describe('Retry Logic', () => {
        it('should increment retry count', async () => {
            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Test' }
            }).returning();

            const [updatedChange] = await db.update(changes)
                .set({ retryCount: change.retryCount + 1 })
                .where(eq(changes.id, change.id))
                .returning();

            expect(updatedChange.retryCount).toBe(1);
        });

        it('should track multiple retry attempts', async () => {
            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Test' }
            }).returning();

            // Simulate multiple retry attempts
            for (let i = 1; i <= 5; i++) {
                await db.update(changes)
                    .set({ retryCount: i })
                    .where(eq(changes.id, change.id));
            }

            const [finalChange] = await db.select()
                .from(changes)
                .where(eq(changes.id, change.id));

            expect(finalChange.retryCount).toBe(5);
        });

        it('should handle retry count limits', async () => {
            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Test' },
                retryCount: 10 // High retry count
            }).returning();

            expect(change.retryCount).toBe(10);
        });
    });

    describe('Data Integrity', () => {
        it('should store complex data structures', async () => {
            const complexData = {
                title: 'Complex Task',
                description: 'Task with complex data',
                status: 'needsAction',
                priority: 'high',
                labels: ['work', 'urgent'],
                due: new Date().toISOString(),
                metadata: {
                    source: 'google-tasks',
                    syncVersion: 1,
                    customFields: {
                        workspace: 'engineering',
                        assignee: 'john@example.com'
                    }
                }
            };

            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'create' as const,
                data: complexData
            }).returning();

            expect(change.data).toEqual(complexData);
        });

        it('should handle null and undefined values', async () => {
            const dataWithNulls = {
                title: 'Task with nulls',
                description: null,
                status: 'needsAction',
                priority: 'normal',
                labels: [],
                metadata: undefined
            };

            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'update' as const,
                data: dataWithNulls
            }).returning();

            expect(change.data).toEqual(dataWithNulls);
        });

        it('should be deleted when task is deleted', async () => {
            const [change] = await db.insert(changes).values({
                taskId: testTaskId,
                operation: 'delete' as const,
                data: { id: testTaskId }
            }).returning();

            // Delete parent task
            await db.delete(tasks).where(eq(tasks.id, testTaskId));

            // Check change is deleted
            const remainingChanges = await db.select()
                .from(changes)
                .where(eq(changes.id, change.id));

            expect(remainingChanges).toHaveLength(0);
        });
    });

    describe('Queue Processing', () => {
        it('should get changes for specific task', async () => {
            const changesData = [
                {
                    taskId: testTaskId,
                    operation: 'create' as const,
                    data: { title: 'First' }
                },
                {
                    taskId: testTaskId,
                    operation: 'update' as const,
                    data: { title: 'Second' }
                }
            ];

            await db.insert(changes).values(changesData);

            const taskChanges = await db.select()
                .from(changes)
                .where(eq(changes.taskId, testTaskId))
                .orderBy(changes.timestamp);

            expect(taskChanges).toHaveLength(2);
            expect(taskChanges[0].operation).toBe('create');
            expect(taskChanges[1].operation).toBe('update');
        });

        it('should get changes by operation type', async () => {
            const changesData = [
                {
                    taskId: testTaskId,
                    operation: 'create' as const,
                    data: { title: 'Create Change' }
                },
                {
                    taskId: testTaskId,
                    operation: 'update' as const,
                    data: { title: 'Update Change' }
                },
                {
                    taskId: testTaskId,
                    operation: 'create' as const,
                    data: { title: 'Another Create' }
                }
            ];

            await db.insert(changes).values(changesData);

            const createChanges = await db.select()
                .from(changes)
                .where(and(
                    eq(changes.taskId, testTaskId),
                    eq(changes.operation, 'create')
                ));

            expect(createChanges).toHaveLength(2);
            expect(createChanges.every(c => c.operation === 'create')).toBe(true);
        });

        it('should handle bulk change processing', async () => {
            const changesData = Array.from({ length: 10 }, (_, i) => ({
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: `Bulk Change ${i}` }
            }));

            const createdChanges = await db.insert(changes).values(changesData).returning();

            expect(createdChanges).toHaveLength(10);

            // Process all changes
            for (const change of createdChanges) {
                await db.delete(changes).where(eq(changes.id, change.id));
            }

            const remainingChanges = await db.select()
                .from(changes)
                .where(eq(changes.taskId, testTaskId));

            expect(remainingChanges).toHaveLength(0);
        });
    });
});
