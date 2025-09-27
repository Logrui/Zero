// Core notification types
export interface NotificationData {
  id: string;
  userId: string;
  subject: string;
  body: string;
  tags: string[];
  source: 'internal' | 'api';
  apiKeyId?: string;
  readStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationRequest {
  subject: string;
  body: string;
  tags: string[];
  userId?: string; // Optional for API calls (will be inferred from API key)
}

export interface NotificationFilters {
  tags?: string[];
  readStatus?: boolean;
  source?: 'internal' | 'api';
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  limit?: number;
  offset?: number;
}

// API Key types
export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresAt?: string; // ISO date string
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  key?: string; // Full key only returned on creation
  permissions: string[];
  expiresAt?: Date;
  createdAt: Date;
}

// Tag types
export interface TagData {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
}

// UI Component types
export interface NotificationOverlayProps {
  notifications: NotificationData[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface NotificationSettingsProps {
  apiKeys: ApiKeyData[];
  tags: TagData[];
  onCreateApiKey: (data: CreateApiKeyRequest) => Promise<ApiKeyResponse>;
  onDeleteApiKey: (id: string) => Promise<void>;
  onCreateTag: (tag: Omit<TagData, 'id' | 'createdAt'>) => Promise<TagData>;
}

// Hook types for React Query
export interface UseNotificationsOptions extends NotificationFilters {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseNotificationMutations {
  createNotification: (data: CreateNotificationRequest) => Promise<NotificationData>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

// Webhook types for external API integration
export interface WebhookPayload {
  subject: string;
  body: string;
  tags: string[];
}

// Error types
export interface NotificationError {
  code: 'UNAUTHORIZED' | 'INVALID_API_KEY' | 'RATE_LIMITED' | 'VALIDATION_ERROR' | 'NOT_FOUND';
  message: string;
  details?: Record<string, unknown>;
}

// Response wrapper types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: NotificationError;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}