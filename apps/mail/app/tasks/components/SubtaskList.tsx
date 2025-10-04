/**
 * Subtask List Component
 * 
 * Displays and manages subtasks for a task.
 * Handles creation, editing, deletion, and reordering of subtasks.
 */

'use client';

import React, { useCallback, useState } from 'react';
import type { CreateSubtaskData, Subtask, UpdateSubtaskData } from '../types/task';

export interface SubtaskListProps {
    subtasks: Subtask[];
    onSubtaskCreate: (data: CreateSubtaskData) => void;
    onSubtaskUpdate: (id: string, data: UpdateSubtaskData) => void;
    onSubtaskDelete: (id: string) => void;
    onSubtaskReorder: (subtasks: Subtask[]) => void;
}

export function SubtaskList({
    subtasks,
    onSubtaskCreate,
    onSubtaskUpdate,
    onSubtaskDelete,
    onSubtaskReorder
}: SubtaskListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');

    // Handle add subtask
    const handleAddSubtask = useCallback(() => {
        setIsAdding(true);
        setNewSubtaskTitle('');
    }, []);

    // Handle save new subtask
    const handleSaveNewSubtask = useCallback(async () => {
        if (newSubtaskTitle.trim()) {
            await onSubtaskCreate({
                title: newSubtaskTitle.trim(),
                status: 'needsAction',
                position: subtasks.length
            });
            setNewSubtaskTitle('');
            setIsAdding(false);
        }
    }, [newSubtaskTitle, onSubtaskCreate, subtasks.length]);

    // Handle cancel add
    const handleCancelAdd = useCallback(() => {
        setNewSubtaskTitle('');
        setIsAdding(false);
    }, []);

    // Handle edit start
    const handleEditStart = useCallback((subtask: Subtask) => {
        setEditingId(subtask.id);
        setEditingTitle(subtask.title);
    }, []);

    // Handle edit save
    const handleEditSave = useCallback(async (subtaskId: string) => {
        if (editingTitle.trim()) {
            await onSubtaskUpdate(subtaskId, { title: editingTitle.trim() });
            setEditingId(null);
            setEditingTitle('');
        }
    }, [editingTitle, onSubtaskUpdate]);

    // Handle edit cancel
    const handleEditCancel = useCallback(() => {
        setEditingId(null);
        setEditingTitle('');
    }, []);

    // Handle delete
    const handleDelete = useCallback(async (subtaskId: string) => {
        if (confirm('Are you sure you want to delete this subtask?')) {
            await onSubtaskDelete(subtaskId);
        }
    }, [onSubtaskDelete]);

    // Handle toggle
    const handleToggle = useCallback(async (subtask: Subtask) => {
        await onSubtaskUpdate(subtask.id, {
            status: subtask.status === 'completed' ? 'needsAction' : 'completed'
        });
    }, [onSubtaskUpdate]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (isAdding) {
                handleCancelAdd();
            } else if (editingId) {
                handleEditCancel();
            }
        }
    }, [isAdding, editingId, handleCancelAdd, handleEditCancel]);

    // Get completion percentage
    const completionPercentage = subtasks.length > 0
        ? Math.round((subtasks.filter(st => st.status === 'completed').length / subtasks.length) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">Subtasks</h4>
                    <span className="text-xs text-gray-500">
                        {subtasks.filter(st => st.status === 'completed').length}/{subtasks.length} completed
                    </span>
                </div>
                <button
                    onClick={handleAddSubtask}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    + Add subtask
                </button>
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            )}

            {/* Subtasks */}
            <div className="space-y-2">
                {subtasks
                    .sort((a, b) => a.position - b.position)
                    .map((subtask) => (
                        <div
                            key={subtask.id}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
                        >
                            {/* Checkbox */}
                            <button
                                onClick={() => handleToggle(subtask)}
                                className={`
                  flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center
                  ${subtask.status === 'completed'
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'border-gray-300 hover:border-green-500'
                                    }
                `}
                            >
                                {subtask.status === 'completed' && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            {/* Title */}
                            <div className="flex-1 min-w-0">
                                {editingId === subtask.id ? (
                                    <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onBlur={() => handleEditSave(subtask.id)}
                                        onKeyDown={(e) => handleKeyPress(e, () => handleEditSave(subtask.id))}
                                        className="w-full text-sm bg-transparent border-none outline-none focus:ring-0"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        className={`
                      text-sm cursor-pointer
                      ${subtask.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}
                    `}
                                        onClick={() => handleEditStart(subtask)}
                                    >
                                        {subtask.title}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            {editingId !== subtask.id && (
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => handleEditStart(subtask)}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                        title="Edit subtask"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(subtask.id)}
                                        className="text-gray-400 hover:text-red-600 p-1"
                                        title="Delete subtask"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                {/* Add New Subtask */}
                {isAdding && (
                    <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-md">
                        <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                        <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, handleSaveNewSubtask)}
                            placeholder="Enter subtask title"
                            className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0"
                            autoFocus
                        />
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={handleSaveNewSubtask}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Save subtask"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button
                                onClick={handleCancelAdd}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Cancel"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {subtasks.length === 0 && !isAdding && (
                <div className="text-center py-4 text-sm text-gray-500">
                    No subtasks yet. Click "Add subtask" to get started.
                </div>
            )}
        </div>
    );
}
