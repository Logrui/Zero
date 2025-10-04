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
import { TaskFilters } from './TaskFilters';
import { TaskItem } from './TaskItem';
import { TaskSort } from './TaskSort';
import { VirtualScroll } from './VirtualScroll';

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
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                        <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (filteredAndSortedTasks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                <p className="mt-1 text-sm text-gray-500">
                    {Object.keys(filters).length > 0
                        ? 'Try adjusting your filters to see more tasks.'
                        : 'Get started by creating your first task.'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <TaskFilters
                    filters={filters}
                    onFiltersChange={handleFilterChange}
                />
                <TaskSort
                    sortOptions={sortOptions}
                    onSortChange={handleSortChange}
                />
            </div>

            {/* Task List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <VirtualScroll
                    items={filteredAndSortedTasks}
                    itemHeight={80}
                    containerHeight={600}
                    renderItem={renderTaskItem}
                />
            </div>

            {/* Task Count */}
            <div className="text-sm text-gray-500 text-center">
                Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
            </div>
        </div>
    );
}
