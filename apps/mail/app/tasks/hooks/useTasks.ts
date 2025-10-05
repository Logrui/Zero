/**
 * useTasks Hook
 * 
 * Custom hook for managing tasks state and operations.
 * Handles CRUD operations, loading states, and error handling.
 * Updated to use TRPC instead of REST API.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { createTask, deleteTask, getTasks, toggleTask, updateTask } from '../../../modules/tasks/lib/tasks';
import type {
    CreateTaskData,
    TaskWithRelations,
    UpdateTaskData,
    UseTasksReturn
} from '../types/task';

export function useTasks(): UseTasksReturn {
    const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
        console.log('🔍 [useTasks.fetchTasks] Starting task fetch');
        try {
            setLoading(true);
            setError(null);
            console.log('🌐 [useTasks.fetchTasks] Calling getTasks()');
            const fetchedTasks = await getTasks();
            console.log('✅ [useTasks.fetchTasks] Tasks received:', {
                count: fetchedTasks?.length || 0,
                tasks: fetchedTasks?.map(t => ({ id: t.id, title: t.title })) || []
            });
            setTasks(fetchedTasks as TaskWithRelations[]);
        } catch (err) {
            console.error('❌ [useTasks.fetchTasks] Failed to fetch tasks:', err);
            console.error('❌ [useTasks.fetchTasks] Error details:', {
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined,
                name: err instanceof Error ? err.name : undefined
            });
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create task
    const createTaskHandler = useCallback(async (data: CreateTaskData) => {
        try {
            setError(null);
            const newTask = await createTask(data);
            setTasks(prev => [...prev, newTask as TaskWithRelations]);
        } catch (err) {
            console.error('Failed to create task:', err);
            setError(err instanceof Error ? err.message : 'Failed to create task');
            throw err;
        }
    }, []);

    // Update task
    const updateTaskHandler = useCallback(async (id: string, data: UpdateTaskData) => {
        try {
            setError(null);
            const updatedTask = await updateTask(id, data);
            setTasks(prev => prev.map(task =>
                task.id === id ? updatedTask as TaskWithRelations : task
            ));
        } catch (err) {
            console.error('Failed to update task:', err);
            setError(err instanceof Error ? err.message : 'Failed to update task');
            throw err;
        }
    }, []);

    // Delete task
    const deleteTaskHandler = useCallback(async (id: string) => {
        try {
            setError(null);
            await deleteTask(id);
            setTasks(prev => prev.filter(task => task.id !== id));
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete task');
            throw err;
        }
    }, []);

    // Toggle task completion
    const toggleTaskHandler = useCallback(async (id: string) => {
        try {
            setError(null);
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const updatedTask = await toggleTask(id);
            setTasks(prev => prev.map(t =>
                t.id === id ? updatedTask as TaskWithRelations : t
            ));
        } catch (err) {
            console.error('Failed to toggle task:', err);
            setError(err instanceof Error ? err.message : 'Failed to toggle task');
            throw err;
        }
    }, [tasks]);

    // Refresh tasks
    const refreshTasks = useCallback(async () => {
        await fetchTasks();
    }, [fetchTasks]);

    // Initial fetch
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return {
        tasks,
        loading,
        error,
        createTask: createTaskHandler,
        updateTask: updateTaskHandler,
        deleteTask: deleteTaskHandler,
        toggleTask: toggleTaskHandler,
        refreshTasks
    };
}
