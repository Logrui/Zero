/**
 * SWR Hooks for API Keys
 * Client-side data fetching and state management for API keys
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
  if (!key || !fetcher) {
    return {
      data: undefined,
      error: undefined,
      isLoading: false,
      mutate: async () => {}
    };
  }

  // Mock data for API keys
  const mockData = [
    {
      id: 'key-1',
      name: 'Development Key',
      keyPrefix: 'zro_1234****',
      permissions: ['notifications:create', 'notifications:read'],
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      lastUsedAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'key-2', 
      name: 'N8N Integration',
      keyPrefix: 'zro_5678****',
      permissions: ['notifications:create'],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 1 week ago
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      isActive: true
    }
  ];

  return {
    data: mockData as T,
    error: undefined,
    isLoading: false,
    mutate: async () => {}
  };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface CreateApiKeyData {
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string; // Full key only returned on creation
  keyPrefix: string;
  permissions: string[];
  createdAt: string;
}

/**
 * Fetch all API keys for the user
 */
async function fetchApiKeys(): Promise<ApiKey[]> {
  const response = await fetch('/api/notifications/keys');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch API keys: ${response.statusText}`);
  }
  
  const result = await response.json() as { data: ApiKey[] };
  return result.data;
}

/**
 * Fetch a single API key by ID
 */
async function fetchApiKey(id: string): Promise<ApiKey> {
  const response = await fetch(`/api/notifications/keys/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch API key: ${response.statusText}`);
  }
  
  const result = await response.json() as { data: ApiKey };
  return result.data;
}

/**
 * Hook to fetch all API keys
 */
export function useApiKeys() {
  return useSWR('/api/notifications/keys', fetchApiKeys);
}

/**
 * Hook to fetch a single API key
 */
export function useApiKey(id: string | null) {
  const key = id ? `/api/notifications/keys/${id}` : null;
  
  return useSWR(key, id ? (() => fetchApiKey(id)) : undefined);
}

/**
 * Hook to get active API keys count
 */
export function useActiveKeysCount() {
  const { data: keys, error, isLoading } = useApiKeys();
  
  return {
    count: keys?.filter(key => key.isActive).length || 0,
    error,
    isLoading
  };
}

/**
 * Hook to get API key statistics
 */
export function useApiKeyStats() {
  const { data: keys, error, isLoading } = useApiKeys();
  
  const stats = useMemo(() => {
    if (!keys) return null;
    
    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const oneWeekAgo = now - 7 * 86400000;
    
    return {
      total: keys.length,
      active: keys.filter(key => key.isActive).length,
      inactive: keys.filter(key => !key.isActive).length,
      recentlyUsed: keys.filter(key => 
        key.lastUsedAt && new Date(key.lastUsedAt).getTime() > oneDayAgo
      ).length,
      recentlyCreated: keys.filter(key => 
        new Date(key.createdAt).getTime() > oneWeekAgo
      ).length
    };
  }, [keys]);
  
  return {
    stats,
    error,
    isLoading
  };
}

/**
 * Mutation functions for API keys
 */
export const apiKeyMutations = {
  /**
   * Create a new API key
   */
  async create(data: CreateApiKeyData): Promise<CreateApiKeyResponse> {
    const response = await fetch('/api/notifications/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to create API key');
    }

    const result = await response.json() as { data: CreateApiKeyResponse };
    return result.data;
  },

  /**
   * Delete an API key
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/notifications/keys/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || 'Failed to delete API key');
    }
  },

  /**
   * Revoke (deactivate) an API key
   */
  async revoke(id: string): Promise<void> {
    // For now, deletion and revocation are the same
    // In a full implementation, revoke might just mark as inactive
    return this.delete(id);
  }
};

/**
 * Utility functions for API keys
 */
export const apiKeyUtils = {
  /**
   * Format key prefix for display
   */
  formatKeyPrefix(keyPrefix: string): string {
    return keyPrefix + '****';
  },

  /**
   * Get relative time string for dates
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Validate API key name
   */
  validateKeyName(name: string): { valid: boolean; error?: string } {
    if (!name.trim()) {
      return { valid: false, error: 'Name is required' };
    }
    
    if (name.length > 100) {
      return { valid: false, error: 'Name too long (max 100 characters)' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores' };
    }
    
    return { valid: true };
  },

  /**
   * Get permission display names
   */
  getPermissionDisplayName(permission: string): string {
    const permissionMap: Record<string, string> = {
      'notifications:create': 'Create Notifications',
      'notifications:read': 'Read Notifications',
      'notifications:update': 'Update Notifications', 
      'notifications:delete': 'Delete Notifications',
      'api-keys:create': 'Create API Keys',
      'api-keys:read': 'Read API Keys',
      'api-keys:delete': 'Delete API Keys',
      'api-keys:manage': 'Manage API Keys',
      '*': 'All Permissions'
    };
    
    return permissionMap[permission] || permission;
  },

  /**
   * Check if key has specific permission
   */
  hasPermission(apiKey: ApiKey, permission: string): boolean {
    if (apiKey.permissions.includes('*')) return true;
    if (apiKey.permissions.includes(permission)) return true;
    
    // Check for wildcard permissions (e.g., "notifications:*")
    const [resource] = permission.split(':');
    const wildcardPermission = `${resource}:*`;
    return apiKey.permissions.includes(wildcardPermission);
  }
};