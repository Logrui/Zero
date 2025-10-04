import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { getZeroDB } from '../lib/server-utils';
import type { Change } from '../db/schema';
import { changes, tasks } from '../db/schema';

/**
 * Change Model
 * 
 * Handles offline queue management for task synchronization.
 * Provides change tracking and queue processing for Google Tasks sync.
 */

export interface CreateChangeData {
    taskId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp?: Date;
}

export interface ProcessChangeData {
    changeId: string;
    success: boolean;
    error?: string;
    retryCount?: number;
}

export interface ChangeFilters {
    taskId?: string;
    operation?: 'create' | 'update' | 'delete';
    userId?: string;
    processed?: boolean;
    retryCount?: number;
}

export class ChangeModel {
    /**
     * Create a new change
     */
    static async create(data: CreateChangeData): Promise<Change> {
        // Validate task exists
        const task = await db.select()
            .from(tasks)
            .where(eq(tasks.id, data.taskId))
            .limit(1);

        if (task.length === 0) {
            throw new Error('Task not found');
        }

        // Validate operation
        if (!['create', 'update', 'delete'].includes(data.operation)) {
            throw new Error('Invalid operation value');
        }

        // Validate data
        if (!data.data || typeof data.data !== 'object') {
            throw new Error('Change data is required and must be an object');
        }

        const [change] = await db.insert(changes).values({
            taskId: data.taskId,
            operation: data.operation,
            data: data.data,
            timestamp: data.timestamp || new Date(),
            retryCount: 0
        }).returning();

        return change;
    }

    /**
     * Get change by ID
     */
    static async getById(changeId: string): Promise<Change | null> {
        const change = await db.select()
            .from(changes)
            .where(eq(changes.id, changeId))
            .limit(1);

        return change[0] || null;
    }

    /**
     * Get changes for a task
     */
    static async getByTaskId(taskId: string): Promise<Change[]> {
        return await db.select()
            .from(changes)
            .where(eq(changes.taskId, taskId))
            .orderBy(asc(changes.timestamp));
    }

