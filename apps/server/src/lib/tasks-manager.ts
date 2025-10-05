import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import { createDb } from '../db';
import { connection, tasks } from '../db/schema';
import { env } from '../env';

/**
 * Tasks Manager
 * 
 * Manages task operations with Google Tasks synchronization.
 * Follows the same pattern as CalendarManager for consistency.
 */

export interface Task {
    id: string;
    googleTaskId: string | null;
    userId: string;
    title: string;
    description: string | null;
    status: 'needsAction' | 'completed';
    due: Date | null;
    priority: 'low' | 'normal' | 'high';
    notes: string | null;
    labels: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTaskData {
    title: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: string;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
}

export interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: 'needsAction' | 'completed';
    due?: string;
    priority?: 'low' | 'normal' | 'high';
    notes?: string;
    labels?: string[];
}

export interface TaskFilters {
    status?: 'needsAction' | 'completed';
    priority?: 'low' | 'normal' | 'high';
}

export class TasksManager {
    constructor() { }

    /**
     * Get Google access token for user from better-auth connection
     */
    private async getGoogleAccessToken(userId: string): Promise<string | null> {
        console.log('🔍 [TasksManager.getGoogleAccessToken] Checking for Google access token', { userId });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        try {
            const userConnection = await db
                .select()
                .from(connection)
                .where(
                    and(
                        eq(connection.userId, userId),
                        eq(connection.providerId, 'google')
                    )
                )
                .limit(1);

            console.log('📊 [TasksManager.getGoogleAccessToken] Database query result', {
                userId,
                connectionFound: userConnection.length > 0,
                connectionCount: userConnection.length
            });

            if (!userConnection.length) {
                console.log('❌ [TasksManager.getGoogleAccessToken] No Google connection found for user');
                return null;
            }

            const connData = userConnection[0];
            console.log('📊 [TasksManager.getGoogleAccessToken] Connection data', {
                userId,
                hasAccessToken: !!connData.accessToken,
                hasRefreshToken: !!connData.refreshToken,
                expiresAt: connData.expiresAt,
                isExpired: connData.expiresAt ? new Date(connData.expiresAt) < new Date() : 'no expiry'
            });

            // Check if token is expired
            if (connData.expiresAt && new Date(connData.expiresAt) < new Date()) {
                console.log('❌ [TasksManager.getGoogleAccessToken] Access token is expired');
                return null;
            }

            console.log('✅ [TasksManager.getGoogleAccessToken] Valid access token found');
            return connData.accessToken;
        } catch (error) {
            console.error('❌ [TasksManager.getGoogleAccessToken] Error getting Google access token:', error);
            return null;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get all tasks for a user with optional filters
     */
    async getTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
        console.log('🔍 [TasksManager.getTasks] Starting task retrieval', {
            userId,
            filters,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            console.log('🔗 [TasksManager.getTasks] Database connection established');

            const conditions = [eq(tasks.userId, userId)];
            console.log('🔍 [TasksManager.getTasks] Query conditions:', conditions);

            if (filters?.status) {
                conditions.push(eq(tasks.status, filters.status));
                console.log('🔍 [TasksManager.getTasks] Added status filter:', filters.status);
            }

            if (filters?.priority) {
                conditions.push(eq(tasks.priority, filters.priority));
                console.log('🔍 [TasksManager.getTasks] Added priority filter:', filters.priority);
            }

            console.log('🔍 [TasksManager.getTasks] Final conditions:', conditions);

            const userTasks = await db
                .select()
                .from(tasks)
                .where(and(...conditions))
                .orderBy(desc(tasks.createdAt));

            console.log('📊 [TasksManager.getTasks] Raw query result:', {
                userId,
                taskCount: userTasks.length,
                tasks: userTasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
            });

            return userTasks as Task[];
        } catch (error) {
            console.error('❌ [TasksManager.getTasks] Error:', error);
            console.error('❌ [TasksManager.getTasks] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined
            });
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get a single task by ID
     */
    async getTask(userId: string, taskId: string): Promise<Task | null> {
        console.log('🔍 [TasksManager.getTask] Fetching task', {
            userId,
            taskId,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            const [task] = await db
                .select()
                .from(tasks)
                .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
                .limit(1);

            console.log('📊 [TasksManager.getTask] Task found:', !!task);

            return (task as Task) || null;
        } catch (error) {
            console.error('❌ [TasksManager.getTask] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Create a new task
     */
    async createTask(userId: string, data: CreateTaskData): Promise<Task> {
        console.log('🔍 [TasksManager.createTask] Creating task', {
            userId,
            title: data.title,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            const now = new Date();
            const taskId = crypto.randomUUID();

            const [newTask] = await db
                .insert(tasks)
                .values({
                    id: taskId,
                    userId,
                    title: data.title,
                    description: data.description || null,
                    status: data.status || 'needsAction',
                    due: data.due ? new Date(data.due) : null,
                    priority: data.priority || 'normal',
                    notes: data.notes || null,
                    labels: data.labels || [],
                    googleTaskId: null,
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            console.log('✅ [TasksManager.createTask] Task created', {
                taskId: newTask.id,
            });

            return newTask as Task;
        } catch (error) {
            console.error('❌ [TasksManager.createTask] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Update an existing task
     */
    async updateTask(userId: string, taskId: string, data: UpdateTaskData): Promise<Task> {
        console.log('🔍 [TasksManager.updateTask] Updating task', {
            userId,
            taskId,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            const updateData: any = {
                ...data,
                updatedAt: new Date(),
            };

            if (data.due) {
                updateData.due = new Date(data.due);
            }

            const [updatedTask] = await db
                .update(tasks)
                .set(updateData)
                .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
                .returning();

            if (!updatedTask) {
                throw new Error('Task not found');
            }

            console.log('✅ [TasksManager.updateTask] Task updated', {
                taskId: updatedTask.id,
            });

            return updatedTask as Task;
        } catch (error) {
            console.error('❌ [TasksManager.updateTask] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Delete a task
     */
    async deleteTask(userId: string, taskId: string): Promise<void> {
        console.log('🔍 [TasksManager.deleteTask] Deleting task', {
            userId,
            taskId,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            await db
                .delete(tasks)
                .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

            console.log('✅ [TasksManager.deleteTask] Task deleted', {
                taskId,
            });
        } catch (error) {
            console.error('❌ [TasksManager.deleteTask] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Toggle task completion status
     */
    async toggleTask(userId: string, taskId: string): Promise<Task> {
        console.log('🔍 [TasksManager.toggleTask] Toggling task', {
            userId,
            taskId,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            // First get the current task
            const [currentTask] = await db
                .select()
                .from(tasks)
                .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
                .limit(1);

            if (!currentTask) {
                throw new Error('Task not found');
            }

            // Toggle the status
            const newStatus = currentTask.status === 'completed' ? 'needsAction' : 'completed';

            const [updatedTask] = await db
                .update(tasks)
                .set({
                    status: newStatus,
                    updatedAt: new Date(),
                })
                .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
                .returning();

            console.log('✅ [TasksManager.toggleTask] Task toggled', {
                taskId,
                newStatus,
            });

            return updatedTask as Task;
        } catch (error) {
            console.error('❌ [TasksManager.toggleTask] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Sync tasks with Google Tasks
     */
    async syncWithGoogleTasks(userId: string): Promise<{
        success: boolean;
        syncedCount: number;
        errors: string[];
    }> {
        console.log('🔍 [TasksManager.syncWithGoogleTasks] Starting sync', {
            userId,
        });

        try {
            // Get Google access token
            const accessToken = await this.getGoogleAccessToken(userId);
            if (!accessToken) {
                console.log('❌ [TasksManager.syncWithGoogleTasks] No Google access token found');
                return {
                    success: false,
                    syncedCount: 0,
                    errors: ['No Google access token found. Please connect your Google account with Tasks permissions. Go to Settings > Connections to connect your Google account.'],
                };
            }

            // Fetch tasks from Google Tasks API
            const googleTasks = await this.fetchGoogleTasks(accessToken);
            console.log('📥 [TasksManager.syncWithGoogleTasks] Fetched Google tasks', {
                count: googleTasks.length,
            });

            // Sync tasks to database
            const syncedCount = await this.syncTasksToDatabase(userId, googleTasks);
            console.log('✅ [TasksManager.syncWithGoogleTasks] Sync complete', {
                syncedCount,
            });

            return {
                success: true,
                syncedCount,
                errors: [],
            };
        } catch (error) {
            console.error('❌ [TasksManager.syncWithGoogleTasks] Error:', error);
            return {
                success: false,
                syncedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    /**
     * Fetch tasks from Google Tasks API
     */
    private async fetchGoogleTasks(accessToken: string): Promise<any[]> {
        console.log('🔍 [TasksManager.fetchGoogleTasks] Fetching from Google Tasks API');

        const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Google Tasks API authorization failed. Your Google account connection does not have Tasks API permissions. Please go to Settings > Connections and reconnect your Google account to grant Tasks access.');
            }
            if (response.status === 403) {
                throw new Error('Google Tasks API access denied. Please ensure the Google Tasks API is enabled in your Google Cloud Console project.');
            }
            throw new Error(`Google Tasks API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { items?: Array<{ id: string }> };
        console.log('📥 [TasksManager.fetchGoogleTasks] Google Tasks API response', {
            listsCount: data.items?.length || 0,
        });

        // Get tasks from the default task list
        const defaultListId = data.items?.[0]?.id;
        if (!defaultListId) {
            console.log('⚠️ [TasksManager.fetchGoogleTasks] No default task list found');
            return [];
        }

        const tasksResponse = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultListId}/tasks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!tasksResponse.ok) {
            if (tasksResponse.status === 401) {
                throw new Error('Google Tasks API authorization failed. Your Google account connection does not have Tasks API permissions. Please go to Settings > Connections and reconnect your Google account to grant Tasks access.');
            }
            if (tasksResponse.status === 403) {
                throw new Error('Google Tasks API access denied. Please ensure the Google Tasks API is enabled in your Google Cloud Console project.');
            }
            throw new Error(`Google Tasks API error: ${tasksResponse.status} ${tasksResponse.statusText}`);
        }

        const tasksData = await tasksResponse.json() as { items?: any[] };
        console.log('📥 [TasksManager.fetchGoogleTasks] Fetched tasks', {
            tasksCount: tasksData.items?.length || 0,
        });

        return tasksData.items || [];
    }

    /**
     * Sync Google tasks to database
     */
    private async syncTasksToDatabase(userId: string, googleTasks: any[]): Promise<number> {
        console.log('🔍 [TasksManager.syncTasksToDatabase] Syncing tasks to database', {
            userId,
            tasksCount: googleTasks.length,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
        let syncedCount = 0;

        try {
            for (const googleTask of googleTasks) {
                // Check if task already exists
                const existingTask = await db
                    .select()
                    .from(tasks)
                    .where(and(
                        eq(tasks.userId, userId),
                        eq(tasks.googleTaskId, googleTask.id)
                    ))
                    .limit(1);

                if (existingTask.length > 0) {
                    // Update existing task
                    await db
                        .update(tasks)
                        .set({
                            title: googleTask.title,
                            description: googleTask.notes || null,
                            status: googleTask.status === 'completed' ? 'completed' : 'needsAction',
                            due: googleTask.due ? new Date(googleTask.due) : null,
                            priority: googleTask.position ? 'high' : 'normal',
                            updatedAt: new Date(),
                        })
                        .where(eq(tasks.id, existingTask[0].id));

                    console.log('🔄 [TasksManager.syncTasksToDatabase] Updated existing task', {
                        taskId: existingTask[0].id,
                        googleTaskId: googleTask.id,
                    });
                } else {
                    // Create new task
                    await db
                        .insert(tasks)
                        .values({
                            id: randomUUID(),
                            userId,
                            googleTaskId: googleTask.id,
                            title: googleTask.title,
                            description: googleTask.notes || null,
                            status: googleTask.status === 'completed' ? 'completed' : 'needsAction',
                            due: googleTask.due ? new Date(googleTask.due) : null,
                            priority: googleTask.position ? 'high' : 'normal',
                            notes: null,
                            labels: [],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });

                    console.log('➕ [TasksManager.syncTasksToDatabase] Created new task', {
                        googleTaskId: googleTask.id,
                        title: googleTask.title,
                    });
                }

                syncedCount++;
            }

            console.log('✅ [TasksManager.syncTasksToDatabase] Sync complete', {
                syncedCount,
            });

            return syncedCount;
        } catch (error) {
            console.error('❌ [TasksManager.syncTasksToDatabase] Error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    /**
     * Get sync status and statistics
     */
    async getSyncStatus(userId: string): Promise<{
        isOnline: boolean;
        lastSync: Date | null;
        pendingChanges: number;
        syncedTasks: number;
        totalTasks: number;
    }> {
        console.log('🔍 [TasksManager.getSyncStatus] Getting sync status', {
            userId,
        });

        const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

        try {
            console.log('🔗 [TasksManager.getSyncStatus] Database connection established');

            const userTasks = await db
                .select()
                .from(tasks)
                .where(eq(tasks.userId, userId));

            console.log('📊 [TasksManager.getSyncStatus] Raw query result:', {
                userId,
                taskCount: userTasks.length,
                tasks: userTasks.map(t => ({ id: t.id, title: t.title, googleTaskId: t.googleTaskId }))
            });

            const syncedTasks = userTasks.filter((t) => t.googleTaskId !== null).length;

            const result = {
                isOnline: true,
                lastSync: null, // TODO: Track last sync time
                pendingChanges: 0,
                syncedTasks,
                totalTasks: userTasks.length,
            };

            console.log('✅ [TasksManager.getSyncStatus] Sync status calculated:', result);

            await conn.end();

            return result;
        } catch (error) {
            console.error('❌ [TasksManager.getSyncStatus] Error:', error);
            console.error('❌ [TasksManager.getSyncStatus] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined
            });
            await conn.end();
            throw error;
        }
    }
}

