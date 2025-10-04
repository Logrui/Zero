import { Hono } from 'hono';
import { tasksHandlers } from './handlers';
import { checkPermissions, getReauthUrl } from './permissions';

/**
 * Tasks API Routes
 * 
 * RESTful API routes for task CRUD operations with Google Tasks integration.
 * Provides endpoints for task management, synchronization, and OAuth.
 */

const tasksRouter = new Hono();

// Permission and authentication endpoints
tasksRouter.get('/permissions/check', checkPermissions);
tasksRouter.get('/permissions/reauth-url', getReauthUrl);

// Task CRUD operations
tasksRouter.get('/tasks', tasksHandlers.getTasks);
tasksRouter.get('/tasks/:id', tasksHandlers.getTask);
tasksRouter.post('/tasks', tasksHandlers.createTask);
tasksRouter.put('/tasks/:id', tasksHandlers.updateTask);
tasksRouter.delete('/tasks/:id', tasksHandlers.deleteTask);

// Subtask operations
tasksRouter.get('/tasks/:id/subtasks', tasksHandlers.getSubtasks);
tasksRouter.post('/tasks/:id/subtasks', tasksHandlers.createSubtask);
tasksRouter.put('/tasks/:id/subtasks/:subtaskId', tasksHandlers.updateSubtask);
tasksRouter.delete('/tasks/:id/subtasks/:subtaskId', tasksHandlers.deleteSubtask);
tasksRouter.put('/tasks/:id/subtasks/reorder', tasksHandlers.reorderSubtasks);

// Google Tasks OAuth
tasksRouter.get('/auth/google-tasks', tasksHandlers.getGoogleTasksAuthUrl);
tasksRouter.post('/auth/google-tasks/callback', tasksHandlers.handleGoogleTasksCallback);
tasksRouter.delete('/auth/google-tasks', tasksHandlers.disconnectGoogleTasks);

// Synchronization
tasksRouter.post('/sync', tasksHandlers.syncTasks);
tasksRouter.get('/sync/status', tasksHandlers.getSyncStatus);
tasksRouter.post('/sync/conflicts/resolve', tasksHandlers.resolveConflicts);
tasksRouter.post('/sync/force/:taskId', tasksHandlers.forceSyncTask);

// Offline queue
tasksRouter.get('/sync/queue', tasksHandlers.getOfflineQueue);
tasksRouter.post('/sync/queue/process', tasksHandlers.processOfflineQueue);

// Statistics
tasksRouter.get('/stats', tasksHandlers.getTaskStats);
tasksRouter.get('/sync/stats', tasksHandlers.getSyncStats);

export { tasksRouter };
