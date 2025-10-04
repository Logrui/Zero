/**
 * Task Sort Component
 * 
 * Sort controls for tasks list.
 * Handles sorting by different fields and directions.
 */

'use client';

import { useCallback, useState } from 'react';
import type { TaskSortOptions } from '../types/task';

export interface TaskSortProps {
    sortOptions: TaskSortOptions;
    onSortChange: (sort: TaskSortOptions) => void;
}

export function TaskSort({
    sortOptions,
    onSortChange
}: TaskSortProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handle sort change
    const handleSortChange = useCallback((field: TaskSortOptions['field'], direction: TaskSortOptions['direction']) => {
        onSortChange({ field, direction });
    }, [onSortChange]);

    // Handle field change
    const handleFieldChange = useCallback((field: TaskSortOptions['field']) => {
        onSortChange({ ...sortOptions, field });
    }, [sortOptions, onSortChange]);

    // Handle direction change
    const handleDirectionChange = useCallback((direction: TaskSortOptions['direction']) => {
        onSortChange({ ...sortOptions, direction });
    }, [sortOptions, onSortChange]);

    // Handle direction toggle
    const handleDirectionToggle = useCallback(() => {
        onSortChange({
            ...sortOptions,
            direction: sortOptions.direction === 'asc' ? 'desc' : 'asc'
        });
    }, [sortOptions, onSortChange]);

    // Get sort label
    const getSortLabel = useCallback(() => {
        const fieldLabels: Record<TaskSortOptions['field'], string> = {
            title: 'Title',
            due: 'Due Date',
            priority: 'Priority',
            status: 'Status',
            createdAt: 'Created',
            updatedAt: 'Updated'
        };

        const directionLabels: Record<TaskSortOptions['direction'], string> = {
            asc: '↑',
            desc: '↓'
        };

        return `${fieldLabels[sortOptions.field]} ${directionLabels[sortOptions.direction]}`;
    }, [sortOptions]);

    return (
        <div className="relative">
            {/* Sort Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l3-3m0 0l3 3m-3-3v12" />
                </svg>
                <span>{getSortLabel()}</span>
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">Sort Tasks</h3>
                        </div>

                        {/* Sort Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort by
                            </label>
                            <select
                                value={sortOptions.field}
                                onChange={(e) => handleFieldChange(e.target.value as TaskSortOptions['field'])}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="title">Title</option>
                                <option value="due">Due Date</option>
                                <option value="priority">Priority</option>
                                <option value="status">Status</option>
                                <option value="createdAt">Created Date</option>
                                <option value="updatedAt">Updated Date</option>
                            </select>
                        </div>

                        {/* Sort Direction */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Direction
                            </label>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleDirectionChange('asc')}
                                    className={`
                    flex-1 px-3 py-2 text-sm rounded-md border
                    ${sortOptions.direction === 'asc'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    Ascending ↑
                                </button>
                                <button
                                    onClick={() => handleDirectionChange('desc')}
                                    className={`
                    flex-1 px-3 py-2 text-sm rounded-md border
                    ${sortOptions.direction === 'desc'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }
                  `}
                                >
                                    Descending ↓
                                </button>
                            </div>
                        </div>

                        {/* Quick Sort Options */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quick Sort
                            </label>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleSortChange('due', 'asc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Due Date (Earliest First)
                                </button>
                                <button
                                    onClick={() => handleSortChange('due', 'desc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Due Date (Latest First)
                                </button>
                                <button
                                    onClick={() => handleSortChange('priority', 'desc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Priority (High to Low)
                                </button>
                                <button
                                    onClick={() => handleSortChange('status', 'asc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Status (Pending First)
                                </button>
                                <button
                                    onClick={() => handleSortChange('createdAt', 'desc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Created (Newest First)
                                </button>
                                <button
                                    onClick={() => handleSortChange('updatedAt', 'desc')}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                                >
                                    Updated (Newest First)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
