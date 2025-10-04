/**
 * Quick Add Field Component
 * 
 * Quick task creation field that expands to full editor.
 * Provides fast task creation with minimal UI.
 */

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { CreateTaskData } from '../types/task';

export interface QuickAddFieldProps {
    onTaskCreate: (data: CreateTaskData) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export function QuickAddField({
    onTaskCreate,
    placeholder = "Add a new task...",
    autoFocus = false
}: QuickAddFieldProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [due, setDue] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }, []);

    // Handle input key down
    const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (title.trim()) {
                handleQuickCreate();
            }
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }, [title]);

    // Handle input focus
    const handleInputFocus = useCallback(() => {
        setIsExpanded(true);
    }, []);

    // Handle quick create
    const handleQuickCreate = useCallback(async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onTaskCreate({
                title: title.trim(),
                status: 'needsAction',
                priority: 'normal'
            });
            setTitle('');
            setDescription('');
            setDue('');
            setPriority('normal');
            setLabels([]);
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [title, onTaskCreate]);

    // Handle full create
    const handleFullCreate = useCallback(async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await onTaskCreate({
                title: title.trim(),
                description: description.trim() || undefined,
                due: due ? new Date(due) : undefined,
                priority,
                labels: labels.length > 0 ? labels : undefined,
                status: 'needsAction'
            });
            setTitle('');
            setDescription('');
            setDue('');
            setPriority('normal');
            setLabels([]);
            setIsExpanded(false);
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [title, description, due, priority, labels, onTaskCreate]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        setTitle('');
        setDescription('');
        setDue('');
        setPriority('normal');
        setLabels([]);
        setIsExpanded(false);
    }, []);

    // Handle label add
    const handleLabelAdd = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newLabel.trim()) {
            e.preventDefault();
            if (!labels.includes(newLabel.trim())) {
                setLabels([...labels, newLabel.trim()]);
            }
            setNewLabel('');
        }
    }, [newLabel, labels]);

    // Handle label remove
    const handleLabelRemove = useCallback((labelToRemove: string) => {
        setLabels(labels.filter(label => label !== labelToRemove));
    }, [labels]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExpanded && !(event.target as Element).closest('.quick-add-container')) {
                handleCancel();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, handleCancel]);

    return (
        <div className="quick-add-container">
            {!isExpanded ? (
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onFocus={handleInputFocus}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Title *
                        </label>
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={handleInputChange}
                            placeholder="Enter task title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter task description"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Due Date and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={due}
                                onChange={(e) => setDue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                            </select>
                        </div>
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
                            {labels.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {labels.map((label, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            {label}
                                            <button
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

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFullCreate}
                            disabled={!title.trim() || isSubmitting}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
