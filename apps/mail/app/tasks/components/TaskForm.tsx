/**
 * Task Form Component
 * 
 * Form for creating and editing tasks.
 * Handles all task fields including ZeroOS extensions.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { CreateTaskData, UpdateTaskData } from '../types/task';

export interface TaskFormProps {
    data: UpdateTaskData | CreateTaskData;
    onChange: (data: UpdateTaskData | CreateTaskData) => void;
    onSubmit: () => void;
}

export function TaskForm({
    data,
    onChange,
    onSubmit
}: TaskFormProps) {
    const [formData, setFormData] = useState<UpdateTaskData | CreateTaskData>(data);
    const [newLabel, setNewLabel] = useState('');

    // Update form data when props change
    useEffect(() => {
        setFormData(data);
    }, [data]);

    // Handle input change
    const handleInputChange = useCallback((field: keyof (UpdateTaskData | CreateTaskData), value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        onChange(newData);
    }, [formData, onChange]);

    // Handle label add
    const handleLabelAdd = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newLabel.trim()) {
            e.preventDefault();
            const currentLabels = formData.labels || [];
            if (!currentLabels.includes(newLabel.trim())) {
                handleInputChange('labels', [...currentLabels, newLabel.trim()]);
            }
            setNewLabel('');
        }
    }, [newLabel, formData.labels, handleInputChange]);

    // Handle label remove
    const handleLabelRemove = useCallback((labelToRemove: string) => {
        const currentLabels = formData.labels || [];
        handleInputChange('labels', currentLabels.filter(label => label !== labelToRemove));
    }, [formData.labels, handleInputChange]);

    // Handle form submit
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    }, [onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                </label>
                <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                </label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        value={formData.status || 'needsAction'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="needsAction">Pending</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                    </label>
                    <select
                        value={formData.priority || 'normal'}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            {/* Due Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                </label>
                <input
                    type="datetime-local"
                    value={formData.due ? new Date(formData.due).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleInputChange('due', e.target.value ? new Date(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Labels */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Labels
                </label>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={handleLabelAdd}
                        placeholder="Add a label and press Enter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.labels && formData.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {formData.labels.map((label, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    {label}
                                    <button
                                        type="button"
                                        onClick={() => handleLabelRemove(label)}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                </label>
                <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
        </form>
    );
}
