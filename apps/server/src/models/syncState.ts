import { and, asc, desc, eq } from 'drizzle-orm';
import type { SyncState } from '../db/schema';
import { syncStates, tasks } from '../db/schema';

/**
 * SyncState Model
 * 
 * Handles synchronization state management with conflict resolution and retry logic.
 * Provides sync state tracking for tasks and Google Tasks integration.
 */

export interface CreateSyncStateData {
    taskId: string;
    lastSyncTimestamp?: Date;
    conflictResolution?: 'local' | 'remote' | 'pending';
    retryCount?: number;
    lastError?: string;
}

export interface UpdateSyncStateData {
    lastSyncTimestamp?: Date;
    conflictResolution?: 'local' | 'remote' | 'pending';
    retryCount?: number;
    lastError?: string;
}

export interface SyncConflictData {
    localVersion: any;
    remoteVersion: any;
    conflictFields: string[];
    lastModified: Date;
}

export type ConflictResolutionStrategy = 'local' | 'remote' | 'merge' | 'user-choice';

export class SyncStateModel {
    /**
     * Create a new sync state
     */
    static async create(data: CreateSyncStateData): Promise<SyncState> {
        // Validate task exists
        const task = await db.select()
            .from(tasks)
            .where(eq(tasks.id, data.taskId))
            .limit(1);

        if (task.length === 0) {
            throw new Error('Task not found');
        }

        // Validate conflict resolution
        if (data.conflictResolution && !['local', 'remote', 'pending'].includes(data.conflictResolution)) {
            throw new Error('Invalid conflict resolution value');
        }

        // Validate retry count
        if (data.retryCount !== undefined && data.retryCount < 0) {
            throw new Error('Retry count cannot be negative');
        }

        const [syncState] = await db.insert(syncStates).values({
            taskId: data.taskId,
            lastSyncTimestamp: data.lastSyncTimestamp,
            conflictResolution: data.conflictResolution || 'pending',
            retryCount: data.retryCount || 0,
            lastError: data.lastError
        }).returning();

        return syncState;
    }

    /**
     * Get sync state by task ID
     */
    static async getByTaskId(taskId: string): Promise<SyncState | null> {
        const syncState = await db.select()
            .from(syncStates)
            .where(eq(syncStates.taskId, taskId))
            .limit(1);

        return syncState[0] || null;
    }

    /**
     * Update sync state
     */
    static async update(taskId: string, data: UpdateSyncStateData): Promise<SyncState> {
        // Validate conflict resolution if provided
        if (data.conflictResolution && !['local', 'remote', 'pending'].includes(data.conflictResolution)) {
            throw new Error('Invalid conflict resolution value');
        }

        // Validate retry count if provided
        if (data.retryCount !== undefined && data.retryCount < 0) {
            throw new Error('Retry count cannot be negative');
        }

        const [updatedSyncState] = await db.update(syncStates)
            .set({
                ...data,
                updatedAt: new Date()
            })
            .where(eq(syncStates.taskId, taskId))
            .returning();

        if (!updatedSyncState) {
            throw new Error('Sync state not found');
        }

        return updatedSyncState;
    }

    /**
     * Mark sync as successful
     */
    static async markSyncSuccess(taskId: string): Promise<SyncState> {
        return await this.update(taskId, {
            lastSyncTimestamp: new Date(),
            retryCount: 0,
            lastError: null,
            conflictResolution: 'pending'
        });
    }

    /**
     * Mark sync as failed
     */
    static async markSyncFailed(taskId: string, error: string): Promise<SyncState> {
        const currentState = await this.getByTaskId(taskId);
        if (!currentState) {
            throw new Error('Sync state not found');
        }

        return await this.update(taskId, {
            retryCount: currentState.retryCount + 1,
            lastError: error
        });
    }

    /**
     * Resolve conflict
     */
    static async resolveConflict(taskId: string, resolution: 'local' | 'remote'): Promise<SyncState> {
        return await this.update(taskId, {
            conflictResolution: resolution,
            lastSyncTimestamp: new Date(),
            retryCount: 0,
            lastError: null
        });
    }

    /**
     * Get tasks that need sync
     */
    static async getTasksNeedingSync(userId: string, limit: number = 100): Promise<SyncState[]> {
        const syncStates = await db.select()
            .from(syncStates)
            .innerJoin(tasks, eq(tasks.id, syncStates.taskId))
            .where(eq(tasks.userId, userId))
            .orderBy(asc(syncStates.lastSyncTimestamp))
            .limit(limit);

        return syncStates.map(({ sync_states }) => sync_states);
    }

