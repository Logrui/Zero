/**
 * SWR Hooks for Notifications
 * Client-side data fetching and state management for notifications
 */

import { useMemo } from 'react';

// Mock SWR for development - in production would use actual SWR library
interface SWRResponse<T> {
  data?: T;
  error?: any;
  isLoading: boolean;
  mutate: () => Promise<void>;
}

// Mock implementation of SWR
function useSWR<T>(key: string | null, fetcher?: () => Promise<T>): SWRResponse<T> {
  // For development, return mock data immediately
  // In production, this would use the actual SWR library
  
  if (!key || !fetcher) {
    return {
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: async () => {}
    };
  }

  // Mock data based on the key
  let mockData: any;
  
  if (key.includes('/api/notifications')) {
    if (key.includes('stats')) {
      mockData = {
        total: 15,
        unread: 3,
        byPriority: { low: 5, medium: 8, high: 2 }
      };
    } else {
      mockData = {
        notifications: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            subject: 'System Update Available',
            body: 'A new system update is available for your Zero OS installation.',
            tags: ['system', 'update'],
            priority: 'medium',
            source: 'internal',
            isRead: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            subject: 'API Rate Limit Warning',
            body: 'Your application is approaching the API rate limit.',
            tags: ['api', 'warning'],
            priority: 'high',
            source: 'api',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      };
    }
  }

  return {
    data: mockData as T,
    error: undefined,
    isLoading: false,
    mutate: async () => {}
  };
}

export interface Notification {
  id: string;
  subject: string;
  body: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  source: 'internal' | 'api';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  tags?: string[];
  unreadOnly?: boolean;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Fetch notifications from API
 */
async function fetchNotifications(filters: NotificationFilters = {}): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());
  if (filters.tags) params.set('tags', filters.tags.join(','));
  if (filters.unreadOnly) params.set('unreadOnly', 'true');
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.search) params.set('search', filters.search);

  const response = await fetch(`/api/notifications?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.statusText}`);
  }
  
  const result = await response.json() as { data: NotificationsResponse };
  return result.data;
}

/**
 * Fetch a single notification by ID
 */
async function fetchNotification(id: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch notification: ${response.statusText}`);
  }
  
  const result = await response.json() as { data: Notification };
  return result.data;
}

/**
 * Fetch notification statistics
 */
async function fetchNotificationStats(): Promise<NotificationStats> {
  // In production, this would be a separate API endpoint
  const response = await fetch('/api/notifications/stats');
  
  if (!response.ok) {
    // Fallback to calculating from notifications list
    const notifications = await fetchNotifications({ limit: 1000 });
    const stats = {
      total: notifications.pagination.total,
      unread: notifications.notifications.filter(n => !n.isRead).length,
      byPriority: {
        low: notifications.notifications.filter(n => n.priority === 'low').length,
        medium: notifications.notifications.filter(n => n.priority === 'medium').length,
        high: notifications.notifications.filter(n => n.priority === 'high').length,
      }
    };
    return stats;
  }
  
  const result = await response.json() as { data: NotificationStats };
  return result.data;
}

/**
 * Hook to fetch notifications with filtering
 */
export function useNotifications(filters: NotificationFilters = {}) {
  const key = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.tags) params.set('tags', filters.tags.join(','));
    if (filters.unreadOnly) params.set('unreadOnly', 'true');
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);
    
    return `/api/notifications?${params}`;
  }, [filters]);

  return useSWR(key, () => fetchNotifications(filters));
}

/**
 * Hook to fetch a single notification
 */
export function useNotification(id: string | null) {
  const key = id ? `/api/notifications/${id}` : null;
  
  return useSWR(key, id ? (() => fetchNotification(id)) : undefined);
}

/**
 * Hook to fetch notification statistics
 */
export function useNotificationStats() {
  return useSWR('/api/notifications/stats', fetchNotificationStats);
}

/**
 * Hook for unread notifications count
 */
export function useUnreadCount() {
  const { data: stats, error, isLoading } = useNotificationStats();
  
  return {
    count: stats?.unread || 0,
    error,
    isLoading
  };
}

/**
 * Mutation functions for notifications
 */
export const notificationMutations = {
  /**
   * Create a new notification
   */
  async create(data: {
    subject: string;
    body: string;
    tags: string[];
    priority?: 'low' | 'medium' | 'high';
  }): Promise<Notification> {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to create notification');
    }

    const result = await response.json() as { data: Notification };
    return result.data;
  },

  /**
   * Update notification status
   */
  async updateStatus(id: string, isRead: boolean): Promise<void> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead })
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to update notification');
    }
  },

  /**
   * Delete notification
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/notifications/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to delete notification');
    }
  },

  /**
   * Mark multiple notifications as read
   */
  async markAllRead(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map(id => this.updateStatus(id, true))
    );
  }
};