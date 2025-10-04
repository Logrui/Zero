/**
 * Tasks Page
 * 
 * Main tasks page with bidirectional Google Tasks sync.
 * Features minimalist UI with task list and detail overlay.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { GoogleTasksAuth } from './components/GoogleTasksAuth';
import { QuickAddField } from './components/QuickAddField';
import { SyncStatus } from './components/SyncStatus';
import { TaskDetailOverlay } from './components/TaskDetailOverlay';
import { TaskList } from './components/TaskList';
import { useGoogleTasks } from './hooks/useGoogleTasks';
import { usePermissionCheck } from './hooks/usePermissionCheck';
import { useSync } from './hooks/useSync';
import { useTasks } from './hooks/useTasks';
import type {
    CreateTaskData,
    TaskFilters,
    TaskWithRelations,
    UpdateTaskData
} from './types/task';

export default function TasksPage() {
    const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [filters, setFilters] = useState<TaskFilters>({});
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);

    const {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        refreshTasks
    } = useTasks();

    const {
        status: syncStatus,
        stats: syncStats,
        sync,
        resolveConflicts,
        forceSync,
        processQueue
    } = useSync();

    const {
        isConnected,
        authUrl,
        connect,
        disconnect,
        permissions
    } = useGoogleTasks();

    const {
        hasRequiredPermissions,
        missingScopes,
        needsReauth,
        loading: permissionLoading,
        error: permissionError,
        handleReauth
    } = usePermissionCheck();

    // Check if user needs to authenticate or re-authenticate
    useEffect(() => {
        if (permissionLoading) return;

        if (!isConnected && !loading) {
            setShowAuthPrompt(true);
        } else if (isConnected && needsReauth) {
            setShowAuthPrompt(true);
        }
    }, [isConnected, loading, needsReauth, permissionLoading]);

    // Handle task selection
    const handleTaskClick = useCallback((task: TaskWithRelations) => {
        setSelectedTask(task);
        setIsOverlayOpen(true);
    }, []);

    // Handle overlay close
    const handleOverlayClose = useCallback(() => {
        setIsOverlayOpen(false);
        setSelectedTask(null);
    }, []);

    // Handle task creation
    const handleTaskCreate = useCallback(async (data: CreateTaskData) => {
        try {
            await createTask(data);
            await sync(); // Sync after creation
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    }, [createTask, sync]);

    // Handle task update
    const handleTaskUpdate = useCallback(async (id: string, data: UpdateTaskData) => {
        try {
            await updateTask(id, data);
            await sync(); // Sync after update
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }, [updateTask, sync]);

    // Handle task deletion
    const handleTaskDelete = useCallback(async (id: string) => {
        try {
            await deleteTask(id);
            await sync(); // Sync after deletion
            if (selectedTask?.id === id) {
                handleOverlayClose();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    }, [deleteTask, sync, selectedTask, handleOverlayClose]);

    // Handle task toggle
    const handleTaskToggle = useCallback(async (id: string) => {
        try {
            await toggleTask(id);
            await sync(); // Sync after toggle
        } catch (error) {
            console.error('Failed to toggle task:', error);
        }
    }, [toggleTask, sync]);

    // Handle filters change
    const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
        setFilters(newFilters);
    }, []);

    // Handle Google Tasks authentication
    const handleGoogleTasksConnect = useCallback(() => {
        connect();
    }, [connect]);

    // Handle Google Tasks disconnect
    const handleGoogleTasksDisconnect = useCallback(async () => {
        try {
            await disconnect();
            setShowAuthPrompt(true);
        } catch (error) {
            console.error('Failed to disconnect from Google Tasks:', error);
        }
    }, [disconnect]);

    // Handle sync
    const handleSync = useCallback(async () => {
        try {
            await sync();
        } catch (error) {
            console.error('Failed to sync:', error);
        }
    }, [sync]);

    // Handle conflict resolution
    const handleConflictResolution = useCallback(async (resolutions: any[]) => {
        try {
            await resolveConflicts(resolutions);
            await refreshTasks();
        } catch (error) {
            console.error('Failed to resolve conflicts:', error);
        }
    }, [resolveConflicts, refreshTasks]);

    // Handle force sync
    const handleForceSync = useCallback(async (taskId: string) => {
        try {
            await forceSync(taskId);
            await refreshTasks();
        } catch (error) {
            console.error('Failed to force sync task:', error);
        }
    }, [forceSync, refreshTasks]);

    // Handle queue processing
    const handleProcessQueue = useCallback(async () => {
        try {
            await processQueue();
            await refreshTasks();
        } catch (error) {
            console.error('Failed to process queue:', error);
        }
    }, [processQueue, refreshTasks]);

    // Show auth prompt if not connected or needs re-auth
    if (showAuthPrompt && (!isConnected || needsReauth)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <GoogleTasksAuth
                    authUrl={needsReauth ? reauthUrl || authUrl : authUrl}
                    onConnect={needsReauth ? handleReauth : handleGoogleTasksConnect}
                    onCancel={() => setShowAuthPrompt(false)}
                    isReauth={needsReauth}
                    missingScopes={missingScopes}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
                        <p className="text-sm text-gray-500">
                            {tasks.length} tasks • {syncStats.syncedTasks} synced
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <SyncStatus
                            status={syncStatus}
                            stats={syncStats}
                            onSync={handleSync}
                            onProcessQueue={handleProcessQueue}
                            onForceSync={handleForceSync}
                            onResolveConflicts={handleConflictResolution}
                            onRefresh={handleSync}
                            isRefreshing={syncStatus.isOnline && syncStatus.pendingChanges > 0}
                        />
                        <button
                            onClick={handleGoogleTasksDisconnect}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Disconnect Google Tasks
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Quick Add */}
                <div className="mb-6">
                    <QuickAddField
                        onTaskCreate={handleTaskCreate}
                        placeholder="Add a new task..."
                        autoFocus={true}
                    />
                </div>

                {/* Task List */}
                <TaskList
                    tasks={tasks}
                    loading={loading}
                    error={error}
                    onTaskClick={handleTaskClick}
                    onTaskCreate={handleTaskCreate}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    onTaskToggle={handleTaskToggle}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                />
            </div>

            {/* Task Detail Overlay */}
            <TaskDetailOverlay
                task={selectedTask}
                isOpen={isOverlayOpen}
                onClose={handleOverlayClose}
                onSave={handleTaskUpdate}
                onDelete={handleTaskDelete}
                onSubtaskCreate={async (data) => {
                    // TODO: Implement subtask creation
                    console.log('Create subtask:', data);
                }}
                onSubtaskUpdate={async (id, data) => {
                    // TODO: Implement subtask update
                    console.log('Update subtask:', id, data);
                }}
                onSubtaskDelete={async (id) => {
                    // TODO: Implement subtask deletion
                    console.log('Delete subtask:', id);
                }}
                onSubtaskReorder={async (subtasks) => {
                    // TODO: Implement subtask reordering
                    console.log('Reorder subtasks:', subtasks);
                }}
            />
        </div>
    );
}
