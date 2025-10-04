/**
 * Task Detail Overlay Component
 * 
 * Pop-up overlay for task details and editing.
 * Similar to notifications overlay with full task editing capabilities.
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type {
    CreateSubtaskData,
    Subtask,
    TaskWithRelations,
    UpdateSubtaskData,
    UpdateTaskData
} from '../types/task';
import { SubtaskList } from './SubtaskList';
import { TaskForm } from './TaskForm';
import { ZeroosTaskExtension } from './ZeroosTaskExtension';

export interface TaskDetailOverlayProps {
    task: TaskWithRelations | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: UpdateTaskData) => void;
    onDelete: (id: string) => void;
    onSubtaskCreate: (data: CreateSubtaskData) => void;
    onSubtaskUpdate: (id: string, data: UpdateSubtaskData) => void;
    onSubtaskDelete: (id: string) => void;
    onSubtaskReorder: (subtasks: Subtask[]) => void;
}

export function TaskDetailOverlay({
    task,
    isOpen,
    onClose,
    onSave,
    onDelete,
    onSubtaskCreate,
    onSubtaskUpdate,
    onSubtaskDelete,
    onSubtaskReorder
}: TaskDetailOverlayProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [formData, setFormData] = useState<UpdateTaskData>({});

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description,
                status: task.status,
                due: task.due,
                priority: task.priority,
                notes: task.notes,
                labels: task.labels
            });
            setIsEditing(false);
            setHasUnsavedChanges(false);
        }
    }, [task]);

    // Handle form change
    const handleFormChange = useCallback((data: UpdateTaskData) => {
        setFormData(data);
        setHasUnsavedChanges(true);
    }, []);

    // Handle save
    const handleSave = useCallback(async () => {
        if (task && hasUnsavedChanges) {
            await onSave(task.id, formData);
            setHasUnsavedChanges(false);
            setIsEditing(false);
        }
    }, [task, hasUnsavedChanges, formData, onSave]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                setFormData({
                    title: task?.title,
                    description: task?.description,
                    status: task?.status,
                    due: task?.due,
                    priority: task?.priority,
                    notes: task?.notes,
                    labels: task?.labels
                });
                setHasUnsavedChanges(false);
                setIsEditing(false);
            }
        } else {
            setIsEditing(false);
        }
    }, [hasUnsavedChanges, task]);

    // Handle delete
    const handleDelete = useCallback(async () => {
        if (task && confirm('Are you sure you want to delete this task?')) {
            await onDelete(task.id);
            onClose();
        }
    }, [task, onDelete, onClose]);

    // Handle close
    const handleClose = useCallback(() => {
        if (hasUnsavedChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    }, [hasUnsavedChanges, onClose]);

    // Handle overlay click
    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                handleClose();
            } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (isEditing) {
                    handleSave();
                }
            } else if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setIsEditing(!isEditing);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isEditing, handleClose, handleSave]);

    if (!isOpen || !task) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {isEditing ? 'Edit Task' : 'Task Details'}
                        </h2>
                        {hasUnsavedChanges && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={!hasUnsavedChanges}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Edit
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {isEditing ? (
                        <TaskForm
                            data={formData}
                            onChange={handleFormChange}
                            onSubmit={handleSave}
                        />
                    ) : (
                        <div className="space-y-6">
                            {/* Task Info */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                                    <p className="text-lg text-gray-900">{task.title}</p>
                                </div>

                                {task.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                        <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                                        <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${task.status === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }
                    `}>
                                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                                        <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${task.priority === 'high'
                                                ? 'bg-red-100 text-red-800'
                                                : task.priority === 'low'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }
                    `}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>

                                {task.due && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                                        <p className="text-gray-900">{new Date(task.due).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {task.labels.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Labels</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {task.labels.map((label, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {task.notes && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                                        <p className="text-gray-900 whitespace-pre-wrap">{task.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">Subtasks</h3>
                                    <SubtaskList
                                        subtasks={task.subtasks}
                                        onSubtaskCreate={onSubtaskCreate}
                                        onSubtaskUpdate={onSubtaskUpdate}
                                        onSubtaskDelete={onSubtaskDelete}
                                        onSubtaskReorder={onSubtaskReorder}
                                    />
                                </div>
                            )}

                            {/* ZeroOS Extension */}
                            {task.zeroosExtension && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">ZeroOS Details</h3>
                                    <ZeroosTaskExtension
                                        extension={task.zeroosExtension}
                                        onUpdate={(data) => {
                                            // TODO: Implement ZeroOS extension update
                                            console.log('Update ZeroOS extension:', data);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            Created {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                            Updated {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDelete}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
