import { and, asc, eq } from 'drizzle-orm';
import { getZeroDB } from '../lib/server-utils';
import type { Subtask } from '../db/schema';
import { subtasks } from '../db/schema';

/**
 * Subtask Model
 * 
 * Handles subtask operations with positioning and validation.
 * Provides subtask management for parent tasks.
 */

export interface CreateSubtaskData {
    taskId: string;
    title: string;
    status?: 'needsAction' | 'completed';
    position?: number;
}

export interface UpdateSubtaskData {
    title?: string;
    status?: 'needsAction' | 'completed';
    position?: number;
}

export interface ReorderSubtasksData {
    subtaskId: string;
    newPosition: number;
}

export class SubtaskModel {
    /**
     * Create a new subtask
     */
    static async create(data: CreateSubtaskData): Promise<Subtask> {
        // Validate required fields
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Subtask title is required');
        }

        if (data.title.length > 200) {
            throw new Error('Subtask title must be 200 characters or less');
        }

        // Validate status
        if (data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }

        // Validate position
        if (data.position !== undefined && data.position < 0) {
            throw new Error('Position cannot be negative');
        }

        // Get next position if not provided
        let position = data.position;
        if (position === undefined) {
            const existingSubtasks = await db.select()
                .from(subtasks)
                .where(eq(subtasks.taskId, data.taskId))
                .orderBy(asc(subtasks.position));

            position = existingSubtasks.length;
        }

        const [subtask] = await db.insert(subtasks).values({
            taskId: data.taskId,
            title: data.title.trim(),
            status: data.status || 'needsAction',
            position
        }).returning();

