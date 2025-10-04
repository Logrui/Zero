/**
 * Google Tasks API Integration Tests
 * 
 * Tests for Google Tasks API client with OAuth flow.
 * Covers authentication, API calls, and error handling.
 */

import { googleTasksApi } from '../../app/tasks/services/googleTasksApi';
import type { CreateTaskData, TaskWithRelations, UpdateTaskData } from '../../app/tasks/types/task';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockTask: TaskWithRelations = {
    id: '1',
    googleTaskId: 'google-1',
    userId: 'user-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'needsAction',
    due: new Date('2024-12-25'),
    priority: 'high',
    notes: 'Test Notes',
    labels: ['work', 'urgent'],
    createdAt: new Date('2024-12-19'),
    updatedAt: new Date('2024-12-19'),
    subtasks: [],
    zeroosExtension: null,
    syncState: null,
    changes: []
};

const mockAuthResponse = {
    success: true,
    data: {
        authUrl: 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test&scope=tasks'
    }
};

const mockTasksResponse = {
    success: true,
    data: {
        items: [mockTask],
        pagination: {
            limit: 10,
            offset: 0,
            total: 1
        }
    }
};

const mockTaskResponse = {
    success: true,
    data: mockTask
};

const mockSyncStatusResponse = {
    success: true,
    data: {
        isOnline: true,
        lastSync: new Date('2024-12-19'),
        pendingChanges: 0,
        conflicts: 0,
        errors: []
    }
};

const mockSyncStatsResponse = {
    success: true,
    data: {
        totalTasks: 10,
        syncedTasks: 8,
        pendingChanges: 2,
        conflicts: 0,
        lastSync: new Date('2024-12-19')
    }
};

