import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { changes, subtasks, syncStates, tasks, userPermissions, zeroosTaskExtensions } from '../../src/db/schema';

/**
 * Unit Tests: Task Model
 * 
 * Tests the Task model validation, state transitions, and relationships.
 * These tests MUST FAIL initially (TDD approach).
 * 
 * Test Cases:
 * 1. Task creation with valid data
 * 2. Task validation rules
 * 3. State transitions
 * 4. Relationships with subtasks, extensions, sync states
 * 5. Google Tasks compatibility
 */

describe('Task Model - Unit Tests', () => {
    let testUserId: string;
    let testTaskId: string;

    beforeEach(async () => {
        // Create test user
        testUserId = 'test-user-' + Date.now();

        // Clean up any existing test data
        await cleanupTestData();
    });

    afterEach(async () => {
        await cleanupTestData();
    });

    async function cleanupTestData() {
        if (testTaskId) {
            await db.delete(changes).where(eq(changes.taskId, testTaskId));
            await db.delete(syncStates).where(eq(syncStates.taskId, testTaskId));
            await db.delete(zeroosTaskExtensions).where(eq(zeroosTaskExtensions.taskId, testTaskId));
            await db.delete(subtasks).where(eq(subtasks.taskId, testTaskId));
            await db.delete(tasks).where(eq(tasks.id, testTaskId));
        }
        if (testUserId) {
            await db.delete(userPermissions).where(eq(userPermissions.userId, testUserId));
        }
    }

    describe('Task Creation', () => {
        it('should create task with valid data', async () => {
            const taskData = {
                userId: testUserId,
                title: 'Test Task',
                description: 'Test description',
                status: 'needsAction' as const,
                priority: 'normal' as const,
                labels: ['work', 'urgent']
            };

            const [task] = await db.insert(tasks).values(taskData).returning();
            testTaskId = task.id;

            expect(task).toMatchObject({
                title: taskData.title,
                description: taskData.description,
                status: taskData.status,
                priority: taskData.priority,
                labels: taskData.labels,
                userId: testUserId
            });
            expect(task.id).toBeDefined();
            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
        });

        it('should create task with Google Tasks ID', async () => {
            const taskData = {
                userId: testUserId,
                title: 'Google Task',
                googleTaskId: 'google-task-123',
                status: 'needsAction' as const,
                priority: 'high' as const
            };

            const [task] = await db.insert(tasks).values(taskData).returning();
            testTaskId = task.id;

            expect(task.googleTaskId).toBe('google-task-123');
            expect(task.title).toBe('Google Task');
        });

        it('should create task with due date', async () => {
            const dueDate = new Date('2024-12-25T10:00:00Z');
            const taskData = {
                userId: testUserId,
                title: 'Task with due date',
                due: dueDate,
                status: 'needsAction' as const,
                priority: 'normal' as const
            };

            const [task] = await db.insert(tasks).values(taskData).returning();
            testTaskId = task.id;

            expect(task.due).toEqual(dueDate);
        });
    });

    describe('Task Validation', () => {
        it('should reject empty title', async () => {
            const taskData = {
                userId: testUserId,
                title: '',
                status: 'needsAction' as const,
                priority: 'normal' as const
            };

            await expect(
                db.insert(tasks).values(taskData)
            ).rejects.toThrow();
        });

        it('should reject invalid status', async () => {
            const taskData = {
                userId: testUserId,
                title: 'Test Task',
                status: 'invalid-status' as any,
                priority: 'normal' as const
            };

            await expect(
                db.insert(tasks).values(taskData)
            ).rejects.toThrow();
        });

        it('should reject invalid priority', async () => {
            const taskData = {
                userId: testUserId,
                title: 'Test Task',
                status: 'needsAction' as const,
                priority: 'invalid-priority' as any
            };

            await expect(
                db.insert(tasks).values(taskData)
            ).rejects.toThrow();
        });

        it('should enforce unique Google Tasks ID', async () => {
            const taskData1 = {
                userId: testUserId,
                title: 'First Task',
                googleTaskId: 'duplicate-id',
                status: 'needsAction' as const,
                priority: 'normal' as const
            };

            const taskData2 = {
                userId: testUserId,
                title: 'Second Task',
                googleTaskId: 'duplicate-id',
                status: 'needsAction' as const,
                priority: 'normal' as const
            };

            await db.insert(tasks).values(taskData1);

            await expect(
                db.insert(tasks).values(taskData2)
            ).rejects.toThrow();
        });
    });

    describe('State Transitions', () => {
        it('should transition from needsAction to completed', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Test Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            const [updatedTask] = await db.update(tasks)
                .set({
                    status: 'completed' as const,
                    updatedAt: new Date()
                })
                .where(eq(tasks.id, testTaskId))
                .returning();

            expect(updatedTask.status).toBe('completed');
            expect(updatedTask.updatedAt).not.toEqual(task.updatedAt);
        });

        it('should maintain timestamp consistency', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Test Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(task.createdAt.getTime());
        });
    });

    describe('Relationships', () => {
        it('should create task with subtasks', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Parent Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            const subtaskData = {
                taskId: testTaskId,
                title: 'Subtask 1',
                status: 'needsAction' as const,
                position: 0
            };

            const [subtask] = await db.insert(subtasks).values(subtaskData).returning();

            expect(subtask.taskId).toBe(testTaskId);
            expect(subtask.title).toBe('Subtask 1');
        });

        it('should create task with ZeroOS extension', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Extended Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            const extensionData = {
                taskId: testTaskId,
                workspace: 'work',
                associatedPeople: ['person-1', 'person-2'],
                associatedCompanies: ['company-1'],
                linkedGmailThreads: ['thread-1'],
                internalNotes: 'Internal notes',
                tags: ['important']
            };

            const [extension] = await db.insert(zeroosTaskExtensions).values(extensionData).returning();

            expect(extension.taskId).toBe(testTaskId);
            expect(extension.workspace).toBe('work');
            expect(extension.associatedPeople).toEqual(['person-1', 'person-2']);
        });

        it('should create task with sync state', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Synced Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            const syncStateData = {
                taskId: testTaskId,
                lastSyncTimestamp: new Date(),
                conflictResolution: 'pending' as const,
                retryCount: 0
            };

            const [syncState] = await db.insert(syncStates).values(syncStateData).returning();

            expect(syncState.taskId).toBe(testTaskId);
            expect(syncState.conflictResolution).toBe('pending');
        });

        it('should create task with change queue', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Changed Task',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            const changeData = {
                taskId: testTaskId,
                operation: 'update' as const,
                data: { title: 'Updated Task' },
                timestamp: new Date()
            };

            const [change] = await db.insert(changes).values(changeData).returning();

            expect(change.taskId).toBe(testTaskId);
            expect(change.operation).toBe('update');
            expect(change.data).toEqual({ title: 'Updated Task' });
        });
    });

    describe('Google Tasks Compatibility', () => {
        it('should handle Google Tasks fields correctly', async () => {
            const taskData = {
                userId: testUserId,
                title: 'Google Compatible Task',
                description: 'Description from Google Tasks',
                googleTaskId: 'google-123',
                status: 'needsAction' as const,
                priority: 'high' as const,
                notes: 'Notes from Google Tasks',
                labels: ['google', 'imported']
            };

            const [task] = await db.insert(tasks).values(taskData).returning();
            testTaskId = task.id;

            expect(task.googleTaskId).toBe('google-123');
            expect(task.description).toBe('Description from Google Tasks');
            expect(task.notes).toBe('Notes from Google Tasks');
            expect(task.labels).toEqual(['google', 'imported']);
        });

        it('should support all Google Tasks status values', async () => {
            const statuses = ['needsAction', 'completed'] as const;

            for (const status of statuses) {
                const [task] = await db.insert(tasks).values({
                    userId: testUserId,
                    title: `Task with status ${status}`,
                    status,
                    priority: 'normal' as const
                }).returning();

                expect(task.status).toBe(status);

                // Clean up
                await db.delete(tasks).where(eq(tasks.id, task.id));
            }
        });

        it('should support all Google Tasks priority values', async () => {
            const priorities = ['low', 'normal', 'high'] as const;

            for (const priority of priorities) {
                const [task] = await db.insert(tasks).values({
                    userId: testUserId,
                    title: `Task with priority ${priority}`,
                    status: 'needsAction' as const,
                    priority
                }).returning();

                expect(task.priority).toBe(priority);

                // Clean up
                await db.delete(tasks).where(eq(tasks.id, task.id));
            }
        });
    });

    describe('Data Integrity', () => {
        it('should cascade delete subtasks when task is deleted', async () => {
            const [task] = await db.insert(tasks).values({
                userId: testUserId,
                title: 'Task to delete',
                status: 'needsAction' as const,
                priority: 'normal' as const
            }).returning();
            testTaskId = task.id;

            // Create subtask
            await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Subtask',
                status: 'needsAction' as const,
                position: 0
            });

            // Delete task
            await db.delete(tasks).where(eq(tasks.id, testTaskId));

            // Check subtask is deleted
            const remainingSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, testTaskId));
            expect(remainingSubtasks).toHaveLength(0);
        });

        it('should maintain referential integrity', async () => {
            const invalidTaskId = 'invalid-task-id';

            await expect(
                db.insert(subtasks).values({
                    taskId: invalidTaskId,
                    title: 'Invalid subtask',
                    status: 'needsAction' as const,
                    position: 0
                })
            ).rejects.toThrow();
        });
    });
});
