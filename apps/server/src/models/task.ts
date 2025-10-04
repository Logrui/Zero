import { asc, desc, eq } from 'drizzle-orm';
import type { Change, InsertSubtask, InsertSyncState, InsertZeroosTaskExtension, Subtask, SyncState, Task, ZeroosTaskExtension } from '../db/schema';
import { changes, subtasks, syncStates, tasks, zeroosTaskExtensions } from '../db/schema';
import { getZeroDB } from '../lib/server-utils';

/**
 * Task Model
 * 
 * Handles task operations with Google Tasks compatibility and ZeroOS extensions.
 * Provides validation, state transitions, and relationship management.
 */

export interface TaskWithRelations extends Task {
    subtasks?: Subtask[];
    zeroosExtension?: ZeroosTaskExtension;
    syncState?: SyncState;
    changes?: Change[];
}

export interface CreateTaskData {
    userId: string;
    title: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
    googleTaskId?: string;
    subtasks?: Omit<InsertSubtask, 'taskId'>[];
    zeroosExtension?: Omit<InsertZeroosTaskExtension, 'taskId'>;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date | null;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
    googleTaskId?: string;
}

export interface TaskFilters {
    userId: string;
    status?: 'needsAction' | 'completed';
    priority?: 'low' | 'normal' | 'high';
    workspace?: string;
    labels?: string[];
    dueBefore?: Date;
    dueAfter?: Date;
    search?: string;
}

export class TaskModel {
    /**
     * Create a new task with optional subtasks and ZeroOS extension
     */
    static async create(data: CreateTaskData): Promise<TaskWithRelations> {
        // Validate required fields
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Task title is required');
        }

        if (data.title.length > 200) {
            throw new Error('Task title must be 200 characters or less');
        }

        // Validate due date if provided
        if (data.due && data.due < new Date()) {
            throw new Error('Due date cannot be in the past');
        }

        // Validate priority
        if (data.priority && !['low', 'normal', 'high'].includes(data.priority)) {
            throw new Error('Invalid priority value');
        }

        // Validate status
        if (data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }

        // Create task
        const db = await getZeroDB(data.userId);
        const [task] = await db.insert(tasks).values({
            userId: data.userId,
            title: data.title.trim(),
            description: data.description,
            status: data.status || 'needsAction',
            due: data.due,
            priority: data.priority || 'normal',
            notes: data.notes,
            labels: data.labels || [],
            googleTaskId: data.googleTaskId
        }).returning();

        // Create subtasks if provided
        if (data.subtasks && data.subtasks.length > 0) {
            const subtaskData = data.subtasks.map((subtask, index) => ({
                ...subtask,
                taskId: task.id,
                position: index
            }));

            await db.insert(subtasks).values(subtaskData);
        }

        // Create ZeroOS extension if provided
        if (data.zeroosExtension) {
            await db.insert(zeroosTaskExtensions).values({
                ...data.zeroosExtension,
                taskId: task.id
            });
        }

        // Create sync state
        await db.insert(syncStates).values({
            taskId: task.id,
            conflictResolution: 'pending'
        });

