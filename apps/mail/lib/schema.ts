/**
 * Database Schema Definitions
 * Type definitions for the notifications system database schema
 */

// Utility types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationChannel = 'system' | 'email' | 'push' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read' | 'archived';

// Base entity interface
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User interface
export interface User extends BaseEntity {
  email: string;
  name?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface NewUser {
  email: string;
  name?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// API Key interface
export interface ApiKey extends BaseEntity {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface NewApiKey {
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions?: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Notification interface
export interface Notification extends BaseEntity {
  userId: string;
  apiKeyId?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  channel: NotificationChannel;
  status: NotificationStatus;
  tags: string[];
  metadata: Record<string, any>;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  expiresAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
}

export interface NewNotification {
  userId: string;
  apiKeyId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  tags?: string[];
  metadata?: Record<string, any>;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  expiresAt?: string;
  retryCount?: number;
  maxRetries?: number;
  errorMessage?: string;
}

// Notification Event interface
export interface NotificationEvent extends BaseEntity {
  notificationId: string;
  eventType: string;
  eventData: Record<string, any>;
  createdBy?: string;
}

export interface NewNotificationEvent {
  notificationId: string;
  eventType: string;
  eventData?: Record<string, any>;
  createdBy?: string;
}

// Combined types for queries
export interface NotificationWithUser extends Notification {
  user: User;
  apiKey?: ApiKey;
}

export interface NotificationWithEvents extends Notification {
  events: NotificationEvent[];
}

export interface UserWithStats extends User {
  notificationCount: number;
  unreadCount: number;
  lastNotificationAt?: Date;
}

export interface ApiKeyWithStats extends ApiKey {
  notificationCount: number;
  lastNotificationAt?: Date;
}

// Mock table definitions for development compatibility
export const mockTable = {
  $inferSelect: {} as any,
  $inferInsert: {} as any
};

export const users = mockTable;
export const apiKeys = mockTable;
export const notifications = mockTable;
export const notificationEvents = mockTable;

// Schema validation helpers
export const schemaValidation = {
  /**
   * Validate notification type
   */
  isValidNotificationType(type: string): type is NotificationType {
    return ['info', 'success', 'warning', 'error'].includes(type);
  },

  /**
   * Validate notification priority
   */
  isValidNotificationPriority(priority: string): priority is NotificationPriority {
    return ['low', 'medium', 'high', 'urgent'].includes(priority);
  },

  /**
   * Validate notification channel
   */
  isValidNotificationChannel(channel: string): channel is NotificationChannel {
    return ['system', 'email', 'push', 'sms'].includes(channel);
  },

  /**
   * Validate notification status
   */
  isValidNotificationStatus(status: string): status is NotificationStatus {
    return ['pending', 'sent', 'failed', 'read', 'archived'].includes(status);
  },

  /**
   * Get default notification values
   */
  getDefaultNotification(): Pick<Notification, 'type' | 'priority' | 'channel' | 'status' | 'retryCount' | 'maxRetries' | 'tags' | 'metadata'> {
    return {
      type: 'info',
      priority: 'medium',
      channel: 'system',
      status: 'pending',
      retryCount: 0,
      maxRetries: 3,
      tags: [],
      metadata: {}
    };
  },

  /**
   * Get default API key permissions
   */
  getDefaultApiKeyPermissions(): string[] {
    return ['notifications:create', 'notifications:read'];
  }
};

// Export types are already defined above in the interfaces