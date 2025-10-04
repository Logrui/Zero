import { ChangeModel } from '../models/change';
import { SyncStateModel } from '../models/syncState';
import { TaskModel } from '../models/task';
import { UserPermissionsModel } from '../models/userPermissions';
import type { SyncResult } from './googleTasksService';
import { GoogleTasksService } from './googleTasksService';

/**
 * Sync Service
 * 
 * Handles bidirectional synchronization with conflict resolution and offline queue management.
 * Provides real-time sync capabilities and conflict resolution strategies.
 */

export interface SyncConfig {
    googleTasks: GoogleTasksService;
    conflictResolution: 'local' | 'remote' | 'merge' | 'user-choice';
    retryAttempts: number;
    retryDelay: number;
    batchSize: number;
}

export interface SyncStatus {
    isOnline: boolean;
    lastSync?: Date;
    pendingChanges: number;
    conflicts: number;
    errors: string[];
}

export interface ConflictResolution {
    taskId: string;
    strategy: 'local' | 'remote' | 'merge';
    resolvedData?: any;
}

export class SyncService {
    private config: SyncConfig;
    private isSyncing: boolean = false;
    private syncInterval?: NodeJS.Timeout;

    constructor(config: SyncConfig) {
        this.config = config;
    }

    /**
     * Start automatic sync
     */
    startAutoSync(intervalMs: number = 30000): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(async () => {
            if (!this.isSyncing) {
                await this.performSync();
            }
        }, intervalMs);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = undefined;
        }
    }

    /**
     * Perform manual sync for user
     */
    async syncUser(userId: string): Promise<SyncResult> {
        try {
            this.isSyncing = true;

            // Check if user has valid permissions
            const userPerms = await UserPermissionsModel.getByUserId(userId);
            if (!userPerms || !await UserPermissionsModel.areTokensValid(userId)) {
                throw new Error('User not connected to Google Tasks');
            }

            // Perform bidirectional sync
            const result = await this.config.googleTasks.performBidirectionalSync(userId);

            // Update sync status
            await this.updateSyncStatus(userId, result);

            return result;
        } catch (error) {
            console.error('Error syncing user:', error);
            return {
                success: false,
                syncedTasks: 0,
                conflicts: 0,
                errors: [error.message]
            };
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Perform sync for all connected users
     */
    async performSync(): Promise<{ [userId: string]: SyncResult }> {
        const results: { [userId: string]: SyncResult } = {};

        try {
            // Get all users with valid tokens
            const usersWithTokens = await UserPermissionsModel.getUsersWithExpiredTokens();

            for (const userPerms of usersWithTokens) {
                try {
                    const result = await this.syncUser(userPerms.userId);
                    results[userPerms.userId] = result;
                } catch (error) {
                    console.error(`Error syncing user ${userPerms.userId}:`, error);
                    results[userPerms.userId] = {
                        success: false,
                        syncedTasks: 0,
                        conflicts: 0,
                        errors: [error.message]
                    };
                }
            }
        } catch (error) {
            console.error('Error in performSync:', error);
        }

        return results;
    }

    /**
     * Handle conflict resolution
     */
    async resolveConflicts(userId: string, resolutions: ConflictResolution[]): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            syncedTasks: 0,
            conflicts: 0,
            errors: []
        };

        try {
            for (const resolution of resolutions) {
                try {
                    const task = await TaskModel.getById(resolution.taskId);
                    if (!task) continue;

                    // Apply resolution strategy
                    let resolvedData: any;
                    switch (resolution.strategy) {
                        case 'local':
                            resolvedData = task;
                            break;
                        case 'remote':
                            // Fetch from Google Tasks and use that data
                            const googleTask = await this.config.googleTasks.getUserTasks(userId);
                            const matchingTask = googleTask.find(gt => gt.id === task.googleTaskId);
                            if (matchingTask) {
                                resolvedData = this.config.googleTasks['mapGoogleTaskToZeroOS'](matchingTask);
                            }
                            break;
                        case 'merge':
                            resolvedData = resolution.resolvedData || task;
                            break;
                    }

                    if (resolvedData) {
                        await TaskModel.update(resolution.taskId, resolvedData);
                        await SyncStateModel.resolveConflict(resolution.taskId, 'local');
                        result.syncedTasks++;
                    }
                } catch (error) {
                    console.error(`Error resolving conflict for task ${resolution.taskId}:`, error);
                    result.errors.push(`Failed to resolve conflict: ${resolution.taskId}`);
                }
            }
        } catch (error) {
            console.error('Error resolving conflicts:', error);
            result.success = false;
            result.errors.push('Failed to resolve conflicts');
        }

        return result;
    }

    /**
     * Get sync status for user
     */
    async getSyncStatus(userId: string): Promise<SyncStatus> {
        try {
            const userPerms = await UserPermissionsModel.getByUserId(userId);
            const isOnline = userPerms && await UserPermissionsModel.areTokensValid(userId);

            const pendingChanges = await ChangeModel.getQueueSize(userId);
            const syncStats = await SyncStateModel.getSyncStats(userId);
            const conflicts = await SyncStateModel.getTasksWithConflicts(userId);

            return {
                isOnline: !!isOnline,
                lastSync: userPerms?.lastAuthCheck,
                pendingChanges,
                conflicts: conflicts.length,
                errors: []
            };
        } catch (error) {
            console.error('Error getting sync status:', error);
            return {
                isOnline: false,
                pendingChanges: 0,
                conflicts: 0,
                errors: [error.message]
            };
        }
    }

    /**
     * Queue task change for sync
     */
    async queueTaskChange(taskId: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
        await ChangeModel.create({
            taskId,
            operation,
            data
        });
    }

    /**
     * Process offline queue
     */
    async processOfflineQueue(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            syncedTasks: 0,
            conflicts: 0,
            errors: []
        };

        try {
            const pendingChanges = await ChangeModel.getPendingChanges(userId, this.config.batchSize);

            for (const change of pendingChanges) {
                try {
                    const task = await TaskModel.getById(change.taskId);
                    if (!task) {
                        await ChangeModel.processChange(change.id, true);
                        continue;
                    }

                    // Process change based on operation
                    switch (change.operation) {
                        case 'create':
                            if (!task.googleTaskId) {
                                const googleTask = await this.config.googleTasks.createGoogleTask(userId, {
                                    title: task.title,
                                    notes: task.notes,
                                    status: task.status,
                                    due: task.due?.toISOString()
                                });
                                await TaskModel.update(task.id, { googleTaskId: googleTask.id });
                            }
                            break;

                        case 'update':
                            if (task.googleTaskId) {
                                await this.config.googleTasks.updateGoogleTask(userId, task.googleTaskId, {
                                    title: task.title,
                                    notes: task.notes,
                                    status: task.status,
                                    due: task.due?.toISOString()
                                });
                            }
                            break;

                        case 'delete':
                            if (task.googleTaskId) {
                                await this.config.googleTasks.deleteGoogleTask(userId, task.googleTaskId);
                            }
                            break;
                    }

                    await ChangeModel.processChange(change.id, true);
                    await SyncStateModel.markSyncSuccess(task.id);
                    result.syncedTasks++;
                } catch (error) {
                    console.error(`Error processing change ${change.id}:`, error);
                    await ChangeModel.processChange(change.id, false, error.message);
                    result.errors.push(`Failed to process change: ${change.operation}`);
                }
            }
        } catch (error) {
            console.error('Error processing offline queue:', error);
            result.success = false;
            result.errors.push('Failed to process offline queue');
        }

        return result;
    }

    /**
     * Handle sync errors with retry logic
     */
    async handleSyncError(userId: string, error: Error, taskId?: string): Promise<void> {
        console.error('Sync error:', error);

        if (taskId) {
            await SyncStateModel.markSyncFailed(taskId, error.message);
        }

        // Implement exponential backoff for retries
        const retryDelay = this.config.retryDelay * Math.pow(2, this.config.retryAttempts);
        setTimeout(async () => {
            try {
                await this.syncUser(userId);
            } catch (retryError) {
                console.error('Retry failed:', retryError);
            }
        }, retryDelay);
    }

    /**
     * Update sync status after sync operation
     */
    private async updateSyncStatus(userId: string, result: SyncResult): Promise<void> {
        if (result.success) {
            await UserPermissionsModel.updateLastAuthCheck(userId);
        }
    }

    /**
     * Detect sync conflicts
     */
    async detectConflicts(userId: string): Promise<ConflictResolution[]> {
        const conflicts: ConflictResolution[] = [];

        try {
            const tasksWithConflicts = await SyncStateModel.getTasksWithConflicts(userId);

            for (const syncState of tasksWithConflicts) {
                const task = await TaskModel.getById(syncState.taskId);
                if (!task) continue;

                // Check if task has been modified since last sync
                const lastSync = syncState.lastSyncTimestamp;
                if (lastSync && task.updatedAt > lastSync) {
                    conflicts.push({
                        taskId: task.id,
                        strategy: this.config.conflictResolution,
                        resolvedData: task
                    });
                }
            }
        } catch (error) {
            console.error('Error detecting conflicts:', error);
        }

        return conflicts;
    }

    /**
     * Get sync statistics
     */
    async getSyncStats(userId: string): Promise<{
        totalTasks: number;
        syncedTasks: number;
        pendingChanges: number;
        conflicts: number;
        lastSync?: Date;
    }> {
        try {
            const syncStats = await SyncStateModel.getSyncStats(userId);
            const changeStats = await ChangeModel.getStats(userId);
            const userPerms = await UserPermissionsModel.getByUserId(userId);

            return {
                totalTasks: syncStats.totalTasks,
                syncedTasks: syncStats.syncedTasks,
                pendingChanges: changeStats.total,
                conflicts: syncStats.conflicts,
                lastSync: userPerms?.lastAuthCheck
            };
        } catch (error) {
            console.error('Error getting sync stats:', error);
            return {
                totalTasks: 0,
                syncedTasks: 0,
                pendingChanges: 0,
                conflicts: 0
            };
        }
    }

    /**
     * Clean up old sync data
     */
    async cleanupOldData(olderThanDays: number = 30): Promise<{
        deletedSyncStates: number;
        deletedChanges: number;
    }> {
        try {
            const deletedSyncStates = await SyncStateModel.cleanupOldSyncStates(olderThanDays);
            const deletedChanges = await ChangeModel.cleanupOldChanges(olderThanDays);

            return {
                deletedSyncStates,
                deletedChanges
            };
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            return {
                deletedSyncStates: 0,
                deletedChanges: 0
            };
        }
    }

    /**
     * Force sync for specific task
     */
    async forceSyncTask(userId: string, taskId: string): Promise<SyncResult> {
        try {
            const task = await TaskModel.getById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            if (task.googleTaskId) {
                // Update existing Google Task
                await this.config.googleTasks.updateGoogleTask(userId, task.googleTaskId, {
                    title: task.title,
                    notes: task.notes,
                    status: task.status,
                    due: task.due?.toISOString()
                });
            } else {
                // Create new Google Task
                const googleTask = await this.config.googleTasks.createGoogleTask(userId, {
                    title: task.title,
                    notes: task.notes,
                    status: task.status,
                    due: task.due?.toISOString()
                });
                await TaskModel.update(taskId, { googleTaskId: googleTask.id });
            }

            await SyncStateModel.markSyncSuccess(taskId);

            return {
                success: true,
                syncedTasks: 1,
                conflicts: 0,
                errors: []
            };
        } catch (error) {
            console.error('Error force syncing task:', error);
            return {
                success: false,
                syncedTasks: 0,
                conflicts: 0,
                errors: [error.message]
            };
        }
    }
}
