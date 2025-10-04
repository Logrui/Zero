import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { ChangeModel } from '../models/change';
import { SyncStateModel } from '../models/syncState';
import type { TaskWithRelations } from '../models/task';
import { TaskModel } from '../models/task';
import { UserPermissionsModel } from '../models/userPermissions';

/**
 * Google Tasks Service
 * 
 * Handles Google Tasks API integration with OAuth and sync capabilities.
 * Provides bidirectional synchronization between ZeroOS and Google Tasks.
 */

export interface GoogleTasksConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
}

export interface GoogleTask {
    id?: string;
    title: string;
    notes?: string;
    status?: 'needsAction' | 'completed';
    due?: string;
    position?: string;
    parent?: string;
    links?: Array<{
        type: string;
        link: string;
    }>;
    updated?: string;
    selfLink?: string;
}

export interface GoogleTasksList {
    kind: string;
    etag: string;
    items: GoogleTask[];
    nextPageToken?: string;
}

export interface SyncResult {
    success: boolean;
    syncedTasks: number;
    conflicts: number;
    errors: string[];
}

export class GoogleTasksService {
    private oauth2Client: OAuth2Client;
    private tasks: any;

    constructor(config: GoogleTasksConfig) {
        this.oauth2Client = new OAuth2Client(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );

        this.tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Get OAuth2 authorization URL
     */
    getAuthUrl(userId: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/tasks',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: userId,
            prompt: 'consent'
        });
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiry: Date;
    }> {
        const { tokens } = await this.oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error('Failed to get access token');
        }

        if (!tokens.refresh_token) {
            throw new Error('Failed to get refresh token');
        }

        return {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiry: new Date(tokens.expiry_date || Date.now() + 3600000)
        };
    }

    /**
     * Set user tokens
     */
    async setUserTokens(userId: string, tokens: {
        accessToken: string;
        refreshToken: string;
        expiry: Date;
    }): Promise<void> {
        this.oauth2Client.setCredentials({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            expiry_date: tokens.expiry.getTime()
        });

        await UserPermissionsModel.setTokens(userId, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiry: tokens.expiry
        });
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(userId: string): Promise<{
        accessToken: string;
        expiry: Date;
    }> {
        const userPerms = await UserPermissionsModel.getByUserId(userId);
        if (!userPerms || !userPerms.googleRefreshToken) {
            throw new Error('No refresh token available');
        }

        this.oauth2Client.setCredentials({
            refresh_token: userPerms.googleRefreshToken
        });

        const { credentials } = await this.oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
            throw new Error('Failed to refresh access token');
        }

        const newExpiry = new Date(credentials.expiry_date || Date.now() + 3600000);

        await UserPermissionsModel.refreshAccessToken(
            userId,
            credentials.access_token,
            newExpiry
        );

        return {
            accessToken: credentials.access_token,
            expiry: newExpiry
        };
    }

    /**
     * Get user's Google Tasks
     */
    async getUserTasks(userId: string, tasklistId: string = '@default'): Promise<GoogleTask[]> {
        await this.ensureValidTokens(userId);

        try {
            const response = await this.tasks.tasks.list({
                tasklist: tasklistId,
                showCompleted: true,
                showHidden: true,
                maxResults: 100
            });

            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching Google Tasks:', error);
            throw new Error('Failed to fetch Google Tasks');
        }
    }

    /**
     * Create task in Google Tasks
     */
    async createGoogleTask(userId: string, task: GoogleTask, tasklistId: string = '@default'): Promise<GoogleTask> {
        await this.ensureValidTokens(userId);

        try {
            const response = await this.tasks.tasks.insert({
                tasklist: tasklistId,
                requestBody: {
                    title: task.title,
                    notes: task.notes,
                    status: task.status,
                    due: task.due,
                    position: task.position
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error creating Google Task:', error);
            throw new Error('Failed to create Google Task');
        }
    }

    /**
     * Update task in Google Tasks
     */
    async updateGoogleTask(userId: string, taskId: string, updates: Partial<GoogleTask>, tasklistId: string = '@default'): Promise<GoogleTask> {
        await this.ensureValidTokens(userId);

        try {
            const response = await this.tasks.tasks.update({
                tasklist: tasklistId,
                task: taskId,
                requestBody: updates
            });

            return response.data;
        } catch (error) {
            console.error('Error updating Google Task:', error);
            throw new Error('Failed to update Google Task');
        }
    }

    /**
     * Delete task from Google Tasks
     */
    async deleteGoogleTask(userId: string, taskId: string, tasklistId: string = '@default'): Promise<void> {
        await this.ensureValidTokens(userId);

        try {
            await this.tasks.tasks.delete({
                tasklist: tasklistId,
                task: taskId
            });
        } catch (error) {
            console.error('Error deleting Google Task:', error);
            throw new Error('Failed to delete Google Task');
        }
    }

    /**
     * Sync tasks from Google Tasks to ZeroOS
     */
    async syncFromGoogleTasks(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            syncedTasks: 0,
            conflicts: 0,
            errors: []
        };

        try {
            const googleTasks = await this.getUserTasks(userId);

            for (const googleTask of googleTasks) {
                try {
                    if (!googleTask.id) continue;

                    // Check if task already exists
                    const existingTask = await TaskModel.getByGoogleTaskId(googleTask.id);

                    if (existingTask) {
                        // Update existing task
                        const updates = this.mapGoogleTaskToZeroOS(googleTask);
                        await TaskModel.update(existingTask.id, updates);
                        await SyncStateModel.markSyncSuccess(existingTask.id);
                    } else {
                        // Create new task
                        const taskData = this.mapGoogleTaskToZeroOS(googleTask);
                        await TaskModel.create({
                            userId,
                            ...taskData,
                            googleTaskId: googleTask.id
                        });
                    }

                    result.syncedTasks++;
                } catch (error) {
                    console.error(`Error syncing Google Task ${googleTask.id}:`, error);
                    result.errors.push(`Failed to sync task: ${googleTask.title}`);
                }
            }
        } catch (error) {
            console.error('Error syncing from Google Tasks:', error);
            result.success = false;
            result.errors.push('Failed to sync from Google Tasks');
        }

        return result;
    }

    /**
     * Sync tasks from ZeroOS to Google Tasks
     */
    async syncToGoogleTasks(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            syncedTasks: 0,
            conflicts: 0,
            errors: []
        };

        try {
            const pendingChanges = await ChangeModel.getPendingChanges(userId);

            for (const change of pendingChanges) {
                try {
                    const task = await TaskModel.getById(change.taskId);
                    if (!task) continue;

                    switch (change.operation) {
                        case 'create':
                            if (!task.googleTaskId) {
                                const googleTask = await this.createGoogleTask(userId, {
                                    title: task.title,
                                    notes: task.notes,
                                    status: task.status,
                                    due: task.due?.toISOString()
                                });
                                await TaskModel.update(task.id, { googleTaskId: googleTask.id });
                            }
                            break;

                        case 'update':
                            if (task.googleTaskId) {
                                await this.updateGoogleTask(userId, task.googleTaskId, {
                                    title: task.title,
                                    notes: task.notes,
                                    status: task.status,
                                    due: task.due?.toISOString()
                                });
                            }
                            break;

                        case 'delete':
                            if (task.googleTaskId) {
                                await this.deleteGoogleTask(userId, task.googleTaskId);
                            }
                            break;
                    }

                    await ChangeModel.processChange(change.id, true);
                    await SyncStateModel.markSyncSuccess(task.id);
                    result.syncedTasks++;
                } catch (error) {
                    console.error(`Error syncing change ${change.id}:`, error);
                    await ChangeModel.processChange(change.id, false, error.message);
                    result.errors.push(`Failed to sync change: ${change.operation}`);
                }
            }
        } catch (error) {
            console.error('Error syncing to Google Tasks:', error);
            result.success = false;
            result.errors.push('Failed to sync to Google Tasks');
        }

        return result;
    }

    /**
     * Perform bidirectional sync
     */
    async performBidirectionalSync(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            syncedTasks: 0,
            conflicts: 0,
            errors: []
        };

        try {
            // Sync from Google Tasks to ZeroOS
            const fromGoogleResult = await this.syncFromGoogleTasks(userId);
            result.syncedTasks += fromGoogleResult.syncedTasks;
            result.errors.push(...fromGoogleResult.errors);

            // Sync from ZeroOS to Google Tasks
            const toGoogleResult = await this.syncToGoogleTasks(userId);
            result.syncedTasks += toGoogleResult.syncedTasks;
            result.errors.push(...toGoogleResult.errors);

            result.success = fromGoogleResult.success && toGoogleResult.success;
        } catch (error) {
            console.error('Error in bidirectional sync:', error);
            result.success = false;
            result.errors.push('Failed to perform bidirectional sync');
        }

        return result;
    }

    /**
     * Ensure user has valid tokens
     */
    private async ensureValidTokens(userId: string): Promise<void> {
        const userPerms = await UserPermissionsModel.getByUserId(userId);
        if (!userPerms) {
            throw new Error('User permissions not found');
        }

        if (!userPerms.googleAccessToken) {
            throw new Error('No access token available');
        }

        // Check if token needs refresh
        if (await UserPermissionsModel.needsTokenRefresh(userId)) {
            const refreshed = await this.refreshAccessToken(userId);
            this.oauth2Client.setCredentials({
                access_token: refreshed.accessToken,
                expiry_date: refreshed.expiry.getTime()
            });
        } else {
            this.oauth2Client.setCredentials({
                access_token: userPerms.googleAccessToken,
                refresh_token: userPerms.googleRefreshToken,
                expiry_date: userPerms.tokenExpiry?.getTime()
            });
        }
    }

    /**
     * Map Google Task to ZeroOS format
     */
    private mapGoogleTaskToZeroOS(googleTask: GoogleTask): {
        title: string;
        description?: string;
        status: 'needsAction' | 'completed';
        due?: Date;
        priority: 'low' | 'normal' | 'high';
        notes?: string;
        labels: string[];
    } {
        return {
            title: googleTask.title,
            description: googleTask.notes,
            status: googleTask.status === 'completed' ? 'completed' : 'needsAction',
            due: googleTask.due ? new Date(googleTask.due) : undefined,
            priority: 'normal', // Google Tasks doesn't have priority
            notes: googleTask.notes,
            labels: [] // Google Tasks doesn't have labels
        };
    }

    /**
     * Map ZeroOS task to Google Task format
     */
    private mapZeroOSTaskToGoogle(task: TaskWithRelations): GoogleTask {
        return {
            id: task.googleTaskId,
            title: task.title,
            notes: task.notes,
            status: task.status,
            due: task.due?.toISOString(),
            position: '0' // Default position
        };
    }

    /**
     * Get sync status for user
     */
    async getSyncStatus(userId: string): Promise<{
        isConnected: boolean;
        lastSync?: Date;
        pendingChanges: number;
        conflicts: number;
    }> {
        const userPerms = await UserPermissionsModel.getByUserId(userId);
        const isConnected = userPerms && await UserPermissionsModel.areTokensValid(userId);

        const pendingChanges = await ChangeModel.getQueueSize(userId);
        const syncStats = await SyncStateModel.getSyncStats(userId);

        return {
            isConnected: !!isConnected,
            lastSync: userPerms?.lastAuthCheck,
            pendingChanges,
            conflicts: syncStats.conflicts
        };
    }

    /**
     * Disconnect user from Google Tasks
     */
    async disconnectUser(userId: string): Promise<void> {
        await UserPermissionsModel.clearTokens(userId);
    }
}
