/**
 * useTasks Hook
 * 
 * Custom hook for managing tasks state and operations.
 * Handles CRUD operations, loading states, and error handling.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { googleTasksApi } from '../services/googleTasksApi';
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
        try {
            setLoading(true);
            setError(null);
            const fetchedTasks = await googleTasksApi.getTasks();
            setTasks(fetchedTasks);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create task
    const createTask = useCallback(async (data: CreateTaskData) => {
        try {
            setError(null);
            const newTask = await googleTasksApi.createTask(data);
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error('Failed to create task:', err);
            setError(err instanceof Error ? err.message : 'Failed to create task');
            throw err;
        }
    }, []);

    // Update task
    const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
        try {
            setError(null);
            const updatedTask = await googleTasksApi.updateTask(id, data);
            setTasks(prev => prev.map(task =>
                task.id === id ? updatedTask : task
            ));
        } catch (err) {
            console.error('Failed to update task:', err);
            setError(err instanceof Error ? err.message : 'Failed to update task');
            throw err;
        }
    }, []);

    // Delete task
    const deleteTask = useCallback(async (id: string) => {
        try {
            setError(null);
            await googleTasksApi.deleteTask(id);
            setTasks(prev => prev.filter(task => task.id !== id));
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete task');
            throw err;
        }
    }, []);

    // Toggle task completion
    const toggleTask = useCallback(async (id: string) => {
        try {
            setError(null);
            const task = tasks.find(t => t.id === id);
            if (!task) return;

            const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
            await updateTask(id, { status: newStatus });
        } catch (err) {
            console.error('Failed to toggle task:', err);
            setError(err instanceof Error ? err.message : 'Failed to toggle task');
            throw err;
        }
    }, [tasks, updateTask]);

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
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        refreshTasks
    };
}
