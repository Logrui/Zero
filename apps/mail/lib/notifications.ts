/**
 * Client-side Notifications Service
 * Handles notification CRUD operations for the mail app
 */

export interface NotificationData {
  id?: string;
  userId: string;
  subject: string;
  body: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  source: 'internal' | 'api';
  apiKeyId?: string;
  isRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  tags?: string[];
  unreadOnly?: boolean;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface NotificationResult {
  notifications: NotificationData[];
  total: number;
}

// Mock data for development - in production this would connect to actual database
const mockNotifications: NotificationData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: 'user-123',
    subject: 'System Update Available',
    body: 'A new system update is available for your Zero OS installation.',
    tags: ['system', 'update'],
    priority: 'medium',
    source: 'internal',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: 'user-123',
    subject: 'API Rate Limit Warning',
    body: 'Your application is approaching the API rate limit.',
    tags: ['api', 'warning'],
    priority: 'high',
    source: 'api',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  }
];

/**
 * Create a new notification
 */
export async function createNotification(data: NotificationData): Promise<NotificationData> {
  // In production, this would save to database
  // For now, add to mock data
  const notification: NotificationData = {
    ...data,
    id: generateId(),
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockNotifications.unshift(notification);
  return notification;
}

/**
 * Get notifications with filtering and pagination
 */
export async function getNotifications(userId: string, filters: NotificationFilters = {}): Promise<NotificationResult> {
  // Filter notifications for user
  let userNotifications = mockNotifications.filter(n => n.userId === userId);
  
  // Apply filters
  if (filters.tags && filters.tags.length > 0) {
    userNotifications = userNotifications.filter(n => 
      filters.tags!.some(tag => n.tags.includes(tag))
    );
  }
  
  if (filters.unreadOnly) {
    userNotifications = userNotifications.filter(n => !n.isRead);
  }
  
  if (filters.priority) {
    userNotifications = userNotifications.filter(n => n.priority === filters.priority);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    userNotifications = userNotifications.filter(n => 
      n.subject.toLowerCase().includes(searchLower) || 
      n.body.toLowerCase().includes(searchLower) ||
      n.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  const total = userNotifications.length;
  
  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;
  
  const paginatedNotifications = userNotifications.slice(offset, offset + limit);
  
  return {
    notifications: paginatedNotifications,
    total
  };
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(id: string, userId: string): Promise<NotificationData | null> {
  const notification = mockNotifications.find(n => n.id === id && n.userId === userId);
  return notification || null;
}

/**
 * Update notification read status
 */
export async function updateNotificationStatus(id: string, userId: string, isRead: boolean): Promise<boolean> {
  const notification = mockNotifications.find(n => n.id === id && n.userId === userId);
  if (notification) {
    notification.isRead = isRead;
    notification.updatedAt = new Date().toISOString();
    return true;
  }
  return false;
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const index = mockNotifications.findIndex(n => n.id === id && n.userId === userId);
  if (index !== -1) {
    mockNotifications.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Delete multiple notifications
 */
export async function deleteNotifications(ids: string[], userId: string): Promise<number> {
  let deletedCount = 0;
  for (const id of ids) {
    if (await deleteNotification(id, userId)) {
      deletedCount++;
    }
  }
  return deletedCount;
}

/**
 * Get notification statistics for user
 */
export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  byPriority: Record<string, number>;
}> {
  const userNotifications = mockNotifications.filter(n => n.userId === userId);
  
  const stats = {
    total: userNotifications.length,
    unread: userNotifications.filter(n => !n.isRead).length,
    byPriority: {
      low: userNotifications.filter(n => n.priority === 'low').length,
      medium: userNotifications.filter(n => n.priority === 'medium').length,
      high: userNotifications.filter(n => n.priority === 'high').length,
    }
  };
  
  return stats;
}

/**
 * Generate a UUID-like ID for development
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}