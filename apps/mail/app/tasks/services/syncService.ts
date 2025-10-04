/**
 * Sync Service
 * 
 * Handles bidirectional synchronization between local tasks and Google Tasks.
 * Manages offline changes, conflict resolution, and real-time sync.
 */

import type {
    ConflictResolution,
    OfflineQueueItem,
    SyncStats,
    SyncStatus
} from '../types/task';
import { googleTasksApi } from './googleTasksApi';

export interface SyncServiceConfig {
    syncInterval: number;
    batchSize: number;
    retryAttempts: number;
    retryDelay: number;
    conflictResolutionStrategy: 'local' | 'remote' | 'manual';
}

export interface SyncEvent {
    type: 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'offline_change';
    data?: any;
    timestamp: Date;
}

export class SyncService {
    private config: SyncServiceConfig;
    private syncInterval: NodeJS.Timeout | null = null;
    private eventListeners: Map<string, ((event: SyncEvent) => void)[]> = new Map();
    private isOnline: boolean = navigator.onLine;
    private offlineQueue: OfflineQueueItem[] = [];
    private lastSyncTime: Date | null = null;

    constructor(config: SyncServiceConfig) {
        this.config = config;
        this.setupEventListeners();
        this.loadOfflineQueue();
    }

    /**
     * Start automatic sync
     */
    startAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.sync();
            }
        }, this.config.syncInterval);
    }

    /**
     * Stop automatic sync
     */
    stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Manual sync
     */
    async sync(): Promise<void> {
        if (!this.isOnline) {
            this.emit('sync_error', { error: 'Offline - sync queued' });
            return;
        }

        try {
            this.emit('sync_start');

            // Process offline queue first
            await this.processOfflineQueue();

            // Sync with Google Tasks
            await googleTasksApi.syncTasks();

            this.lastSyncTime = new Date();
            this.emit('sync_complete', { timestamp: this.lastSyncTime });

        } catch (error) {
            console.error('Sync failed:', error);
            this.emit('sync_error', { error: error.message });
        }
    }

    /**
     * Force sync specific task
     */
    async forceSyncTask(taskId: string): Promise<void> {
        if (!this.isOnline) {
            throw new Error('Cannot force sync while offline');
        }

        try {
            await googleTasksApi.forceSyncTask(taskId);
            this.lastSyncTime = new Date();
        } catch (error) {
            console.error('Force sync failed:', error);
            throw error;
        }
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<SyncStatus> {
        try {
            const status = await googleTasksApi.getSyncStatus();
            return {
                isOnline: this.isOnline,
                lastSync: this.lastSyncTime,
                pendingChanges: this.offlineQueue.length,
                conflicts: 0, // TODO: Get from API
                errors: []
            };
        } catch (error) {
            return {
                isOnline: this.isOnline,
                lastSync: this.lastSyncTime,
                pendingChanges: this.offlineQueue.length,
                conflicts: 0,
                errors: [error.message]
            };
        }
    }

    /**
     * Get sync statistics
     */
    async getSyncStats(): Promise<SyncStats> {
        try {
            const stats = await googleTasksApi.getSyncStats();
            return {
                totalTasks: stats.totalTasks || 0,
                syncedTasks: stats.syncedTasks || 0,
                pendingChanges: this.offlineQueue.length,
                conflicts: stats.conflicts || 0,
                lastSync: this.lastSyncTime
            };
        } catch (error) {
            return {
                totalTasks: 0,
                syncedTasks: 0,
                pendingChanges: this.offlineQueue.length,
                conflicts: 0,
                lastSync: this.lastSyncTime
            };
        }
    }

    /**
     * Resolve conflicts
     */
    async resolveConflicts(resolutions: ConflictResolution[]): Promise<void> {
        if (!this.isOnline) {
            throw new Error('Cannot resolve conflicts while offline');
        }

        try {
            await googleTasksApi.resolveConflicts(resolutions);
        } catch (error) {
            console.error('Conflict resolution failed:', error);
            throw error;
        }
    }

    /**
     * Queue offline change
     */
    queueOfflineChange(taskId: string, operation: 'create' | 'update' | 'delete', data: any): void {
        const change: OfflineQueueItem = {
            id: this.generateId(),
            taskId,
            operation,
            data,
            timestamp: new Date(),
            retryCount: 0
        };

        this.offlineQueue.push(change);
        this.saveOfflineQueue();
        this.emit('offline_change', { change });
    }

    /**
     * Process offline queue
     */
    private async processOfflineQueue(): Promise<void> {
        if (!this.isOnline || this.offlineQueue.length === 0) {
            return;
        }

        const batch = this.offlineQueue.splice(0, this.config.batchSize);

        for (const change of batch) {
            try {
                await this.processOfflineChange(change);
                this.removeOfflineChange(change.id);
            } catch (error) {
                console.error('Failed to process offline change:', error);
                change.retryCount++;

                if (change.retryCount >= this.config.retryAttempts) {
                    this.removeOfflineChange(change.id);
                }
            }
        }

        this.saveOfflineQueue();
    }

    /**
     * Process individual offline change
     */
    private async processOfflineChange(change: OfflineQueueItem): Promise<void> {
        switch (change.operation) {
            case 'create':
                await googleTasksApi.createTask(change.data);
                break;
            case 'update':
                await googleTasksApi.updateTask(change.taskId, change.data);
                break;
            case 'delete':
                await googleTasksApi.deleteTask(change.taskId);
                break;
        }
    }

    /**
     * Remove offline change
     */
    private removeOfflineChange(changeId: string): void {
        this.offlineQueue = this.offlineQueue.filter(change => change.id !== changeId);
        this.saveOfflineQueue();
    }

    /**
     * Get offline queue
     */
    getOfflineQueue(): OfflineQueueItem[] {
        return [...this.offlineQueue];
    }

    /**
     * Clear offline queue
     */
    clearOfflineQueue(): void {
        this.offlineQueue = [];
        this.saveOfflineQueue();
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.sync(); // Sync when coming back online
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Visibility change - sync when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.sync();
            }
        });
    }

    /**
     * Load offline queue from localStorage
     */
    private loadOfflineQueue(): void {
        try {
            const stored = localStorage.getItem('tasks-offline-queue');
            if (stored) {
                this.offlineQueue = JSON.parse(stored).map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
        } catch (error) {
            console.error('Failed to load offline queue:', error);
            this.offlineQueue = [];
        }
    }

    /**
     * Save offline queue to localStorage
     */
    private saveOfflineQueue(): void {
        try {
            localStorage.setItem('tasks-offline-queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    /**
     * Add event listener
     */
    addEventListener(event: string, listener: (event: SyncEvent) => void): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)!.push(listener);
    }

    /**
     * Remove event listener
     */
    removeEventListener(event: string, listener: (event: SyncEvent) => void): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     */
    private emit(type: SyncEvent['type'], data?: any): void {
        const event: SyncEvent = {
            type,
            data,
            timestamp: new Date()
        };

        const listeners = this.eventListeners.get(type);
        if (listeners) {
            listeners.forEach(listener => listener(event));
        }
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get last sync time
     */
    getLastSyncTime(): Date | null {
        return this.lastSyncTime;
    }

    /**
     * Check if online
     */
    isOnlineStatus(): boolean {
        return this.isOnline;
    }

    /**
     * Destroy service
     */
    destroy(): void {
        this.stopAutoSync();
        this.eventListeners.clear();
    }
}

// Default configuration
export const defaultSyncServiceConfig: SyncServiceConfig = {
    syncInterval: 30000, // 30 seconds
    batchSize: 10,
    retryAttempts: 3,
    retryDelay: 1000,
    conflictResolutionStrategy: 'local'
};

// Create default instance
export const syncService = new SyncService(defaultSyncServiceConfig);
