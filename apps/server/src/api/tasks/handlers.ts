import { Context } from 'hono';
import { ChangeModel } from '../../models/change';
import { SubtaskModel } from '../../models/subtask';
import { TaskModel } from '../../models/task';
import { UserPermissionsModel } from '../../models/userPermissions';
import { GoogleTasksService } from '../../services/googleTasksService';
import { SyncService } from '../../services/syncService';

/**
 * Tasks API Handlers
 * 
 * Handles HTTP requests for task operations with validation and error handling.
 * Provides comprehensive API endpoints for task management.
 */

// Helper function to get user ID from context
function getUserId(c: Context): string {
    // This would typically come from authentication middleware
    // For now, we'll use a placeholder
    return c.get('userId') || 'default-user';
}

// Helper function to send API response
function sendResponse(c: Context, data: any, status: number = 200) {
    return c.json({
        success: status < 400,
        data,
        timestamp: new Date().toISOString()
    }, status);
}

// Helper function to send error response
function sendError(c: Context, message: string, status: number = 400, code?: string) {
    return c.json({
        success: false,
        error: {
            code: code || 'API_ERROR',
            message,
            timestamp: new Date().toISOString()
        }
    }, status);
}

// Task CRUD operations
export const tasksHandlers = {
    /**
     * Get tasks with filtering and pagination
     */
    async getTasks(c: Context) {
        try {
            const userId = getUserId(c);
            const query = c.req.query();

            const filters = {
                userId,
                status: query.status as 'needsAction' | 'completed' | undefined,
                priority: query.priority as 'low' | 'normal' | 'high' | undefined,
                workspace: query.workspace,
                labels: query.labels ? query.labels.split(',') : undefined,
                dueBefore: query.dueBefore ? new Date(query.dueBefore) : undefined,
                dueAfter: query.dueAfter ? new Date(query.dueAfter) : undefined,
                search: query.search
            };

            const limit = parseInt(query.limit || '50');
            const offset = parseInt(query.offset || '0');

            const tasks = await TaskModel.getTasks(filters, limit, offset);

            return sendResponse(c, {
                tasks,
                pagination: {
                    limit,
                    offset,
                    total: tasks.length
                }
            });
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_TASKS_ERROR');
        }
    },

    /**
     * Get single task by ID
     */
    async getTask(c: Context) {
        try {
            const taskId = c.req.param('id');
            const task = await TaskModel.getById(taskId);

            if (!task) {
                return sendError(c, 'Task not found', 404, 'TASK_NOT_FOUND');
            }

            return sendResponse(c, task);
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_TASK_ERROR');
        }
    },

    /**
     * Create new task
     */
    async createTask(c: Context) {
        try {
            const userId = getUserId(c);
            const body = await c.req.json();

            // Validate required fields
            if (!body.title) {
                return sendError(c, 'Task title is required', 400, 'VALIDATION_ERROR');
            }

            const taskData = {
                userId,
                title: body.title,
                description: body.description,
                status: body.status || 'needsAction',
                due: body.due ? new Date(body.due) : undefined,
                priority: body.priority || 'normal',
                notes: body.notes,
                labels: body.labels || [],
                googleTaskId: body.googleTaskId,
                subtasks: body.subtasks,
                zeroosExtension: body.zeroosExtension
            };

            const task = await TaskModel.create(taskData);

            return sendResponse(c, task, 201);
        } catch (error) {
            return sendError(c, error.message, 500, 'CREATE_TASK_ERROR');
        }
    },

    /**
     * Update existing task
     */
    async updateTask(c: Context) {
        try {
            const taskId = c.req.param('id');
            const body = await c.req.json();

            const updateData = {
                title: body.title,
                description: body.description,
                status: body.status,
                due: body.due ? new Date(body.due) : body.due,
                priority: body.priority,
                notes: body.notes,
                labels: body.labels,
                googleTaskId: body.googleTaskId
            };

            const task = await TaskModel.update(taskId, updateData);

            return sendResponse(c, task);
        } catch (error) {
            return sendError(c, error.message, 500, 'UPDATE_TASK_ERROR');
        }
    },

    /**
     * Delete task
     */
    async deleteTask(c: Context) {
        try {
            const taskId = c.req.param('id');
            await TaskModel.delete(taskId);

            return sendResponse(c, { message: 'Task deleted successfully' });
        } catch (error) {
            return sendError(c, error.message, 500, 'DELETE_TASK_ERROR');
        }
    },

    /**
     * Get subtasks for a task
     */
    async getSubtasks(c: Context) {
        try {
            const taskId = c.req.param('id');
            const subtasks = await SubtaskModel.getByTaskId(taskId);

            return sendResponse(c, subtasks);
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_SUBTASKS_ERROR');
        }
    },

    /**
     * Create subtask
     */
    async createSubtask(c: Context) {
        try {
            const taskId = c.req.param('id');
            const body = await c.req.json();

            if (!body.title) {
                return sendError(c, 'Subtask title is required', 400, 'VALIDATION_ERROR');
            }

            const subtaskData = {
                taskId,
                title: body.title,
                status: body.status || 'needsAction',
                position: body.position
            };

            const subtask = await SubtaskModel.create(subtaskData);

            return sendResponse(c, subtask, 201);
        } catch (error) {
            return sendError(c, error.message, 500, 'CREATE_SUBTASK_ERROR');
        }
    },

    /**
     * Update subtask
     */
    async updateSubtask(c: Context) {
        try {
            const subtaskId = c.req.param('subtaskId');
            const body = await c.req.json();

            const updateData = {
                title: body.title,
                status: body.status,
                position: body.position
            };

            const subtask = await SubtaskModel.update(subtaskId, updateData);

            return sendResponse(c, subtask);
        } catch (error) {
            return sendError(c, error.message, 500, 'UPDATE_SUBTASK_ERROR');
        }
    },

    /**
     * Delete subtask
     */
    async deleteSubtask(c: Context) {
        try {
            const subtaskId = c.req.param('subtaskId');
            await SubtaskModel.delete(subtaskId);

            return sendResponse(c, { message: 'Subtask deleted successfully' });
        } catch (error) {
            return sendError(c, error.message, 500, 'DELETE_SUBTASK_ERROR');
        }
    },

    /**
     * Reorder subtasks
     */
    async reorderSubtasks(c: Context) {
        try {
            const taskId = c.req.param('id');
            const body = await c.req.json();

            if (!body.subtasks || !Array.isArray(body.subtasks)) {
                return sendError(c, 'Subtasks array is required', 400, 'VALIDATION_ERROR');
            }

            const reorderData = body.subtasks.map((item: any) => ({
                subtaskId: item.id,
                newPosition: item.position
            }));

            const subtasks = await SubtaskModel.reorder(taskId, reorderData);

            return sendResponse(c, subtasks);
        } catch (error) {
            return sendError(c, error.message, 500, 'REORDER_SUBTASKS_ERROR');
        }
    },

    /**
     * Get Google Tasks OAuth URL
     */
    async getGoogleTasksAuthUrl(c: Context) {
        try {
            const userId = getUserId(c);

            // Initialize Google Tasks service
            const googleTasksService = new GoogleTasksService({
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                scopes: ['https://www.googleapis.com/auth/tasks']
            });

            const authUrl = googleTasksService.getAuthUrl(userId);

            return sendResponse(c, { authUrl });
        } catch (error) {
            return sendError(c, error.message, 500, 'GOOGLE_AUTH_ERROR');
        }
    },

    /**
     * Handle Google Tasks OAuth callback
     */
    async handleGoogleTasksCallback(c: Context) {
        try {
            const userId = getUserId(c);
            const body = await c.req.json();

            if (!body.code) {
                return sendError(c, 'Authorization code is required', 400, 'VALIDATION_ERROR');
            }

            // Initialize Google Tasks service
            const googleTasksService = new GoogleTasksService({
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                scopes: ['https://www.googleapis.com/auth/tasks']
            });

            const tokens = await googleTasksService.exchangeCodeForTokens(body.code);
            await googleTasksService.setUserTokens(userId, tokens);

            return sendResponse(c, { message: 'Google Tasks connected successfully' });
        } catch (error) {
            return sendError(c, error.message, 500, 'GOOGLE_CALLBACK_ERROR');
        }
    },

    /**
     * Disconnect Google Tasks
     */
    async disconnectGoogleTasks(c: Context) {
        try {
            const userId = getUserId(c);
            await UserPermissionsModel.clearTokens(userId);

            return sendResponse(c, { message: 'Google Tasks disconnected successfully' });
        } catch (error) {
            return sendError(c, error.message, 500, 'DISCONNECT_ERROR');
        }
    },

    /**
     * Sync tasks with Google Tasks
     */
    async syncTasks(c: Context) {
        try {
            const userId = getUserId(c);

            // Initialize services
            const googleTasksService = new GoogleTasksService({
                clientId: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                scopes: ['https://www.googleapis.com/auth/tasks']
            });

            const syncService = new SyncService({
                googleTasks: googleTasksService,
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const result = await syncService.syncUser(userId);

            return sendResponse(c, result);
        } catch (error) {
            return sendError(c, error.message, 500, 'SYNC_ERROR');
        }
    },

    /**
     * Get sync status
     */
    async getSyncStatus(c: Context) {
        try {
            const userId = getUserId(c);

            const syncService = new SyncService({
                googleTasks: new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                    scopes: ['https://www.googleapis.com/auth/tasks']
                }),
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const status = await syncService.getSyncStatus(userId);

            return sendResponse(c, status);
        } catch (error) {
            return sendError(c, error.message, 500, 'SYNC_STATUS_ERROR');
        }
    },

    /**
     * Resolve sync conflicts
     */
    async resolveConflicts(c: Context) {
        try {
            const userId = getUserId(c);
            const body = await c.req.json();

            if (!body.resolutions || !Array.isArray(body.resolutions)) {
                return sendError(c, 'Resolutions array is required', 400, 'VALIDATION_ERROR');
            }

            const syncService = new SyncService({
                googleTasks: new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                    scopes: ['https://www.googleapis.com/auth/tasks']
                }),
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const result = await syncService.resolveConflicts(userId, body.resolutions);

            return sendResponse(c, result);
        } catch (error) {
            return sendError(c, error.message, 500, 'RESOLVE_CONFLICTS_ERROR');
        }
    },

    /**
     * Force sync specific task
     */
    async forceSyncTask(c: Context) {
        try {
            const userId = getUserId(c);
            const taskId = c.req.param('taskId');

            const syncService = new SyncService({
                googleTasks: new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                    scopes: ['https://www.googleapis.com/auth/tasks']
                }),
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const result = await syncService.forceSyncTask(userId, taskId);

            return sendResponse(c, result);
        } catch (error) {
            return sendError(c, error.message, 500, 'FORCE_SYNC_ERROR');
        }
    },

    /**
     * Get offline queue
     */
    async getOfflineQueue(c: Context) {
        try {
            const userId = getUserId(c);
            const changes = await ChangeModel.getPendingChanges(userId);

            return sendResponse(c, changes);
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_QUEUE_ERROR');
        }
    },

    /**
     * Process offline queue
     */
    async processOfflineQueue(c: Context) {
        try {
            const userId = getUserId(c);

            const syncService = new SyncService({
                googleTasks: new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                    scopes: ['https://www.googleapis.com/auth/tasks']
                }),
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const result = await syncService.processOfflineQueue(userId);

            return sendResponse(c, result);
        } catch (error) {
            return sendError(c, error.message, 500, 'PROCESS_QUEUE_ERROR');
        }
    },

    /**
     * Get task statistics
     */
    async getTaskStats(c: Context) {
        try {
            const userId = getUserId(c);
            const stats = await TaskModel.getTaskStats(userId);

            return sendResponse(c, stats);
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_STATS_ERROR');
        }
    },

    /**
     * Get sync statistics
     */
    async getSyncStats(c: Context) {
        try {
            const userId = getUserId(c);

            const syncService = new SyncService({
                googleTasks: new GoogleTasksService({
                    clientId: process.env.GOOGLE_CLIENT_ID || '',
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                    redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
                    scopes: ['https://www.googleapis.com/auth/tasks']
                }),
                conflictResolution: 'local',
                retryAttempts: 3,
                retryDelay: 1000,
                batchSize: 50
            });

            const stats = await syncService.getSyncStats(userId);

            return sendResponse(c, stats);
        } catch (error) {
            return sendError(c, error.message, 500, 'GET_SYNC_STATS_ERROR');
        }
    }
};
