/**
 * Task Filters Component
 * 
 * Filter controls for tasks list.
 * Handles status, priority, workspace, labels, and date filters.
 */

'use client';

import { useCallback, useState } from 'react';
import type { TaskFilters as TaskFiltersType } from '../types/task';

export interface TaskFiltersProps {
    filters: TaskFiltersType;
    onFiltersChange: (filters: TaskFiltersType) => void;
}

export function TaskFilters({
    filters,
    onFiltersChange
}: TaskFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Handle filter change
    const handleFilterChange = useCallback((field: keyof TaskFiltersType, value: any) => {
        onFiltersChange({
            ...filters,
            [field]: value
        });
    }, [filters, onFiltersChange]);

    // Handle clear filters
    const handleClearFilters = useCallback(() => {
        onFiltersChange({});
    }, [onFiltersChange]);

    // Get active filters count
    const activeFiltersCount = Object.keys(filters).filter(key => {
        const value = filters[key as keyof TaskFiltersType];
        return value !== undefined && value !== null && value !== '';
    }).length;

    return (
        <div className="relative">
            {/* Filter Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Expanded Panel */}
            {isExpanded && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">Filter Tasks</h3>
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={handleClearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All statuses</option>
                                <option value="needsAction">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={filters.priority || ''}
                                onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All priorities</option>
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        {/* Workspace Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Workspace
                            </label>
                            <input
                                type="text"
                                value={filters.workspace || ''}
                                onChange={(e) => handleFilterChange('workspace', e.target.value || undefined)}
                                placeholder="Filter by workspace"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Labels Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Labels
                            </label>
                            <input
                                type="text"
                                value={filters.labels?.join(', ') || ''}
                                onChange={(e) => handleFilterChange('labels', e.target.value ? e.target.value.split(',').map(l => l.trim()).filter(l => l) : undefined)}
                                placeholder="Enter labels separated by commas"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due After
                                </label>
                                <input
                                    type="date"
                                    value={filters.dueAfter ? new Date(filters.dueAfter).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleFilterChange('dueAfter', e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Due Before
                                </label>
                                <input
                                    type="date"
                                    value={filters.dueBefore ? new Date(filters.dueBefore).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleFilterChange('dueBefore', e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Search Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <input
                                type="text"
                                value={filters.search || ''}
                                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                                placeholder="Search in title, description, and notes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
