/**
 * Task Types Definition
 * 
 * TypeScript types for tasks, sync states, and API responses.
 * Provides type safety for the frontend task management system.
 */

export interface Task {
    id: string;
    googleTaskId?: string;
    userId: string;
    title: string;
    description?: string;
    status: 'needsAction' | 'completed';
    due?: Date;
    priority: 'low' | 'normal' | 'high';
    notes?: string;
    labels: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Subtask {
    id: string;
    taskId: string;
    title: string;
    status: 'needsAction' | 'completed';
    position: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ZeroosTaskExtension {
    id: string;
    taskId: string;
    workspace?: string;
    associatedPeople: string[];
    associatedCompanies: string[];
    linkedGmailThreads: string[];
    internalNotes?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SyncState {
    id: string;
    taskId: string;
    lastSyncTimestamp?: Date;
    conflictResolution: 'local' | 'remote' | 'pending';
    retryCount: number;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Change {
    id: string;
    taskId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    retryCount: number;
    createdAt: Date;
}

export interface TaskWithRelations extends Task {
    subtasks?: Subtask[];
    zeroosExtension?: ZeroosTaskExtension;
    syncState?: SyncState;
    changes?: Change[];
}

export interface CreateTaskData {
    title: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
    subtasks?: Omit<Subtask, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>[];
    zeroosExtension?: Omit<ZeroosTaskExtension, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: Date | null;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
}

export interface CreateSubtaskData {
    title: string;
    status?: 'needsAction' | 'completed';
    position?: number;
}

export interface UpdateSubtaskData {
    title?: string;
    status?: 'needsAction' | 'completed';
    position?: number;
}

export interface TaskFilters {
    status?: 'needsAction' | 'completed';
    priority?: 'low' | 'normal' | 'high';
    workspace?: string;
    labels?: string[];
    dueBefore?: Date;
    dueAfter?: Date;
    search?: string;
}

export interface TaskStats {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
}

export interface SyncStatus {
    isOnline: boolean;
    lastSync?: Date;
    pendingChanges: number;
    conflicts: number;
    errors: string[];
}

export interface SyncStats {
    totalTasks: number;
    syncedTasks: number;
    pendingChanges: number;
    conflicts: number;
    lastSync?: Date;
}

export interface ConflictResolution {
    taskId: string;
    strategy: 'local' | 'remote' | 'merge';
    resolvedData?: any;
}

export interface GoogleTasksAuth {
    authUrl: string;
    isConnected: boolean;
    permissions: string[];
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        timestamp: string;
    };
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
}

export interface TaskListProps {
    tasks: TaskWithRelations[];
    loading?: boolean;
    error?: string;
    onTaskClick: (task: TaskWithRelations) => void;
    onTaskCreate: (data: CreateTaskData) => void;
    onTaskUpdate: (id: string, data: UpdateTaskData) => void;
    onTaskDelete: (id: string) => void;
    onTaskToggle: (id: string) => void;
    filters?: TaskFilters;
    onFiltersChange?: (filters: TaskFilters) => void;
}

export interface TaskItemProps {
    task: TaskWithRelations;
    onClick: (task: TaskWithRelations) => void;
    onToggle: (id: string) => void;
    onUpdate: (id: string, data: UpdateTaskData) => void;
    onDelete: (id: string) => void;
}

export interface TaskDetailOverlayProps {
    task: TaskWithRelations | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UpdateTaskData) => void;
    onDelete: (id: string) => void;
    onSubtaskCreate: (data: CreateSubtaskData) => void;
    onSubtaskUpdate: (id: string, data: UpdateSubtaskData) => void;
    onSubtaskDelete: (id: string) => void;
    onSubtaskReorder: (subtasks: Subtask[]) => void;
}

export interface QuickAddFieldProps {
    onTaskCreate: (data: CreateTaskData) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export interface SyncServiceConfig {
    apiUrl: string;
    wsUrl: string;
    retryAttempts: number;
    retryDelay: number;
    batchSize: number;
}

export interface OfflineQueueItem {
    id: string;
    taskId: string;
    operation: 'create' | 'update' | 'delete';
    data: any;
    timestamp: Date;
    retryCount: number;
}

export interface VirtualScrollProps {
    items: any[];
    itemHeight: number;
    containerHeight: number;
    renderItem: (item: any, index: number) => React.ReactNode;
    onScroll?: (scrollTop: number) => void;
}

export interface TaskSortOptions {
    field: 'title' | 'due' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
    direction: 'asc' | 'desc';
}

export interface TaskGroupOptions {
    groupBy: 'status' | 'priority' | 'due' | 'workspace' | 'labels';
    sortBy: TaskSortOptions;
}

export interface TaskSearchOptions {
    query: string;
    fields: ('title' | 'description' | 'notes')[];
    caseSensitive: boolean;
}

export interface TaskNotification {
    id: string;
    type: 'sync' | 'conflict' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    actions?: Array<{
        label: string;
        action: () => void;
    }>;
}

export interface TaskKeyboardShortcuts {
    create: string;
    toggle: string;
    edit: string;
    delete: string;
    search: string;
    sync: string;
}

export interface TaskTheme {
    colors: {
        primary: string;
        secondary: string;
        success: string;
        warning: string;
        error: string;
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
    };
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    typography: {
        fontFamily: string;
        fontSize: {
            xs: string;
            sm: string;
            md: string;
            lg: string;
            xl: string;
        };
        fontWeight: {
            normal: number;
            medium: number;
            semibold: number;
            bold: number;
        };
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
}

export interface TaskAccessibility {
    announceChanges: boolean;
    announceSyncStatus: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
}

export interface TaskPerformance {
    virtualScrolling: boolean;
    lazyLoading: boolean;
    debounceDelay: number;
    batchSize: number;
    cacheSize: number;
}

export interface TaskAnalytics {
    trackEvents: boolean;
    trackErrors: boolean;
    trackPerformance: boolean;
    trackUserActions: boolean;
}

export interface TaskConfig {
    sync: SyncServiceConfig;
    virtualScroll: VirtualScrollProps;
    sort: TaskSortOptions;
    group: TaskGroupOptions;
    search: TaskSearchOptions;
    notifications: TaskNotification[];
    shortcuts: TaskKeyboardShortcuts;
    theme: TaskTheme;
    accessibility: TaskAccessibility;
    performance: TaskPerformance;
    analytics: TaskAnalytics;
}

// Utility types
export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type ConflictResolutionStrategy = SyncState['conflictResolution'];
export type ChangeOperation = Change['operation'];

// API endpoint types
export type TaskListResponse = ApiResponse<PaginatedResponse<TaskWithRelations>>;
export type TaskResponse = ApiResponse<TaskWithRelations>;
export type TaskStatsResponse = ApiResponse<TaskStats>;
export type SyncStatusResponse = ApiResponse<SyncStatus>;
export type SyncStatsResponse = ApiResponse<SyncStats>;
export type GoogleTasksAuthResponse = ApiResponse<GoogleTasksAuth>;

// Hook return types
export interface UseTasksReturn {
    tasks: TaskWithRelations[];
    loading: boolean;
    error: string | null;
    createTask: (data: CreateTaskData) => Promise<void>;
    updateTask: (id: string, data: UpdateTaskData) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    refreshTasks: () => Promise<void>;
}

export interface UseSyncReturn {
    status: SyncStatus;
    stats: SyncStats;
    sync: () => Promise<void>;
    resolveConflicts: (resolutions: ConflictResolution[]) => Promise<void>;
    forceSync: (taskId: string) => Promise<void>;
    processQueue: () => Promise<void>;
}

export interface UseGoogleTasksReturn {
    isConnected: boolean;
    authUrl: string;
    connect: () => void;
    disconnect: () => Promise<void>;
    permissions: string[];
}
