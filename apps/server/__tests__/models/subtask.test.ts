import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/db';
import { subtasks, tasks } from '../../src/db/schema';

/**
 * Unit Tests: Subtask Model
 * 
 * Tests the Subtask model validation and positioning.
 * These tests MUST FAIL initially (TDD approach).
 * 
 * Test Cases:
 * 1. Subtask creation with valid data
 * 2. Subtask validation rules
 * 3. Position management
 * 4. Status transitions
 * 5. Relationship with parent task
 */

describe('Subtask Model - Unit Tests', () => {
    let testUserId: string;
    let testTaskId: string;

    beforeEach(async () => {
        // Create test user and parent task
        testUserId = 'test-user-' + Date.now();

        const [task] = await db.insert(tasks).values({
            userId: testUserId,
            title: 'Parent Task',
            status: 'needsAction' as const,
            priority: 'normal' as const
        }).returning();
        testTaskId = task.id;
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(subtasks).where(eq(subtasks.taskId, testTaskId));
        await db.delete(tasks).where(eq(tasks.id, testTaskId));
    });

    describe('Subtask Creation', () => {
        it('should create subtask with valid data', async () => {
            const subtaskData = {
                taskId: testTaskId,
                title: 'Test Subtask',
                status: 'needsAction' as const,
                position: 0
            };

            const [subtask] = await db.insert(subtasks).values(subtaskData).returning();

            expect(subtask).toMatchObject({
                title: subtaskData.title,
                status: subtaskData.status,
                position: subtaskData.position,
                taskId: testTaskId
            });
            expect(subtask.id).toBeDefined();
            expect(subtask.createdAt).toBeDefined();
            expect(subtask.updatedAt).toBeDefined();
        });

        it('should create subtask with default values', async () => {
            const subtaskData = {
                taskId: testTaskId,
                title: 'Default Subtask'
            };

            const [subtask] = await db.insert(subtasks).values(subtaskData).returning();

            expect(subtask.status).toBe('needsAction');
            expect(subtask.position).toBe(0);
        });

        it('should create multiple subtasks with different positions', async () => {
            const subtask1 = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'First Subtask',
                position: 0
            }).returning();

            const subtask2 = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Second Subtask',
                position: 1
            }).returning();

            expect(subtask1[0].position).toBe(0);
            expect(subtask2[0].position).toBe(1);
        });
    });

    describe('Subtask Validation', () => {
        it('should reject empty title', async () => {
            const subtaskData = {
                taskId: testTaskId,
                title: '',
                status: 'needsAction' as const,
                position: 0
            };

            await expect(
                db.insert(subtasks).values(subtaskData)
            ).rejects.toThrow();
        });

        it('should reject invalid status', async () => {
            const subtaskData = {
                taskId: testTaskId,
                title: 'Test Subtask',
                status: 'invalid-status' as any,
                position: 0
            };

            await expect(
                db.insert(subtasks).values(subtaskData)
            ).rejects.toThrow();
        });

        it('should reject negative position', async () => {
            const subtaskData = {
                taskId: testTaskId,
                title: 'Test Subtask',
                status: 'needsAction' as const,
                position: -1
            };

            await expect(
                db.insert(subtasks).values(subtaskData)
            ).rejects.toThrow();
        });

        it('should require valid task ID', async () => {
            const subtaskData = {
                taskId: 'invalid-task-id',
                title: 'Test Subtask',
                status: 'needsAction' as const,
                position: 0
            };

            await expect(
                db.insert(subtasks).values(subtaskData)
            ).rejects.toThrow();
        });
    });

    describe('Position Management', () => {
        it('should allow reordering subtasks', async () => {
            // Create multiple subtasks
            const [subtask1] = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'First Subtask',
                position: 0
            }).returning();

            const [subtask2] = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Second Subtask',
                position: 1
            }).returning();

            // Reorder: move second to first position
            await db.update(subtasks)
                .set({ position: 0, updatedAt: new Date() })
                .where(eq(subtasks.id, subtask2.id));

            await db.update(subtasks)
                .set({ position: 1, updatedAt: new Date() })
                .where(eq(subtasks.id, subtask1.id));

            // Verify new order
            const updatedSubtasks = await db.select()
                .from(subtasks)
                .where(eq(subtasks.taskId, testTaskId))
                .orderBy(subtasks.position);

            expect(updatedSubtasks[0].title).toBe('Second Subtask');
            expect(updatedSubtasks[1].title).toBe('First Subtask');
        });

        it('should handle duplicate positions gracefully', async () => {
            // Create subtasks with same position
            await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Subtask A',
                position: 0
            });

            await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Subtask B',
                position: 0
            });

            // Both should be created successfully
            const allSubtasks = await db.select()
                .from(subtasks)
                .where(eq(subtasks.taskId, testTaskId));

            expect(allSubtasks).toHaveLength(2);
        });
    });

    describe('Status Transitions', () => {
        it('should transition from needsAction to completed', async () => {
            const [subtask] = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Test Subtask',
                status: 'needsAction' as const,
                position: 0
            }).returning();

            const [updatedSubtask] = await db.update(subtasks)
                .set({
                    status: 'completed' as const,
                    updatedAt: new Date()
                })
                .where(eq(subtasks.id, subtask.id))
                .returning();

            expect(updatedSubtask.status).toBe('completed');
            expect(updatedSubtask.updatedAt).not.toEqual(subtask.updatedAt);
        });

        it('should maintain timestamp consistency', async () => {
            const [subtask] = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Test Subtask',
                status: 'needsAction' as const,
                position: 0
            }).returning();

            expect(subtask.updatedAt.getTime()).toBeGreaterThanOrEqual(subtask.createdAt.getTime());
        });
    });

    describe('Relationship with Parent Task', () => {
        it('should be deleted when parent task is deleted', async () => {
            const [subtask] = await db.insert(subtasks).values({
                taskId: testTaskId,
                title: 'Orphaned Subtask',
                status: 'needsAction' as const,
                position: 0
            }).returning();

            // Delete parent task
            await db.delete(tasks).where(eq(tasks.id, testTaskId));

            // Check subtask is deleted
            const remainingSubtasks = await db.select()
                .from(subtasks)
                .where(eq(subtasks.id, subtask.id));

            expect(remainingSubtasks).toHaveLength(0);
        });

        it('should maintain referential integrity', async () => {
            const invalidTaskId = 'invalid-task-id';

            await expect(
                db.insert(subtasks).values({
                    taskId: invalidTaskId,
                    title: 'Invalid Subtask',
                    status: 'needsAction' as const,
                    position: 0
                })
            ).rejects.toThrow();
        });
    });

    describe('Bulk Operations', () => {
        it('should create multiple subtasks efficiently', async () => {
            const subtaskData = [
                { taskId: testTaskId, title: 'Subtask 1', position: 0 },
                { taskId: testTaskId, title: 'Subtask 2', position: 1 },
                { taskId: testTaskId, title: 'Subtask 3', position: 2 }
            ];

            const createdSubtasks = await db.insert(subtasks).values(subtaskData).returning();

            expect(createdSubtasks).toHaveLength(3);
            expect(createdSubtasks[0].position).toBe(0);
            expect(createdSubtasks[1].position).toBe(1);
            expect(createdSubtasks[2].position).toBe(2);
        });

        it('should update multiple subtasks efficiently', async () => {
            // Create subtasks
            const subtaskData = [
                { taskId: testTaskId, title: 'Subtask 1', position: 0 },
                { taskId: testTaskId, title: 'Subtask 2', position: 1 }
            ];

            const createdSubtasks = await db.insert(subtasks).values(subtaskData).returning();

            // Update all to completed
            for (const subtask of createdSubtasks) {
                await db.update(subtasks)
                    .set({
                        status: 'completed' as const,
                        updatedAt: new Date()
                    })
                    .where(eq(subtasks.id, subtask.id));
            }

            // Verify all are completed
            const updatedSubtasks = await db.select()
                .from(subtasks)
                .where(eq(subtasks.taskId, testTaskId));

            expect(updatedSubtasks.every(s => s.status === 'completed')).toBe(true);
        });
    });
});
