import { Hono } from 'hono';
import { tasksHandlers } from './handlers';

/**
 * Tasks API Routes
 * 
 * RESTful API routes for task CRUD operations with Google Tasks integration.
 * Provides endpoints for task management, synchronization, and OAuth.
 */

const tasksRouter = new Hono();

// Permission and authentication endpoints - removed (using better-auth)

// Task CRUD operations - using /list to avoid route conflicts
tasksRouter.get('/list', tasksHandlers.getTasks);
tasksRouter.get('/item/:id', tasksHandlers.getTask);
tasksRouter.post('/item', tasksHandlers.createTask);
tasksRouter.put('/item/:id', tasksHandlers.updateTask);
tasksRouter.delete('/item/:id', tasksHandlers.deleteTask);

// Subtask operations
tasksRouter.get('/item/:id/subtasks', tasksHandlers.getSubtasks);
tasksRouter.post('/item/:id/subtasks', tasksHandlers.createSubtask);
tasksRouter.put('/item/:id/subtasks/:subtaskId', tasksHandlers.updateSubtask);
tasksRouter.delete('/item/:id/subtasks/:subtaskId', tasksHandlers.deleteSubtask);
tasksRouter.put('/item/:id/subtasks/reorder', tasksHandlers.reorderSubtasks);

// Google Tasks OAuth - handled by better-auth system
// Removed custom OAuth handlers in favor of standardized better-auth flow

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

