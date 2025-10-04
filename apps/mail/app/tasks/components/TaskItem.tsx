/**
 * Task Item Component
 * 
 * Individual task item with minimalist design.
 * Shows basic task information and handles interactions.
 */

'use client';

import React, { useCallback, useState } from 'react';
import type {
    TaskWithRelations,
    UpdateTaskData
} from '../types/task';

export interface TaskItemProps {
    task: TaskWithRelations;
    onClick: (task: TaskWithRelations) => void;
    onToggle: (id: string) => void;
    onUpdate: (id: string, data: UpdateTaskData) => void;
    onDelete: (id: string) => void;
}

export function TaskItem({
    task,
    onClick,
    onToggle,
    onUpdate,
    onDelete
}: TaskItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);

    // Handle task click
    const handleClick = useCallback(() => {
        onClick(task);
    }, [onClick, task]);

    // Handle toggle completion
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle(task.id);
    }, [onToggle, task.id]);

    // Handle edit start
    const handleEditStart = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditTitle(task.title);
    }, [task.title]);

    // Handle edit save
    const handleEditSave = useCallback(async () => {
        if (editTitle.trim() && editTitle !== task.title) {
            await onUpdate(task.id, { title: editTitle.trim() });
        }
        setIsEditing(false);
    }, [editTitle, task.title, onUpdate, task.id]);

    // Handle edit cancel
    const handleEditCancel = useCallback(() => {
        setEditTitle(task.title);
        setIsEditing(false);
    }, [task.title]);

    // Handle key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    }, [handleEditSave, handleEditCancel]);

    // Handle delete
    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            onDelete(task.id);
        }
    }, [onDelete, task.id]);

    // Format due date
    const formatDueDate = useCallback((due: Date) => {
        const now = new Date();
        const dueDate = new Date(due);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0) return `In ${diffDays} days`;
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

        return dueDate.toLocaleDateString();
    }, []);

    // Get priority color
    const getPriorityColor = useCallback((priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600';
            case 'normal': return 'text-gray-600';
            case 'low': return 'text-green-600';
            default: return 'text-gray-600';
        }
    }, []);

    // Get priority icon
    const getPriorityIcon = useCallback((priority: string) => {
        switch (priority) {
            case 'high': return '🔴';
            case 'normal': return '🟡';
            case 'low': return '🟢';
            default: return '🟡';
        }
    }, []);

    // Check if overdue
    const isOverdue = task.due && new Date(task.due) < new Date() && task.status !== 'completed';

    return (
        <div
            className={`
        flex items-center space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer
        ${task.status === 'completed' ? 'opacity-60' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Checkbox */}
            <button
                onClick={handleToggle}
                className={`
          flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
          ${task.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }
        `}
            >
                {task.status === 'completed' && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            {/* Task Content */}
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleEditSave}
                        onKeyDown={handleKeyPress}
                        className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0"
                        autoFocus
                    />
                ) : (
                    <div className="flex items-center space-x-2">
                        <h3 className={`
              text-sm font-medium truncate
              ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}
            `}>
                            {task.title}
                        </h3>
                        {task.priority !== 'normal' && (
                            <span className="text-xs" title={`Priority: ${task.priority}`}>
                                {getPriorityIcon(task.priority)}
                            </span>
                        )}
                    </div>
                )}

                {/* Task Details */}
                <div className="flex items-center space-x-4 mt-1">
                    {/* Due Date */}
                    {task.due && (
                        <span className={`
              text-xs px-2 py-1 rounded-full
              ${isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                            }
            `}>
                            {formatDueDate(task.due)}
                        </span>
                    )}

                    {/* Priority */}
                    {task.priority !== 'normal' && (
                        <span className={`
              text-xs px-2 py-1 rounded-full bg-gray-100
              ${getPriorityColor(task.priority)}
            `}>
                            {task.priority}
                        </span>
                    )}

                    {/* Labels */}
                    {task.labels.length > 0 && (
                        <div className="flex space-x-1">
                            {task.labels.slice(0, 3).map((label, index) => (
                                <span
                                    key={index}
                                    className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800"
                                >
                                    {label}
                                </span>
                            ))}
                            {task.labels.length > 3 && (
                                <span className="text-xs text-gray-500">
                                    +{task.labels.length - 3} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {task.subtasks.filter(st => st.status === 'completed').length}/
                            {task.subtasks.length} subtasks
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            {isHovered && (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleEditStart}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit task"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete task"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