describe('Google Tasks API Client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fetch as jest.Mock).mockClear();
    });

    describe('Authentication', () => {
        it('gets auth URL', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockAuthResponse)
            });

            const authUrl = await googleTasksApi.getAuthUrl();

            expect(authUrl).toBe('https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test&scope=tasks');
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/google-tasks'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('handles OAuth callback', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            await googleTasksApi.handleCallback('test-code');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/google-tasks/callback'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ code: 'test-code' })
                })
            );
        });

        it('disconnects from Google Tasks', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            await googleTasksApi.disconnect();

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/auth/google-tasks'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        it('checks authentication status', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSyncStatusResponse)
            });

            const authState = await googleTasksApi.checkAuthStatus();

            expect(authState.isConnected).toBe(true);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/status'),
                expect.objectContaining({ method: 'GET' })
            );
        });
    });

    describe('Task Operations', () => {
        it('fetches tasks', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTasksResponse)
            });

            const tasks = await googleTasksApi.getTasks();

            expect(tasks).toEqual([mockTask]);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/tasks'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('fetches tasks with filters', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTasksResponse)
            });

            const filters = { status: 'needsAction', priority: 'high' };
            await googleTasksApi.getTasks(filters);

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/tasks?status=needsAction&priority=high'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('creates task', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTaskResponse)
            });

            const taskData: CreateTaskData = {
                title: 'New Task',
                description: 'New Description',
                status: 'needsAction',
                priority: 'normal'
            };

            const createdTask = await googleTasksApi.createTask(taskData);

            expect(createdTask).toEqual(mockTask);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/tasks'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(taskData)
                })
            );
        });

        it('updates task', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTaskResponse)
            });

            const updates: UpdateTaskData = {
                title: 'Updated Task',
                status: 'completed'
            };

            const updatedTask = await googleTasksApi.updateTask('1', updates);

            expect(updatedTask).toEqual(mockTask);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/tasks/1'),
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify(updates)
                })
            );
        });

        it('deletes task', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true })
            });

            await googleTasksApi.deleteTask('1');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/tasks/1'),
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });

    describe('Sync Operations', () => {
        it('syncs tasks', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} })
            });

            const result = await googleTasksApi.syncTasks();

            expect(result).toEqual({});
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('gets sync status', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSyncStatusResponse)
            });

            const status = await googleTasksApi.getSyncStatus();

            expect(status).toEqual(mockSyncStatusResponse.data);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/status'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('gets sync statistics', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockSyncStatsResponse)
            });

            const stats = await googleTasksApi.getSyncStats();

            expect(stats).toEqual(mockSyncStatsResponse.data);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/stats'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('resolves conflicts', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} })
            });

            const resolutions = [
                { taskId: '1', strategy: 'local' as const, resolvedData: {} }
            ];

            const result = await googleTasksApi.resolveConflicts(resolutions);

            expect(result).toEqual({});
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/conflicts/resolve'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ resolutions })
                })
            );
        });

        it('force syncs specific task', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} })
            });

            const result = await googleTasksApi.forceSyncTask('1');

            expect(result).toEqual({});
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/force/1'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('Offline Queue', () => {
        it('gets offline queue', async () => {
            const mockQueue = [
                { id: '1', taskId: '1', operation: 'create', data: {}, timestamp: new Date(), retryCount: 0 }
            ];

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: mockQueue })
            });

            const queue = await googleTasksApi.getOfflineQueue();

            expect(queue).toEqual(mockQueue);
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/queue'),
                expect.objectContaining({ method: 'GET' })
            );
        });

        it('processes offline queue', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} })
            });

            const result = await googleTasksApi.processOfflineQueue();

            expect(result).toEqual({});
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/sync/queue/process'),
                expect.objectContaining({ method: 'POST' })
            );
        });
    });

    describe('Error Handling', () => {
        it('handles network errors', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(googleTasksApi.getTasks()).rejects.toThrow('Network error');
        });

        it('handles HTTP errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            await expect(googleTasksApi.getTasks()).rejects.toThrow('HTTP 500: Internal Server Error');
        });

        it('handles API errors', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: false,
                    error: { code: 'AUTH_ERROR', message: 'Authentication failed' }
                })
            });

            await expect(googleTasksApi.getTasks()).rejects.toThrow('Failed to fetch tasks');
        });

        it('retries on failure', async () => {
            (fetch as jest.Mock)
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(mockTasksResponse)
                });

            const tasks = await googleTasksApi.getTasks();

            expect(tasks).toEqual([mockTask]);
            expect(fetch).toHaveBeenCalledTimes(3);
        });

        it('times out on slow requests', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(resolve, 15000))
            );

            await expect(googleTasksApi.getTasks()).rejects.toThrow();
        });
    });

    describe('Request Configuration', () => {
        it('sets proper headers', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTasksResponse)
            });

            await googleTasksApi.getTasks();

            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('handles request timeout', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(resolve, 15000))
            );

            await expect(googleTasksApi.getTasks()).rejects.toThrow();
        });

        it('handles request cancellation', async () => {
            const controller = new AbortController();
            controller.abort();

            (fetch as jest.Mock).mockImplementationOnce(() =>
                Promise.reject(new Error('Request aborted'))
            );

            await expect(googleTasksApi.getTasks()).rejects.toThrow();
        });
    });

    describe('Performance', () => {
        it('handles concurrent requests', async () => {
            (fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockTasksResponse)
            });

            const startTime = performance.now();

            const promises = Array.from({ length: 10 }, () => googleTasksApi.getTasks());
            await Promise.all(promises);

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
        });

        it('handles large responses efficiently', async () => {
            const largeResponse = {
                success: true,
                data: {
                    items: Array.from({ length: 1000 }, (_, i) => ({
                        ...mockTask,
                        id: `task-${i}`,
                        title: `Task ${i}`
                    })),
                    pagination: { limit: 1000, offset: 0, total: 1000 }
                }
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(largeResponse)
            });

            const startTime = performance.now();

            const tasks = await googleTasksApi.getTasks();

            const endTime = performance.now();
            expect(tasks).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(500); // Should handle in < 500ms
        });
    });
});