    /**
     * Get tasks with conflicts
     */
    static async getTasksWithConflicts(userId: string): Promise<SyncState[]> {
        const syncStates = await db.select()
            .from(syncStates)
            .innerJoin(tasks, eq(tasks.id, syncStates.taskId))
            .where(and(
                eq(tasks.userId, userId),
                eq(syncStates.conflictResolution, 'pending')
            ));

        return syncStates.map(({ sync_states }) => sync_states);
    }

    /**
     * Get tasks with retry failures
     */
    static async getTasksWithRetryFailures(userId: string, maxRetries: number = 3): Promise<SyncState[]> {
        const syncStates = await db.select()
            .from(syncStates)
            .innerJoin(tasks, eq(tasks.id, syncStates.taskId))
            .where(and(
                eq(tasks.userId, userId),
                eq(syncStates.retryCount, maxRetries)
            ));

        return syncStates.map(({ sync_states }) => sync_states);
    }

    /**
     * Reset retry count
     */
    static async resetRetryCount(taskId: string): Promise<SyncState> {
        return await this.update(taskId, {
            retryCount: 0,
            lastError: null
        });
    }

    /**
     * Check if task needs sync
     */
    static async needsSync(taskId: string): Promise<boolean> {
        const syncState = await this.getByTaskId(taskId);
        if (!syncState) {
            return false;
        }

        // Check if there are pending changes or conflicts
        return syncState.conflictResolution === 'pending' ||
            syncState.retryCount > 0 ||
            !syncState.lastSyncTimestamp;
    }

    /**
     * Get sync statistics for user
     */
    static async getSyncStats(userId: string): Promise<{
        totalTasks: number;
        syncedTasks: number;
        pendingSync: number;
        conflicts: number;
        failedSync: number;
    }> {
        // TODO: Implement proper sync stats querying with user-specific database
        // For now, return default values to prevent errors
        return {
            totalTasks: 0,
            syncedTasks: 0,
            pendingSync: 0,
            conflicts: 0,
            failedSync: 0
        };
    }

    /**
     * Detect sync conflicts
     */
    static detectConflict(localVersion: any, remoteVersion: any): SyncConflictData | null {
        const conflictFields: string[] = [];
        const lastModified = new Date();

        // Compare common fields
        const fieldsToCheck = ['title', 'description', 'status', 'due', 'priority', 'notes', 'labels'];

        for (const field of fieldsToCheck) {
            if (localVersion[field] !== remoteVersion[field]) {
                conflictFields.push(field);
            }
        }

        if (conflictFields.length === 0) {
            return null;
        }

        return {
            localVersion,
            remoteVersion,
            conflictFields,
            lastModified
        };
    }

    /**
     * Resolve conflict using strategy
     */
    static resolveConflictWithStrategy(
        conflict: SyncConflictData,
        strategy: ConflictResolutionStrategy
    ): any {
        switch (strategy) {
            case 'local':
                return conflict.localVersion;
            case 'remote':
                return conflict.remoteVersion;
            case 'merge':
                return this.mergeVersions(conflict.localVersion, conflict.remoteVersion);
            case 'user-choice':
                // This would require user input, so we default to local
                return conflict.localVersion;
            default:
                throw new Error('Invalid conflict resolution strategy');
        }
    }

    /**
     * Merge two versions of a task
     */
    private static mergeVersions(localVersion: any, remoteVersion: any): any {
        const merged = { ...localVersion };

        // For each conflict field, choose the most recent or most complete value
        for (const field of Object.keys(remoteVersion)) {
            if (localVersion[field] !== remoteVersion[field]) {
                // Simple merge strategy: prefer non-null, non-empty values
                if (remoteVersion[field] !== null && remoteVersion[field] !== undefined && remoteVersion[field] !== '') {
                    merged[field] = remoteVersion[field];
                }
            }
        }

        return merged;
    }

    /**
     * Clean up old sync states
     */
    static async cleanupOldSyncStates(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await db.delete(syncStates)
            .where(and(
                eq(syncStates.lastSyncTimestamp, cutoffDate),
                eq(syncStates.retryCount, 0)
            ));

        return result.rowCount || 0;
    }

    /**
     * Get sync state history
     */
    static async getSyncHistory(taskId: string, limit: number = 10): Promise<SyncState[]> {
        return await db.select()
            .from(syncStates)
            .where(eq(syncStates.taskId, taskId))
            .orderBy(desc(syncStates.updatedAt))
            .limit(limit);
    }

    /**
     * Validate sync state data
     */
    static validateSyncStateData(data: CreateSyncStateData | UpdateSyncStateData): void {
        if ('conflictResolution' in data && data.conflictResolution &&
            !['local', 'remote', 'pending'].includes(data.conflictResolution)) {
            throw new Error('Invalid conflict resolution value');
        }

        if ('retryCount' in data && data.retryCount !== undefined && data.retryCount < 0) {
            throw new Error('Retry count cannot be negative');
        }
    }
}
