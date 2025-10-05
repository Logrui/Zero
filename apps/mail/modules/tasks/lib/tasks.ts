/**
 * Tasks Module - TRPC Client
 * 
 * Simple client for tasks operations using TRPC.
 * Follows the same pattern as calendar module for consistency.
 */

import { trpcClient } from '@/providers/query-provider';

export type Task = {
    id: string;
    googleTaskId: string | null;
    userId: string;
    title: string;
    description: string | null;
    status: 'needsAction' | 'completed';
    due: Date | null;
    priority: 'low' | 'normal' | 'high';
    notes: string | null;
    labels: string[];
    createdAt: Date;
    updatedAt: Date;
};

export type CreateTaskData = {
    title: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date | string;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
};

export type UpdateTaskData = {
    title?: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date | string;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
};

export type TaskFilters = {
    status?: 'needsAction' | 'completed';
    priority?: 'low' | 'normal' | 'high';
};

/**
 * Get all tasks with optional filters
 */
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
    console.log('🔍 [tasks.getTasks] Starting request', { filters });

    try {
        console.log('🌐 [tasks.getTasks] Making TRPC call...');
        const data = await trpcClient.tasks.getTasks.query(filters);
        console.log('✅ [tasks.getTasks] Response received', {
            taskCount: data?.length || 0,
            data: data,
            type: typeof data,
            isArray: Array.isArray(data)
        });
        return data as any as Task[];
    } catch (e) {
        console.error('❌ [tasks.getTasks] failed', e);
        console.error('❌ [tasks.getTasks] Error details:', {
            message: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
            name: e instanceof Error ? e.name : undefined
        });
        return [];
    }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
    console.log('🔍 [tasks.getTask] Starting request', { id });

    try {
        const data = await trpcClient.tasks.getTask.query({ id });
        console.log('✅ [tasks.getTask] Response received', { found: !!data });
        return data as any as Task | null;
    } catch (e) {
        console.error('❌ [tasks.getTask] failed', e);
        return null;
    }
}

/**
 * Create a new task
 */
export async function createTask(taskData: CreateTaskData): Promise<Task> {
    console.log('🔍 [tasks.createTask] Starting request', {
        title: taskData.title,
    });

    try {
        const data = await trpcClient.tasks.createTask.mutate(taskData as any);
        console.log('✅ [tasks.createTask] Task created', { id: (data as any).id });
        return data as any as Task;
    } catch (e) {
        console.error('❌ [tasks.createTask] failed', e);
        throw e;
    }
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, taskData: UpdateTaskData): Promise<Task> {
    console.log('🔍 [tasks.updateTask] Starting request', { id });

    try {
        const data = await trpcClient.tasks.updateTask.mutate({
            id,
            data: taskData as any,
        });
        console.log('✅ [tasks.updateTask] Task updated', { id });
        return data as any as Task;
    } catch (e) {
        console.error('❌ [tasks.updateTask] failed', e);
        throw e;
    }
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<boolean> {
    console.log('🔍 [tasks.deleteTask] Starting request', { id });

    try {
        await trpcClient.tasks.deleteTask.mutate({ id });
        console.log('✅ [tasks.deleteTask] Task deleted', { id });
        return true;
    } catch (e) {
        console.error('❌ [tasks.deleteTask] failed', e);
        return false;
    }
}

/**
 * Toggle task completion status
 */
export async function toggleTask(id: string): Promise<Task> {
    console.log('🔍 [tasks.toggleTask] Starting request', { id });

    try {
        const data = await trpcClient.tasks.toggleTask.mutate({ id });
        console.log('✅ [tasks.toggleTask] Task toggled', {
            id,
            newStatus: (data as any).status,
        });
        return data as any as Task;
    } catch (e) {
        console.error('❌ [tasks.toggleTask] failed', e);
        throw e;
    }
}

/**
 * Sync tasks with Google Tasks
 */
export async function syncWithGoogleTasks(): Promise<{
    success: boolean;
    syncedCount: number;
    errors: string[];
}> {
    console.log('🔍 [tasks.syncWithGoogleTasks] Starting sync');

    try {
        const data = await trpcClient.tasks.syncWithGoogleTasks.mutate();
        console.log('✅ [tasks.syncWithGoogleTasks] Sync complete', { data });
        return data as any;
    } catch (e) {
        console.error('❌ [tasks.syncWithGoogleTasks] failed', e);
        console.error('❌ [tasks.syncWithGoogleTasks] Error details:', {
            message: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
            name: e instanceof Error ? e.name : undefined
        });
        return { success: false, syncedCount: 0, errors: [String(e)] };
    }
}

/**
 * Get sync status and statistics
 */
export async function getSyncStatus(): Promise<{
    isOnline: boolean;
    lastSync: Date | null;
    pendingChanges: number;
    syncedTasks: number;
    totalTasks: number;
}> {
    console.log('🔍 [tasks.getSyncStatus] Starting request');

    try {
        console.log('🌐 [tasks.getSyncStatus] Making TRPC call...');
        const data = await trpcClient.tasks.getSyncStatus.query();
        console.log('✅ [tasks.getSyncStatus] Response received', {
            data,
            type: typeof data,
            keys: data ? Object.keys(data) : []
        });
        return data as any;
    } catch (e) {
        console.error('❌ [tasks.getSyncStatus] failed', e);
        console.error('❌ [tasks.getSyncStatus] Error details:', {
            message: e instanceof Error ? e.message : String(e),
            stack: e instanceof Error ? e.stack : undefined,
            name: e instanceof Error ? e.name : undefined
        });
        return {
            isOnline: false,
            lastSync: null,
            pendingChanges: 0,
            syncedTasks: 0,
            totalTasks: 0,
        };
    }
}