        return this.getById(task.id);
    }

    /**
     * Get task by ID with all relations
     */
    static async getById(taskId: string, userId?: string): Promise<TaskWithRelations | null> {
        if (!userId) {
            // If no userId provided, we need to get it from the task
            const tempDb = await getZeroDB('temp'); // This will be replaced with proper user lookup
            const task = await tempDb.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
            if (task.length === 0) return null;
            userId = task[0].userId;
        }
        
        const db = await getZeroDB(userId);
        const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

        if (task.length === 0) {
            return null;
        }

        const taskData = task[0];

        // Get subtasks
        const taskSubtasks = await db.select()
            .from(subtasks)
            .where(eq(subtasks.taskId, taskId))
            .orderBy(asc(subtasks.position));

        // Get ZeroOS extension
        const taskExtension = await db.select()
            .from(zeroosTaskExtensions)
            .where(eq(zeroosTaskExtensions.taskId, taskId))
            .limit(1);

        // Get sync state
        const taskSyncState = await db.select()
            .from(syncStates)
            .where(eq(syncStates.taskId, taskId))
            .limit(1);

        // Get pending changes
        const taskChanges = await db.select()
            .from(changes)
            .where(eq(changes.taskId, taskId))
            .orderBy(asc(changes.timestamp));

        return {
            ...taskData,
            subtasks: taskSubtasks,
            zeroosExtension: taskExtension[0] || undefined,
            syncState: taskSyncState[0] || undefined,
            changes: taskChanges
        };
    }

    /**
     * Update task with validation
     */
    static async update(taskId: string, data: UpdateTaskData): Promise<TaskWithRelations> {
        // Validate title if provided
        if (data.title !== undefined) {
            if (!data.title || data.title.trim().length === 0) {
                throw new Error('Task title is required');
            }
            if (data.title.length > 200) {
                throw new Error('Task title must be 200 characters or less');
            }
        }

        // Validate due date if provided
        if (data.due !== undefined && data.due && data.due < new Date()) {
            throw new Error('Due date cannot be in the past');
        }

        // Validate priority if provided
        if (data.priority && !['low', 'normal', 'high'].includes(data.priority)) {
            throw new Error('Invalid priority value');
        }

        // Validate status if provided
        if (data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }

        // Update task
        const [updatedTask] = await db.update(tasks)
            .set({
                ...data,
                title: data.title?.trim(),
                updatedAt: new Date()
            })
            .where(eq(tasks.id, taskId))
            .returning();

        if (!updatedTask) {
            throw new Error('Task not found');
        }

        // Queue change for sync
        await this.queueChange(taskId, 'update', data);

        return this.getById(taskId);
    }

    /**
     * Delete task and all related data
     */
    static async delete(taskId: string): Promise<void> {
        // Queue deletion for sync
        await this.queueChange(taskId, 'delete', { id: taskId });

        // Delete task (cascades to subtasks, extensions, sync states, changes)
        await db.delete(tasks).where(eq(tasks.id, taskId));
    }

    /**
     * Get tasks with filtering and pagination
     */
    static async getTasks(filters: TaskFilters, limit: number = 50, offset: number = 0): Promise<TaskWithRelations[]> {
        let query = db.select().from(tasks).where(eq(tasks.userId, filters.userId));

        // Apply filters
        if (filters.status) {
            query = query.where(eq(tasks.status, filters.status));
        }

        if (filters.priority) {
            query = query.where(eq(tasks.priority, filters.priority));
        }

        if (filters.dueBefore) {
            query = query.where(eq(tasks.due, filters.dueBefore));
        }

        if (filters.dueAfter) {
            query = query.where(eq(tasks.due, filters.dueAfter));
        }

        if (filters.labels && filters.labels.length > 0) {
            query = query.where(eq(tasks.labels, filters.labels));
        }

        if (filters.search) {
            query = query.where(eq(tasks.title, filters.search));
        }

        // Apply ordering and pagination
        const results = await query
            .orderBy(asc(tasks.priority), asc(tasks.due), desc(tasks.createdAt))
            .limit(limit)
            .offset(offset);

        // Get relations for each task
        const tasksWithRelations: TaskWithRelations[] = [];
        for (const task of results) {
            const taskWithRelations = await this.getById(task.id);
            if (taskWithRelations) {
                tasksWithRelations.push(taskWithRelations);
            }
        }

        return tasksWithRelations;
    }

    /**
     * Get tasks by Google Tasks ID
     */
    static async getByGoogleTaskId(googleTaskId: string): Promise<TaskWithRelations | null> {
        const task = await db.select()
            .from(tasks)
            .where(eq(tasks.googleTaskId, googleTaskId))
            .limit(1);

        if (task.length === 0) {
            return null;
        }

        return this.getById(task[0].id);
    }

    /**
     * Get tasks that need sync
     */
    static async getTasksNeedingSync(userId: string): Promise<TaskWithRelations[]> {
        const tasksWithChanges = await db.select()
            .from(tasks)
            .innerJoin(changes, eq(changes.taskId, tasks.id))
            .where(eq(tasks.userId, userId));

        const tasksWithRelations: TaskWithRelations[] = [];
        for (const { tasks: task } of tasksWithChanges) {
            const taskWithRelations = await this.getById(task.id);
            if (taskWithRelations) {
                tasksWithRelations.push(taskWithRelations);
            }
        }

        return tasksWithRelations;
    }

    /**
     * Queue a change for offline sync
     */
    static async queueChange(taskId: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
        await db.insert(changes).values({
            taskId,
            operation,
            data,
            timestamp: new Date()
        });
    }

    /**
     * Mark change as processed
     */
    static async markChangeProcessed(changeId: string): Promise<void> {
        await db.delete(changes).where(eq(changes.id, changeId));
    }

    /**
     * Update sync state
     */
    static async updateSyncState(taskId: string, syncData: Partial<InsertSyncState>): Promise<void> {
        await db.update(syncStates)
            .set({
                ...syncData,
                updatedAt: new Date()
            })
            .where(eq(syncStates.taskId, taskId));
    }

    /**
     * Get sync state for task
     */
    static async getSyncState(taskId: string): Promise<SyncState | null> {
        const syncState = await db.select()
            .from(syncStates)
            .where(eq(syncStates.taskId, taskId))
            .limit(1);

        return syncState[0] || null;
    }

    /**
     * Validate task data
     */
    static validateTaskData(data: CreateTaskData | UpdateTaskData): void {
        if ('title' in data && data.title !== undefined) {
            if (!data.title || data.title.trim().length === 0) {
                throw new Error('Task title is required');
            }
            if (data.title.length > 200) {
                throw new Error('Task title must be 200 characters or less');
            }
        }

        if ('due' in data && data.due !== undefined && data.due && data.due < new Date()) {
            throw new Error('Due date cannot be in the past');
        }

        if ('priority' in data && data.priority && !['low', 'normal', 'high'].includes(data.priority)) {
            throw new Error('Invalid priority value');
        }

        if ('status' in data && data.status && !['needsAction', 'completed'].includes(data.status)) {
            throw new Error('Invalid status value');
        }
    }

    /**
     * Get task statistics for user
     */
    static async getTaskStats(userId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        overdue: number;
    }> {
        const allTasks = await db.select()
            .from(tasks)
            .where(eq(tasks.userId, userId));

        const now = new Date();
        const completed = allTasks.filter(task => task.status === 'completed').length;
        const pending = allTasks.filter(task => task.status === 'needsAction').length;
        const overdue = allTasks.filter(task =>
            task.status === 'needsAction' &&
            task.due &&
            task.due < now
        ).length;

        return {
            total: allTasks.length,
            completed,
            pending,
            overdue
        };
    }
}
