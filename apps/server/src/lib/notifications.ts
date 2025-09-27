import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, desc, and, inArray, gte, lte, sql } from 'drizzle-orm';
import { notifications, apiKeys, tags, type Notification, type InsertNotification } from '../db/schema';

/**
 * Notification Service
 * 
 * Provides business logic for managing notifications, including:
 * - Creating notifications from internal and external sources
 * - Querying notifications with filters and pagination
 * - Updating notification read status
 * - Deleting notifications (manual and automatic retention)
 */

export interface NotificationFilters {
  userId?: string;
  tags?: string[];
  readStatus?: boolean;
  source?: 'internal' | 'api';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationCreateData {
  userId: string;
  subject: string;
  body: string;
  tags: string[];
  source: 'internal' | 'api';
  apiKeyId?: string;
}

export class NotificationService {
  constructor(private db: PostgresJsDatabase<any>) {}

  /**
   * Create a new notification
   */
  async createNotification(data: NotificationCreateData): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId: data.userId,
        subject: data.subject,
        body: data.body,
        tags: data.tags,
        source: data.source,
        apiKeyId: data.apiKeyId,
        readStatus: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!notification) {
      throw new Error('Failed to create notification');
    }

    return notification;
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(filters: NotificationFilters): Promise<{
    notifications: Notification[];
    total: number;
  }> {
    const conditions = [];

    // Build WHERE conditions
    if (filters.userId) {
      conditions.push(eq(notifications.userId, filters.userId));
    }

    if (filters.tags && filters.tags.length > 0) {
      // Check if notification tags array contains any of the filter tags
      conditions.push(
        sql`${notifications.tags} && ARRAY[${filters.tags.join(',')}]::text[]`
      );
    }

    if (filters.readStatus !== undefined) {
      conditions.push(eq(notifications.readStatus, filters.readStatus));
    }

    if (filters.source) {
      conditions.push(eq(notifications.source, filters.source));
    }

    if (filters.dateFrom) {
      conditions.push(gte(notifications.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(notifications.createdAt, filters.dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get notifications with pagination
    const query = this.db
      .select()
      .from(notifications)
      .where(whereClause)
      .orderBy(desc(notifications.createdAt));

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const notificationResults = await query;

    return {
      notifications: notificationResults,
      total,
    };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(id: string, userId: string): Promise<Notification | null> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    return notification || null;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    const [updated] = await this.db
      .update(notifications)
      .set({ 
        readStatus: true, 
        updatedAt: new Date() 
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    return !!updated;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const updated = await this.db
      .update(notifications)
      .set({ 
        readStatus: true, 
        updatedAt: new Date() 
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.readStatus, false)))
      .returning();

    return updated.length;
  }

  /**
   * Delete a notification by ID
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();

    return !!deleted;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.readStatus, false)));

    return result?.count || 0;
  }

  /**
   * Clean up old notifications based on retention policy (30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.db
      .delete(notifications)
      .where(lte(notifications.createdAt, thirtyDaysAgo))
      .returning();

    return deleted.length;
  }

  /**
   * Get notifications for a specific API key (for tracking usage)
   */
  async getNotificationsByApiKey(apiKeyId: string, limit = 100): Promise<Notification[]> {
    return await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.apiKeyId, apiKeyId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
}