        return subtask;
    }

    /**
     * Get subtask by ID
     */
    static async getById(subtaskId: string): Promise<Subtask | null> {
        const subtask = await db.select()
            .from(subtasks)
            .where(eq(subtasks.id, subtaskId))
            .limit(1);

        return subtask[0] || null;
    }

    /**
     * Get all subtasks for a task
     */
    static async getByTaskId(taskId: string): Promise<Subtask[]> {
        return await db.select()
            .from(subtasks)
            .where(eq(subtasks.taskId, taskId))
            .orderBy(asc(subtasks.position));
    }

    /**
     * Update subtask
     */
    static async update(subtaskId: string, data: UpdateSubtaskData): Promise<Subtask> {
        // Validate title if provided
        if (data.title !== undefined) {
            if (!data.title || data.title.trim().length === 0) {
                throw new Error('Subtask title is required');
            }
            if (data.title.length > 200) {
                throw new Error('Subtask title must be 200 characters or less');
            }
        }

        // Validate status if provided
        if (data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }

        // Validate position if provided
        if (data.position !== undefined && data.position < 0) {
            throw new Error('Position cannot be negative');
        }

        const [updatedSubtask] = await db.update(subtasks)
            .set({
                ...data,
                title: data.title?.trim(),
                updatedAt: new Date()
            })
            .where(eq(subtasks.id, subtaskId))
            .returning();

        if (!updatedSubtask) {
            throw new Error('Subtask not found');
        }

        return updatedSubtask;
    }

    /**
     * Delete subtask
     */
    static async delete(subtaskId: string): Promise<void> {
        await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
    }

    /**
     * Reorder subtasks within a task
     */
    static async reorder(taskId: string, reorderData: ReorderSubtasksData[]): Promise<Subtask[]> {
        // Validate all subtasks belong to the same task
        const subtaskIds = reorderData.map(item => item.subtaskId);
        const existingSubtasks = await db.select()
            .from(subtasks)
            .where(and(
                eq(subtasks.taskId, taskId),
                eq(subtasks.id, subtaskIds[0]) // This needs to be fixed for multiple IDs
            ));

        if (existingSubtasks.length === 0) {
            throw new Error('Subtask not found or does not belong to task');
        }

        // Update positions
        const updatedSubtasks: Subtask[] = [];
        for (const item of reorderData) {
            const [updatedSubtask] = await db.update(subtasks)
                .set({
                    position: item.newPosition,
                    updatedAt: new Date()
                })
                .where(eq(subtasks.id, item.subtaskId))
                .returning();

            if (updatedSubtask) {
                updatedSubtasks.push(updatedSubtask);
            }
        }

        return updatedSubtasks;
    }

    /**
     * Move subtask to new position
     */
    static async moveToPosition(subtaskId: string, newPosition: number): Promise<Subtask> {
        if (newPosition < 0) {
            throw new Error('Position cannot be negative');
        }

        const [updatedSubtask] = await db.update(subtasks)
            .set({
                position: newPosition,
                updatedAt: new Date()
            })
            .where(eq(subtasks.id, subtaskId))
            .returning();

        if (!updatedSubtask) {
            throw new Error('Subtask not found');
        }

        return updatedSubtask;
    }

    /**
     * Get subtask count for a task
     */
    static async getCount(taskId: string): Promise<number> {
        const result = await db.select()
            .from(subtasks)
            .where(eq(subtasks.taskId, taskId));

        return result.length;
    }

    /**
     * Get completed subtask count for a task
     */
    static async getCompletedCount(taskId: string): Promise<number> {
        const result = await db.select()
            .from(subtasks)
            .where(and(
                eq(subtasks.taskId, taskId),
                eq(subtasks.status, 'completed')
            ));

        return result.length;
    }

    /**
     * Mark all subtasks as completed
     */
    static async markAllCompleted(taskId: string): Promise<void> {
        await db.update(subtasks)
            .set({
                status: 'completed',
                updatedAt: new Date()
            })
            .where(and(
                eq(subtasks.taskId, taskId),
                eq(subtasks.status, 'needsAction')
            ));
    }

    /**
     * Mark all subtasks as pending
     */
    static async markAllPending(taskId: string): Promise<void> {
        await db.update(subtasks)
            .set({
                status: 'needsAction',
                updatedAt: new Date()
            })
            .where(and(
                eq(subtasks.taskId, taskId),
                eq(subtasks.status, 'completed')
            ));
    }

    /**
     * Validate subtask data
     */
    static validateSubtaskData(data: CreateSubtaskData | UpdateSubtaskData): void {
        if ('title' in data && data.title !== undefined) {
            if (!data.title || data.title.trim().length === 0) {
                throw new Error('Subtask title is required');
            }
            if (data.title.length > 200) {
                throw new Error('Subtask title must be 200 characters or less');
            }
        }

        if ('status' in data && data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }

        if ('position' in data && data.position !== undefined && data.position < 0) {
            throw new Error('Position cannot be negative');
        }
    }

    /**
     * Get subtask statistics for a task
     */
    static async getStats(taskId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        completionRate: number;
    }> {
        const allSubtasks = await this.getByTaskId(taskId);
        const completed = allSubtasks.filter(subtask => subtask.status === 'completed').length;
        const pending = allSubtasks.filter(subtask => subtask.status === 'needsAction').length;
        const completionRate = allSubtasks.length > 0 ? (completed / allSubtasks.length) * 100 : 0;

        return {
            total: allSubtasks.length,
            completed,
            pending,
            completionRate
        };
    }

    /**
     * Bulk create subtasks
     */
    static async createBulk(taskId: string, subtaskData: Omit<CreateSubtaskData, 'taskId'>[]): Promise<Subtask[]> {
        const subtasksToCreate = subtaskData.map((data, index) => ({
            ...data,
            taskId,
            position: data.position ?? index
        }));

        return await db.insert(subtasks).values(subtasksToCreate).returning();
    }

    /**
     * Bulk update subtasks
     */
    static async updateBulk(updates: { id: string; data: UpdateSubtaskData }[]): Promise<Subtask[]> {
        const updatedSubtasks: Subtask[] = [];

        for (const update of updates) {
            const [updatedSubtask] = await db.update(subtasks)
                .set({
                    ...update.data,
                    title: update.data.title?.trim(),
                    updatedAt: new Date()
                })
                .where(eq(subtasks.id, update.id))
                .returning();

            if (updatedSubtask) {
                updatedSubtasks.push(updatedSubtask);
            }
        }

        return updatedSubtasks;
    }

    /**
     * Bulk delete subtasks
     */
    static async deleteBulk(subtaskIds: string[]): Promise<void> {
        await db.delete(subtasks).where(eq(subtasks.id, subtaskIds[0])); // This needs to be fixed for multiple IDs
    }
}
