/**
 * Tasks Page
 * 
 * Main tasks page with bidirectional Google Tasks sync.
 * Features minimalist UI with task list and detail overlay.
 */

'use client';

import { Button } from '@/components/ui/button';
import { useActiveConnection } from '@/hooks/use-connections';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
// Using new TRPC-based tasks module
import { getTasks, getSyncStatus, syncWithGoogleTasks } from '../../../modules/tasks/lib/tasks';

// Define types locally since they're not exported from the module
interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: 'needsAction' | 'completed';
  due: Date | null;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateTaskData {
  title: string;
  description?: string;
  due?: Date;
  priority?: 'low' | 'normal' | 'high';
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'needsAction' | 'completed';
  due?: Date;
  priority?: 'low' | 'normal' | 'high';
}

interface TaskFilters {
  status?: 'needsAction' | 'completed';
  priority?: 'low' | 'normal' | 'high';
}

export default function TasksPage() {
  const { toast } = useToast();
  const activeConnection = useActiveConnection();
  const activeUserId = activeConnection.data?.id;

  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});

  // State management
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    lastSync: null as Date | null,
    pendingChanges: 0,
    syncedTasks: 0,
    totalTasks: 0
  });

  // Google Tasks connection state (similar to calendar)
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasAttemptedInitialSync, setHasAttemptedInitialSync] = useState(false);

  // Load tasks function
  const refreshTasks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getTasks();
      setTasks(result || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Check Google Tasks connection by attempting to get sync status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (!activeUserId) {
          console.log('🔍 [TasksPage] No active user ID, marking as not connected');
          setIsConnected(false);
          return;
        }
        
        console.log('🔍 [TasksPage] Checking Google Tasks connection...');
        // Try to get sync status to verify connection
        const status = await getSyncStatus();
        console.log('✅ [TasksPage] Connection check result:', { isOnline: status?.isOnline });
        
        // If we can get sync status, assume connected
        setIsConnected(status?.isOnline || false);
      } catch (err) {
        console.error("❌ [TasksPage] Error checking Google Tasks connection:", err);
        // If we can't get sync status, still mark as potentially connected
        // The sync operation itself will show a proper error message if auth fails
        setIsConnected(true);
      }
    };
    checkConnection();
  }, [activeUserId]);

  // Load tasks on mount and refresh every 30 seconds for real-time updates
  useEffect(() => {
    refreshTasks();
    const interval = setInterval(refreshTasks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshTasks]);

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

  // Handle task creation - simplified
  const handleTaskCreate = useCallback(async (data: CreateTaskData) => {
    console.log('Create task:', data);
    // TODO: Implement task creation with TRPC
  }, []);

  // Handle task update - simplified
  const handleTaskUpdate = useCallback(async (id: string, data: UpdateTaskData) => {
    console.log('Update task:', id, data);
    // TODO: Implement task update with TRPC
  }, []);

  // Handle task deletion - simplified
  const handleTaskDelete = useCallback(async (id: string) => {
    console.log('Delete task:', id);
    // TODO: Implement task deletion with TRPC
    if (selectedTask?.id === id) {
      handleOverlayClose();
    }
  }, [selectedTask, handleOverlayClose]);

  // Handle task toggle - simplified
  const handleTaskToggle = useCallback(async (id: string) => {
    console.log('Toggle task:', id);
    // TODO: Implement task toggle with TRPC
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
  }, []);

  // Removed handleGoogleTasksConnect - using connect directly


  // Handle sync (similar to calendar pattern)
  const handleSync = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Google Tasks not connected",
        description: "Please connect your Google account first in Settings > Connections",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      console.log('🔄 [TasksPage.handleSync] Sync button clicked');
      const result = await syncWithGoogleTasks();
      console.log('✅ [TasksPage.handleSync] Sync completed', result);

      if (result.success) {
        toast({
          title: "Sync successful",
          description: `Synced ${result.syncedCount} tasks from Google Tasks`
        });
        // Refresh tasks after sync
        await refreshTasks();
      } else {
        const errorMessage = result.errors?.[0] || "Failed to sync with Google Tasks";
        toast({
          title: "Sync failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ [TasksPage.handleSync] Failed to sync:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to sync with Google Tasks";
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, refreshTasks, toast]);

  // Auto-sync on first load if no tasks exist
  useEffect(() => {
    const attemptInitialSync = async () => {
      if (!hasAttemptedInitialSync && isConnected && tasks.length === 0 && !loading) {
        console.log('🔄 [TasksPage] No tasks found, attempting auto-sync...');
        setHasAttemptedInitialSync(true);
        await handleSync();
      }
    };
    attemptInitialSync();
  }, [tasks.length, isConnected, loading, hasAttemptedInitialSync, handleSync]);

  // Removed conflict resolution functions - simplified for now

  // No auth checks - just render the tasks interface like calendar page

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your tasks with Google Tasks sync
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isConnected ? (
            <Button variant="outline" size="sm" disabled className="flex items-center gap-2 opacity-70">
              <AlertCircle className="h-4 w-4" />
              Google Tasks not connected
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              className="h-8 text-xs text-white/70 hover:text-white hover:bg-white/10"
              disabled={isSyncing}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Tasks</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{syncStatus.syncedTasks}</span> synced
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">In Progress</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'needsAction').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active tasks
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Completed</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{syncStatus.syncedTasks}</span> synced
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Due Soon</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">
              {tasks.filter(t => {
                if (!t.due) return false;
                const dueDate = new Date(t.due);
                const now = new Date();
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 2 && diffDays >= 0;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 2 days
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add a new task..."
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button size="sm">Add</Button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-0">
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-lg font-semibold">All Tasks</h3>
              <p className="text-sm text-muted-foreground">
                View and manage all your tasks
              </p>
            </div>
          </div>
          <div className="p-6 pt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Loading tasks...</div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-red-600">Error: {error}</div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">No tasks found. Click Sync to load tasks from Google Tasks.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.status === 'completed' ? '✓' : '○'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Overlay - Simplified */}
      {isOverlayOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Task Details</h3>
              <Button variant="ghost" size="sm" onClick={handleOverlayClose}>
                ×
              </Button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Title</label>
                <div className="text-sm">{selectedTask.title}</div>
              </div>
              {selectedTask.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <div className="text-sm">{selectedTask.description}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="text-sm">{selectedTask.status}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
