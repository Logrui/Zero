/**
 * Task Detail Overlay Component
 * 
 * Pop-up overlay for task details and editing.
 * Similar to notifications overlay with full task editing capabilities.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    const handleOverlayClick = useCallback((e: any) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (typeof document === 'undefined') return;

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
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={handleOverlayClick}
        >
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">
                            {isEditing ? 'Edit Task' : 'Task Details'}
                        </CardTitle>
                        {hasUnsavedChanges && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 border border-orange-200 bg-orange-50">
                                Unsaved changes
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={!hasUnsavedChanges}
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                            >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
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
                                    <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                                    <p className="text-lg font-medium">{task.title}</p>
                                </div>

                                {task.description && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                                        <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Priority</h3>
                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${task.priority === 'high'
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : task.priority === 'low'
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                            {task.priority}
                                        </div>
                                    </div>
                                </div>

                                {task.due && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                                        <p className="text-foreground">{new Date(task.due).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {task.labels.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Labels</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {task.labels.map((label, index) => (
                                                <div key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {task.notes && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                                        <p className="text-foreground whitespace-pre-wrap">{task.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Subtasks</h3>
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
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">ZeroOS Details</h3>
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
                </CardContent>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t bg-muted/50">
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                            Created {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                            Updated {new Date(task.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
