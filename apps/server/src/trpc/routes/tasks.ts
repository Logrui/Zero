import { z } from 'zod';
import { TasksManager } from '../../lib/tasks-manager';
import { privateProcedure, router } from '../trpc';

/**
 * Tasks TRPC Router
 * 
 * Provides type-safe API for task management with Google Tasks sync.
 * Follows the same pattern as calendar router for consistency.
 */

export const tasksRouter = router({
    /**
     * Get all tasks for the authenticated user
     */
    getTasks: privateProcedure
        .input(
            z.object({
                status: z.enum(['needsAction', 'completed']).optional(),
                priority: z.enum(['low', 'normal', 'high']).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.getTasks] Starting request', {
                userId: ctx.sessionUser.id,
                filters: input,
            });

            const tasksManager = new TasksManager();
            const tasks = await tasksManager.getTasks(ctx.sessionUser.id, input);

            console.log('✅ [tRPC.tasks.getTasks] Response ready', {
                userId: ctx.sessionUser.id,
                taskCount: tasks?.length || 0,
            });

            return tasks;
        }),

    /**
     * Get a single task by ID
     */
    getTask: privateProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.getTask] Starting request', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            const tasksManager = new TasksManager();
            const task = await tasksManager.getTask(ctx.sessionUser.id, input.id);

            console.log('✅ [tRPC.tasks.getTask] Response ready', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
                found: !!task,
            });

            return task;
        }),

    /**
     * Create a new task
     */
    createTask: privateProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                status: z.enum(['needsAction', 'completed']).default('needsAction'),
                due: z.string().optional(), // ISO 8601 date string
                priority: z.enum(['low', 'normal', 'high']).default('normal'),
                notes: z.string().optional(),
                labels: z.array(z.string()).default([]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.createTask] Starting request', {
                userId: ctx.sessionUser.id,
                title: input.title,
            });

            const tasksManager = new TasksManager();
            const task = await tasksManager.createTask(ctx.sessionUser.id, input);

            console.log('✅ [tRPC.tasks.createTask] Task created', {
                userId: ctx.sessionUser.id,
                taskId: task.id,
            });

            return task;
        }),

    /**
     * Update an existing task
     */
    updateTask: privateProcedure
        .input(
            z.object({
                id: z.string(),
                data: z.object({
                    title: z.string().min(1).max(200).optional(),
                    description: z.string().optional(),
                    status: z.enum(['needsAction', 'completed']).optional(),
                    due: z.string().optional(),
                    priority: z.enum(['low', 'normal', 'high']).optional(),
                    notes: z.string().optional(),
                    labels: z.array(z.string()).optional(),
                }),
            })
        )
        .mutation(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.updateTask] Starting request', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            const tasksManager = new TasksManager();
            const task = await tasksManager.updateTask(ctx.sessionUser.id, input.id, input.data);

            console.log('✅ [tRPC.tasks.updateTask] Task updated', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            return task;
        }),

    /**
     * Delete a task
     */
    deleteTask: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.deleteTask] Starting request', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            const tasksManager = new TasksManager();
            await tasksManager.deleteTask(ctx.sessionUser.id, input.id);

            console.log('✅ [tRPC.tasks.deleteTask] Task deleted', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            return { success: true };
        }),

    /**
     * Toggle task completion status
     */
    toggleTask: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            console.log('🔍 [tRPC.tasks.toggleTask] Starting request', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
            });

            const tasksManager = new TasksManager();
            const task = await tasksManager.toggleTask(ctx.sessionUser.id, input.id);

            console.log('✅ [tRPC.tasks.toggleTask] Task toggled', {
                userId: ctx.sessionUser.id,
                taskId: input.id,
                newStatus: task.status,
            });

            return task;
        }),

    /**
     * Sync tasks with Google Tasks
     */
    syncWithGoogleTasks: privateProcedure
        .mutation(async ({ ctx }) => {
            console.log('🔍 [tRPC.tasks.syncWithGoogleTasks] Starting sync', {
                userId: ctx.sessionUser.id,
            });

            const tasksManager = new TasksManager();
            const result = await tasksManager.syncWithGoogleTasks(ctx.sessionUser.id);

            console.log('✅ [tRPC.tasks.syncWithGoogleTasks] Sync complete', {
                userId: ctx.sessionUser.id,
                result,
            });

            return result;
        }),

    /**
     * Get sync status and statistics
     */
    getSyncStatus: privateProcedure
        .query(async ({ ctx }) => {
            console.log('🔍 [tRPC.tasks.getSyncStatus] Starting request', {
                userId: ctx.sessionUser.id,
            });

            const tasksManager = new TasksManager();
            const status = await tasksManager.getSyncStatus(ctx.sessionUser.id);

            console.log('✅ [tRPC.tasks.getSyncStatus] Response ready', {
                userId: ctx.sessionUser.id,
                status,
            });

            return status;
        }),
});

