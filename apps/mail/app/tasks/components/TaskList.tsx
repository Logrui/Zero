/**
 * Task List Component
 * 
 * Displays a list of tasks with filtering, sorting, and virtual scrolling.
 * Features minimalist design with basic task information.
 */

'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
    CreateTaskData,
    TaskFilters as TaskFiltersType,
    TaskSortOptions,
    TaskWithRelations,
    UpdateTaskData
} from '../types/task';
import { TaskItem } from './TaskItem';

export interface TaskListProps {
    tasks: TaskWithRelations[];
    loading?: boolean;
    error?: string;
    onTaskClick: (task: TaskWithRelations) => void;
    onTaskCreate: (data: CreateTaskData) => void;
    onTaskUpdate: (id: string, data: UpdateTaskData) => void;
    onTaskDelete: (id: string) => void;
    onTaskToggle: (id: string) => void;
    filters?: TaskFiltersType;
    onFiltersChange?: (filters: TaskFiltersType) => void;
}

export function TaskList({
    tasks,
    loading = false,
    error,
    onTaskClick,
    onTaskCreate,
    onTaskUpdate,
    onTaskDelete,
    onTaskToggle,
    filters = {},
    onFiltersChange
}: TaskListProps) {
    const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
        field: 'due',
        direction: 'asc'
    });

    // Filter and sort tasks
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = [...tasks];

        // Apply filters
        if (filters.status) {
            filtered = filtered.filter(task => task.status === filters.status);
        }
        if (filters.priority) {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }
        if (filters.workspace) {
            filtered = filtered.filter(task =>
                task.zeroosExtension?.workspace === filters.workspace
            );
        }
        if (filters.labels && filters.labels.length > 0) {
            filtered = filtered.filter(task =>
                filters.labels!.some(label => task.labels.includes(label))
            );
        }
        if (filters.dueBefore) {
            filtered = filtered.filter(task =>
                task.due && new Date(task.due) <= new Date(filters.dueBefore!)
            );
        }
        if (filters.dueAfter) {
            filtered = filtered.filter(task =>
                task.due && new Date(task.due) >= new Date(filters.dueAfter!)
            );
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower)) ||
                (task.notes && task.notes.toLowerCase().includes(searchLower))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortOptions.field) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'due':
                    aValue = a.due || new Date('9999-12-31');
                    bValue = b.due || new Date('9999-12-31');
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, normal: 2, low: 1 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'status':
                    aValue = a.status === 'completed' ? 1 : 0;
                    bValue = b.status === 'completed' ? 1 : 0;
                    break;
                case 'createdAt':
                    aValue = new Date(a.createdAt);
                    bValue = new Date(b.createdAt);
                    break;
                case 'updatedAt':
                    aValue = new Date(a.updatedAt);
                    bValue = new Date(b.updatedAt);
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [tasks, filters, sortOptions]);

    // Handle sort change
    const handleSortChange = useCallback((newSort: TaskSortOptions) => {
        setSortOptions(newSort);
    }, []);

    // Handle filter change
    const handleFilterChange = useCallback((newFilters: TaskFiltersType) => {
        onFiltersChange?.(newFilters);
    }, [onFiltersChange]);

    // Render task item
    const renderTaskItem = useCallback((task: TaskWithRelations, index: number) => (
        <TaskItem
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onToggle={onTaskToggle}
            onUpdate={onTaskUpdate}
            onDelete={onTaskDelete}
        />
    ), [onTaskClick, onTaskToggle, onTaskUpdate, onTaskDelete]);

    // Loading state
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4 animate-pulse">
                        <div className="w-5 h-5 bg-muted rounded"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-6 bg-muted rounded-full w-16"></div>
                            <div className="h-6 bg-muted rounded-full w-20"></div>
                            <div className="h-8 w-8 bg-muted rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-destructive">Error loading tasks</h3>
                        <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (filteredAndSortedTasks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-muted-foreground">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-foreground">No tasks found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {Object.keys(filters).length > 0
                        ? 'Try adjusting your filters to see more tasks.'
                        : 'Get started by creating your first task.'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {filteredAndSortedTasks.map((task) => (
                <div
                    key={task.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card/50 p-4 hover:bg-accent/50 transition-colors"
                >
                    <button
                        onClick={() => onTaskToggle(task.id)}
                        className="flex-shrink-0"
                    >
                        {task.status === 'completed' ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5 text-green-500"
                            >
                                <path d="M9 12l2 2 4-4" />
                                <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5 text-muted-foreground"
                            >
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3
                                className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}
                                onClick={() => onTaskClick(task)}
                            >
                                {task.title}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.due && (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-3 w-3"
                                    >
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                        <line x1="16" x2="16" y1="2" y2="6" />
                                        <line x1="8" x2="8" y1="2" y2="6" />
                                        <line x1="3" x2="21" y1="10" y2="10" />
                                    </svg>
                                    <span>{new Date(task.due).toLocaleDateString()}</span>
                                </>
                            )}
                            {task.notes && (
                                <>
                                    <span>•</span>
                                    <span className="truncate">{task.notes}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {task.priority && (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${task.priority === 'high'
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : task.priority === 'normal'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                }`}>
                                {task.priority}
                            </span>
                        )}
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${task.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}>
                            {task.status}
                        </span>
                        <button
                            onClick={() => onTaskClick(task)}
                            className="h-8 w-8 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
