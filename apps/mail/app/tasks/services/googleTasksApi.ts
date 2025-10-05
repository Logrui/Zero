/**
 * Google Tasks API Client
 * 
 * Client-side Google Tasks API integration with OAuth.
 * Handles authentication, token management, and API communication.
 */

import type {
    ApiResponse,
    GoogleTasksAuthResponse,
    SyncStatsResponse,
    SyncStatusResponse,
    TaskListResponse,
    TaskWithRelations
} from '../types/task';

export interface GoogleTasksApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
}

export interface GoogleTasksAuthState {
    isConnected: boolean;
    permissions: string[];
    lastAuthCheck?: Date;
}

export class GoogleTasksApiClient {
    private config: GoogleTasksApiConfig;
    private authState: GoogleTasksAuthState;

    constructor(config: GoogleTasksApiConfig) {
        this.config = config;
        this.authState = {
            isConnected: false,
            permissions: []
        };
    }

    /**
     * Get Google Tasks OAuth URL
     */
    async getAuthUrl(): Promise<string> {
        try {
            const response = await this.makeRequest<GoogleTasksAuthResponse>('/tasks/auth/google-tasks', {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data.authUrl;
            }

            throw new Error('Failed to get auth URL');
        } catch (error) {
            console.error('Error getting auth URL:', error);
            throw new Error('Failed to get Google Tasks auth URL');
        }
    }

    /**
     * Handle OAuth callback
     */
    async handleCallback(code: string): Promise<void> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/auth/google-tasks/callback', {
                method: 'POST',
                body: JSON.stringify({ code })
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'OAuth callback failed');
            }

            this.authState.isConnected = true;
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            throw new Error('Failed to complete Google Tasks authentication');
        }
    }

    /**
     * Disconnect from Google Tasks
     */
    async disconnect(): Promise<void> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/auth/google-tasks', {
                method: 'DELETE'
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Disconnect failed');
            }

            this.authState.isConnected = false;
            this.authState.permissions = [];
        } catch (error) {
            console.error('Error disconnecting:', error);
            throw new Error('Failed to disconnect from Google Tasks');
        }
    }

    /**
     * Check authentication status
     */
    async checkAuthStatus(): Promise<GoogleTasksAuthState> {
        try {
            const response = await this.makeRequest<{
                hasRequiredPermissions: boolean;
                missingScopes: string[];
                needsReauth: boolean;
            }>('/tasks/permissions/check', {
                method: 'GET'
            });

            this.authState.isConnected = response.hasRequiredPermissions;
            this.authState.permissions = response.missingScopes;
            this.authState.lastAuthCheck = new Date();

            return this.authState;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return this.authState;
        }
    }

    /**
     * Get tasks from API
     */
    async getTasks(filters?: any): Promise<TaskWithRelations[]> {
        try {
            const queryParams = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, String(value));
                    }
                });
            }

            const response = await this.makeRequest<TaskListResponse>(`/tasks/list?${queryParams}`, {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data.items;
            }

            throw new Error('Failed to fetch tasks');
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw new Error('Failed to fetch tasks');
        }
    }

    /**
     * Create task
     */
    async createTask(taskData: any): Promise<TaskWithRelations> {
        try {
            const response = await this.makeRequest<TaskListResponse>('/tasks/item', {
                method: 'POST',
                body: JSON.stringify(taskData)
            });

            if (response.success && response.data) {
                return response.data.items[0];
            }

            throw new Error('Failed to create task');
        } catch (error) {
            console.error('Error creating task:', error);
            throw new Error('Failed to create task');
        }
    }

    /**
     * Update task
     */
    async updateTask(taskId: string, updates: any): Promise<TaskWithRelations> {
        try {
            const response = await this.makeRequest<TaskListResponse>(`/tasks/item/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });

            if (response.success && response.data) {
                return response.data.items[0];
            }

            throw new Error('Failed to update task');
        } catch (error) {
            console.error('Error updating task:', error);
            throw new Error('Failed to update task');
        }
    }

    /**
     * Delete task
     */
    async deleteTask(taskId: string): Promise<void> {
        try {
            const response = await this.makeRequest<ApiResponse>(`/tasks/item/${taskId}`, {
                method: 'DELETE'
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to delete task');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            throw new Error('Failed to delete task');
        }
    }

    /**
     * Sync tasks
     */
    async syncTasks(): Promise<any> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/sync', {
                method: 'POST'
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Sync failed');
            }

            return response.data;
        } catch (error) {
            console.error('Error syncing tasks:', error);
            throw new Error('Failed to sync tasks');
        }
    }

    /**
     * Get sync status
     */
    async getSyncStatus(): Promise<any> {
        try {
            const response = await this.makeRequest<SyncStatusResponse>('/tasks/sync/status', {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Failed to get sync status');
        } catch (error) {
            console.error('Error getting sync status:', error);
            throw new Error('Failed to get sync status');
        }
    }

    /**
     * Get sync statistics
     */
    async getSyncStats(): Promise<any> {
        try {
            const response = await this.makeRequest<SyncStatsResponse>('/tasks/sync/stats', {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Failed to get sync stats');
        } catch (error) {
            console.error('Error getting sync stats:', error);
            throw new Error('Failed to get sync stats');
        }
    }

    /**
     * Resolve conflicts
     */
    async resolveConflicts(resolutions: any[]): Promise<any> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/sync/conflicts/resolve', {
                method: 'POST',
                body: JSON.stringify({ resolutions })
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to resolve conflicts');
            }

            return response.data;
        } catch (error) {
            console.error('Error resolving conflicts:', error);
            throw new Error('Failed to resolve conflicts');
        }
    }

    /**
     * Force sync specific task
     */
    async forceSyncTask(taskId: string): Promise<any> {
        try {
            const response = await this.makeRequest<ApiResponse>(`/sync/force/${taskId}`, {
                method: 'POST'
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to force sync task');
            }

            return response.data;
        } catch (error) {
            console.error('Error force syncing task:', error);
            throw new Error('Failed to force sync task');
        }
    }

    /**
     * Get offline queue
     */
    async getOfflineQueue(): Promise<any[]> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/sync/queue', {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Failed to get offline queue');
        } catch (error) {
            console.error('Error getting offline queue:', error);
            throw new Error('Failed to get offline queue');
        }
    }

    /**
     * Process offline queue
     */
    async processOfflineQueue(): Promise<any> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/sync/queue/process', {
                method: 'POST'
            });

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to process offline queue');
            }

            return response.data;
        } catch (error) {
            console.error('Error processing offline queue:', error);
            throw new Error('Failed to process offline queue');
        }
    }

    /**
     * Get task statistics
     */
    async getTaskStats(): Promise<any> {
        try {
            const response = await this.makeRequest<ApiResponse>('/tasks/stats', {
                method: 'GET'
            });

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Failed to get task stats');
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw new Error('Failed to get task stats');
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const response = await fetch(`${this.config.baseUrl}${url}`, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data as T;
            } catch (error) {
                lastError = error as Error;

                if (attempt < this.config.retryAttempts - 1) {
                    await this.delay(this.config.retryDelay * Math.pow(2, attempt));
                }
            }
        }

        throw lastError || new Error('Request failed');
    }

    /**
     * Delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get current auth state
     */
    getAuthState(): GoogleTasksAuthState {
        return { ...this.authState };
    }

    /**
     * Set auth state
     */
    setAuthState(state: Partial<GoogleTasksAuthState>): void {
        this.authState = { ...this.authState, ...state };
    }
}

// Default configuration
export const defaultGoogleTasksApiConfig: GoogleTasksApiConfig = {
    baseUrl: 'http://localhost:8787/api',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Create default instance
export const googleTasksApi = new GoogleTasksApiClient(defaultGoogleTasksApiConfig);
