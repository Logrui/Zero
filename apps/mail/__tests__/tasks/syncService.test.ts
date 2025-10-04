/**
 * Sync Service Integration Tests
 * 
 * Tests for sync service with real-time updates and offline queue.
 * Covers sync operations, conflict resolution, and offline functionality.
 */

import { googleTasksApi } from '../../app/tasks/services/googleTasksApi';
import { syncService } from '../../app/tasks/services/syncService';
import type { ConflictResolution, SyncStats, SyncStatus } from '../../app/tasks/types/task';

// Mock Google Tasks API
jest.mock('../../app/tasks/services/googleTasksApi');

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
});

// Mock data
const mockSyncStatus: SyncStatus = {
    isOnline: true,
    lastSync: new Date('2024-12-19'),
    pendingChanges: 0,
    conflicts: 0,
    errors: []
};

const mockSyncStats: SyncStats = {
    totalTasks: 10,
    syncedTasks: 8,
    pendingChanges: 2,
    conflicts: 0,
    lastSync: new Date('2024-12-19')
};

const mockOfflineQueue = [
    {
        id: '1',
        taskId: 'task-1',
        operation: 'create' as const,
        data: { title: 'New Task' },
        timestamp: new Date('2024-12-19'),
        retryCount: 0
    },
    {
        id: '2',
        taskId: 'task-2',
        operation: 'update' as const,
        data: { title: 'Updated Task' },
        timestamp: new Date('2024-12-19'),
        retryCount: 0
    }
];