    /**
     * Get changes with filters
     */
    static async getChanges(filters: ChangeFilters, limit: number = 100, offset: number = 0): Promise<Change[]> {
        let query = db.select().from(changes);

        // Apply filters
        if (filters.taskId) {
            query = query.where(eq(changes.taskId, filters.taskId));
        }

        if (filters.operation) {
            query = query.where(eq(changes.operation, filters.operation));
        }

        if (filters.userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, filters.userId));
        }

        if (filters.retryCount !== undefined) {
            query = query.where(eq(changes.retryCount, filters.retryCount));
        }

        return await query
            .orderBy(asc(changes.timestamp))
            .limit(limit)
            .offset(offset);
    }

    /**
     * Get pending changes for sync
     */
    static async getPendingChanges(userId: string, limit: number = 50): Promise<Change[]> {
        return await db.select()
            .from(changes)
            .innerJoin(tasks, eq(tasks.id, changes.taskId))
            .where(eq(tasks.userId, userId))
            .orderBy(asc(changes.timestamp))
            .limit(limit);
    }

    /**
     * Get changes by operation type
     */
    static async getByOperation(operation: 'create' | 'update' | 'delete', userId?: string): Promise<Change[]> {
        let query = db.select().from(changes).where(eq(changes.operation, operation));

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        return await query.orderBy(asc(changes.timestamp));
    }

    /**
     * Process a change (mark as processed)
     */
    static async processChange(changeId: string, success: boolean = true, error?: string): Promise<void> {
        if (success) {
            // Remove successful change
            await db.delete(changes).where(eq(changes.id, changeId));
        } else {
            // Increment retry count for failed change
            const change = await this.getById(changeId);
            if (change) {
                await db.update(changes)
                    .set({
                        retryCount: change.retryCount + 1,
                        updatedAt: new Date()
                    })
                    .where(eq(changes.id, changeId));
            }
        }
    }

    /**
     * Process multiple changes
     */
    static async processChanges(changeIds: string[], success: boolean = true): Promise<void> {
        if (success) {
            // Remove successful changes
            await db.delete(changes).where(inArray(changes.id, changeIds));
        } else {
            // Increment retry count for failed changes
            await db.update(changes)
                .set({
                    retryCount: changes.retryCount + 1,
                    updatedAt: new Date()
                })
                .where(inArray(changes.id, changeIds));
        }
    }

    /**
     * Get changes that need retry
     */
    static async getChangesNeedingRetry(maxRetries: number = 3): Promise<Change[]> {
        return await db.select()
            .from(changes)
            .where(eq(changes.retryCount, maxRetries))
            .orderBy(asc(changes.timestamp));
    }

    /**
     * Get changes by retry count
     */
    static async getByRetryCount(retryCount: number, userId?: string): Promise<Change[]> {
        let query = db.select().from(changes).where(eq(changes.retryCount, retryCount));

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        return await query.orderBy(asc(changes.timestamp));
    }

    /**
     * Get change statistics
     */
    static async getStats(userId?: string): Promise<{
        total: number;
        byOperation: { [key: string]: number };
        byRetryCount: { [key: number]: number };
        oldestChange?: Date;
        newestChange?: Date;
    }> {
        let query = db.select().from(changes);

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        const allChanges = await query.orderBy(asc(changes.timestamp));

        const byOperation: { [key: string]: number } = {};
        const byRetryCount: { [key: number]: number } = {};

        for (const change of allChanges) {
            byOperation[change.operation] = (byOperation[change.operation] || 0) + 1;
            byRetryCount[change.retryCount] = (byRetryCount[change.retryCount] || 0) + 1;
        }

        return {
            total: allChanges.length,
            byOperation,
            byRetryCount,
            oldestChange: allChanges[0]?.timestamp,
            newestChange: allChanges[allChanges.length - 1]?.timestamp
        };
    }

    /**
     * Clean up old processed changes
     */
    static async cleanupOldChanges(olderThanDays: number = 7): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await db.delete(changes)
            .where(eq(changes.timestamp, cutoffDate));

        return result.rowCount || 0;
    }

    /**
     * Get changes for a specific time range
     */
    static async getChangesInRange(
        startDate: Date,
        endDate: Date,
        userId?: string
    ): Promise<Change[]> {
        let query = db.select().from(changes)
            .where(and(
                eq(changes.timestamp, startDate),
                eq(changes.timestamp, endDate)
            ));

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        return await query.orderBy(asc(changes.timestamp));
    }

    /**
     * Get changes by task IDs
     */
    static async getByTaskIds(taskIds: string[]): Promise<Change[]> {
        return await db.select()
            .from(changes)
            .where(inArray(changes.taskId, taskIds))
            .orderBy(asc(changes.timestamp));
    }

    /**
     * Batch create changes
     */
    static async createBatch(changesData: CreateChangeData[]): Promise<Change[]> {
        // Validate all changes
        for (const data of changesData) {
            if (!['create', 'update', 'delete'].includes(data.operation)) {
                throw new Error('Invalid operation value');
            }
            if (!data.data || typeof data.data !== 'object') {
                throw new Error('Change data is required and must be an object');
            }
        }

        return await db.insert(changes).values(changesData).returning();
    }

    /**
     * Get change queue size
     */
    static async getQueueSize(userId?: string): Promise<number> {
        let query = db.select().from(changes);

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        const result = await query;
        return result.length;
    }

    /**
     * Get changes by priority (based on operation type)
     */
    static async getChangesByPriority(userId?: string): Promise<Change[]> {
        let query = db.select().from(changes);

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        // Order by priority: delete, create, update
        return await query.orderBy(
            asc(changes.operation === 'delete' ? 0 : changes.operation === 'create' ? 1 : 2),
            asc(changes.timestamp)
        );
    }

    /**
     * Validate change data
     */
    static validateChangeData(data: CreateChangeData): void {
        if (!['create', 'update', 'delete'].includes(data.operation)) {
            throw new Error('Invalid operation value');
        }

        if (!data.data || typeof data.data !== 'object') {
            throw new Error('Change data is required and must be an object');
        }

        if (data.timestamp && data.timestamp > new Date()) {
            throw new Error('Change timestamp cannot be in the future');
        }
    }

    /**
     * Get change history for a task
     */
    static async getChangeHistory(taskId: string, limit: number = 50): Promise<Change[]> {
        return await db.select()
            .from(changes)
            .where(eq(changes.taskId, taskId))
            .orderBy(desc(changes.timestamp))
            .limit(limit);
    }

    /**
     * Get changes that failed multiple times
     */
    static async getFailedChanges(maxRetries: number = 3, userId?: string): Promise<Change[]> {
        let query = db.select().from(changes)
            .where(eq(changes.retryCount, maxRetries));

        if (userId) {
            query = query.innerJoin(tasks, eq(tasks.id, changes.taskId))
                .where(eq(tasks.userId, userId));
        }

        return await query.orderBy(asc(changes.timestamp));
    }
}