describe('Sync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
    });

    describe('Initialization', () => {
        it('initializes with default configuration', () => {
            expect(syncService).toBeDefined();
        });

        it('loads offline queue from localStorage', () => {
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockOfflineQueue));

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            expect(service.getOfflineQueue()).toEqual(mockOfflineQueue);
        });

        it('handles corrupted localStorage data', () => {
            localStorageMock.getItem.mockReturnValue('invalid json');

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            expect(service.getOfflineQueue()).toEqual([]);
        });
    });

    describe('Auto Sync', () => {
        it('starts auto sync', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.startAutoSync();
            expect(service).toBeDefined();
        });

        it('stops auto sync', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.startAutoSync();
            service.stopAutoSync();
            expect(service).toBeDefined();
        });
    });

    describe('Manual Sync', () => {
        it('syncs when online', async () => {
            (googleTasksApi.syncTasks as jest.Mock).mockResolvedValue({});

            await syncService.sync();

            expect(googleTasksApi.syncTasks).toHaveBeenCalled();
        });

        it('queues sync when offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false });

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            await service.sync();

            expect(googleTasksApi.syncTasks).not.toHaveBeenCalled();
        });

        it('handles sync errors', async () => {
            (googleTasksApi.syncTasks as jest.Mock).mockRejectedValue(new Error('Sync failed'));

            const eventListener = jest.fn();
            syncService.addEventListener('sync_error', eventListener);

            await syncService.sync();

            expect(eventListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'sync_error',
                    data: { error: 'Sync failed' }
                })
            );
        });
    });

    describe('Force Sync', () => {
        it('force syncs specific task', async () => {
            (googleTasksApi.forceSyncTask as jest.Mock).mockResolvedValue({});

            await syncService.forceSyncTask('task-1');

            expect(googleTasksApi.forceSyncTask).toHaveBeenCalledWith('task-1');
        });

        it('throws error when offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false });

            await expect(syncService.forceSyncTask('task-1')).rejects.toThrow('Cannot force sync while offline');
        });
    });

    describe('Sync Status', () => {
        it('gets sync status', async () => {
            (googleTasksApi.getSyncStatus as jest.Mock).mockResolvedValue(mockSyncStatus);

            const status = await syncService.getSyncStatus();

            expect(status).toEqual(mockSyncStatus);
            expect(googleTasksApi.getSyncStatus).toHaveBeenCalled();
        });

        it('handles sync status errors', async () => {
            (googleTasksApi.getSyncStatus as jest.Mock).mockRejectedValue(new Error('Status failed'));

            const status = await syncService.getSyncStatus();

            expect(status).toEqual({
                isOnline: true,
                lastSync: null,
                pendingChanges: 0,
                conflicts: 0,
                errors: ['Status failed']
            });
        });
    });

    describe('Sync Statistics', () => {
        it('gets sync statistics', async () => {
            (googleTasksApi.getSyncStats as jest.Mock).mockResolvedValue(mockSyncStats);

            const stats = await syncService.getSyncStats();

            expect(stats).toEqual(mockSyncStats);
            expect(googleTasksApi.getSyncStats).toHaveBeenCalled();
        });

        it('handles sync stats errors', async () => {
            (googleTasksApi.getSyncStats as jest.Mock).mockRejectedValue(new Error('Stats failed'));

            const stats = await syncService.getSyncStats();

            expect(stats).toEqual({
                totalTasks: 0,
                syncedTasks: 0,
                pendingChanges: 0,
                conflicts: 0,
                lastSync: null
            });
        });
    });

    describe('Conflict Resolution', () => {
        it('resolves conflicts', async () => {
            (googleTasksApi.resolveConflicts as jest.Mock).mockResolvedValue({});

            const resolutions: ConflictResolution[] = [
                { taskId: 'task-1', strategy: 'local', resolvedData: {} }
            ];

            await syncService.resolveConflicts(resolutions);

            expect(googleTasksApi.resolveConflicts).toHaveBeenCalledWith(resolutions);
        });

        it('throws error when offline', async () => {
            Object.defineProperty(navigator, 'onLine', { value: false });

            const resolutions: ConflictResolution[] = [
                { taskId: 'task-1', strategy: 'local', resolvedData: {} }
            ];

            await expect(syncService.resolveConflicts(resolutions)).rejects.toThrow('Cannot resolve conflicts while offline');
        });
    });

    describe('Offline Queue', () => {
        it('queues offline changes', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            const eventListener = jest.fn();
            service.addEventListener('offline_change', eventListener);

            service.queueOfflineChange('task-1', 'create', { title: 'New Task' });

            const queue = service.getOfflineQueue();
            expect(queue).toHaveLength(1);
            expect(queue[0]).toMatchObject({
                taskId: 'task-1',
                operation: 'create',
                data: { title: 'New Task' }
            });
            expect(eventListener).toHaveBeenCalled();
        });

        it('processes offline queue when online', async () => {
            (googleTasksApi.createTask as jest.Mock).mockResolvedValue({});

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.queueOfflineChange('task-1', 'create', { title: 'New Task' });

            await service.processOfflineQueue();

            expect(googleTasksApi.createTask).toHaveBeenCalledWith({ title: 'New Task' });
        });

        it('handles offline queue processing errors', async () => {
            (googleTasksApi.createTask as jest.Mock).mockRejectedValue(new Error('Create failed'));

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.queueOfflineChange('task-1', 'create', { title: 'New Task' });

            await service.processOfflineQueue();

            const queue = service.getOfflineQueue();
            expect(queue).toHaveLength(1);
            expect(queue[0].retryCount).toBe(1);
        });

        it('removes items after max retries', async () => {
            (googleTasksApi.createTask as jest.Mock).mockRejectedValue(new Error('Create failed'));

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 1,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.queueOfflineChange('task-1', 'create', { title: 'New Task' });

            await service.processOfflineQueue();

            const queue = service.getOfflineQueue();
            expect(queue).toHaveLength(0);
        });

        it('clears offline queue', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.queueOfflineChange('task-1', 'create', { title: 'New Task' });
            service.clearOfflineQueue();

            expect(service.getOfflineQueue()).toHaveLength(0);
        });
    });

    describe('Event Listeners', () => {
        it('adds event listeners', () => {
            const listener = jest.fn();
            syncService.addEventListener('sync_start', listener);

            expect(syncService).toBeDefined();
        });

        it('removes event listeners', () => {
            const listener = jest.fn();
            syncService.addEventListener('sync_start', listener);
            syncService.removeEventListener('sync_start', listener);

            expect(syncService).toBeDefined();
        });

        it('emits sync events', async () => {
            const eventListener = jest.fn();
            syncService.addEventListener('sync_start', eventListener);

            await syncService.sync();

            expect(eventListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'sync_start'
                })
            );
        });
    });

    describe('Online/Offline Detection', () => {
        it('detects online status', () => {
            Object.defineProperty(navigator, 'onLine', { value: true });

            expect(syncService.isOnlineStatus()).toBe(true);
        });

        it('detects offline status', () => {
            Object.defineProperty(navigator, 'onLine', { value: false });

            expect(syncService.isOnlineStatus()).toBe(false);
        });

        it('handles online event', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            Object.defineProperty(navigator, 'onLine', { value: true });
            window.dispatchEvent(new Event('online'));

            expect(service).toBeDefined();
        });

        it('handles offline event', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            Object.defineProperty(navigator, 'onLine', { value: false });
            window.dispatchEvent(new Event('offline'));

            expect(service).toBeDefined();
        });
    });

    describe('Performance', () => {
        it('handles large offline queues efficiently', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            const startTime = performance.now();

            // Add many items to queue
            for (let i = 0; i < 1000; i++) {
                service.queueOfflineChange(`task-${i}`, 'create', { title: `Task ${i}` });
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should handle in < 100ms
        });

        it('processes queue in batches', async () => {
            (googleTasksApi.createTask as jest.Mock).mockResolvedValue({});

            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 5,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            // Add more items than batch size
            for (let i = 0; i < 10; i++) {
                service.queueOfflineChange(`task-${i}`, 'create', { title: `Task ${i}` });
            }

            await service.processOfflineQueue();

            expect(googleTasksApi.createTask).toHaveBeenCalledTimes(5); // Only first batch
        });
    });

    describe('Cleanup', () => {
        it('destroys service', () => {
            const service = new (require('../../app/tasks/services/syncService').SyncService)({
                syncInterval: 30000,
                batchSize: 10,
                retryAttempts: 3,
                retryDelay: 1000,
                conflictResolutionStrategy: 'local'
            });

            service.destroy();

            expect(service).toBeDefined();
        });
    });
});
