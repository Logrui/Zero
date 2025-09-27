/**
 * Authentication Middleware
 * Handles authentication for API routes using API keys or user sessions
 */

import { validateApiKey, getUserFromRequest } from './api-auth';
import { AuthenticationError, AuthorizationError } from './error-handler';

export interface AuthContext {
  userId: string;
  type: 'api-key' | 'session';
  apiKeyId?: string;
  permissions?: string[];
}

interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Authenticate request and return user context
 */
export async function authenticate(request: RequestLike): Promise<AuthContext> {
  // Try API key authentication first
  const apiKeyResult = await validateApiKey(request);
  if (apiKeyResult.valid) {
    return {
      userId: apiKeyResult.userId!,
      type: 'api-key',
      apiKeyId: apiKeyResult.keyId,
      permissions: ['notifications:create', 'notifications:read'] // Mock permissions
    };
  }

  // Try session authentication
  const userId = await getUserFromRequest(request);
  if (userId) {
    return {
      userId,
      type: 'session',
      permissions: ['notifications:create', 'notifications:read', 'notifications:delete', 'api-keys:manage']
    };
  }

  throw new AuthenticationError('Authentication required');
}

/**
 * Check if user has required permission
 */
export function checkPermission(context: AuthContext, permission: string): boolean {
  if (!context.permissions) {
    return false;
  }

  // Check for exact permission match
  if (context.permissions.includes(permission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., "notifications:*")
  const [resource, action] = permission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (context.permissions.includes(wildcardPermission)) {
    return true;
  }

  // Check for admin permission
  if (context.permissions.includes('*')) {
    return true;
  }

  return false;
}

/**
 * Require authentication middleware
 */
export async function requireAuth(request: RequestLike): Promise<AuthContext> {
  try {
    return await authenticate(request);
  } catch (error) {
    throw new AuthenticationError('Valid authentication required');
  }
}

/**
 * Require specific permission middleware
 */
export async function requirePermission(request: RequestLike, permission: string): Promise<AuthContext> {
  const context = await requireAuth(request);
  
  if (!checkPermission(context, permission)) {
    throw new AuthorizationError(`Permission required: ${permission}`);
  }

  return context;
}

/**
 * Require API key authentication specifically
 */
export async function requireApiKey(request: RequestLike): Promise<AuthContext> {
  const context = await authenticate(request);
  
  if (context.type !== 'api-key') {
    throw new AuthenticationError('API key authentication required');
  }

  return context;
}

/**
 * Require user session authentication specifically
 */
export async function requireSession(request: RequestLike): Promise<AuthContext> {
  const context = await authenticate(request);
  
  if (context.type !== 'session') {
    throw new AuthenticationError('User session required');
  }

  return context;
}

/**
 * Optional authentication - returns context if available, null otherwise
 */
export async function optionalAuth(request: RequestLike): Promise<AuthContext | null> {
  try {
    return await authenticate(request);
  } catch (error) {
    return null;
  }
}

/**
 * Permission definitions for the notifications system
 */
export const PERMISSIONS = {
  NOTIFICATIONS_CREATE: 'notifications:create',
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATIONS_UPDATE: 'notifications:update',
  NOTIFICATIONS_DELETE: 'notifications:delete',
  API_KEYS_CREATE: 'api-keys:create',
  API_KEYS_READ: 'api-keys:read',
  API_KEYS_DELETE: 'api-keys:delete',
  API_KEYS_MANAGE: 'api-keys:manage',
  ADMIN_ALL: '*'
} as const;

/**
 * Default permission sets for different authentication types
 */
export const DEFAULT_PERMISSIONS = {
  'api-key': [
    PERMISSIONS.NOTIFICATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_READ
  ],
  'session': [
    PERMISSIONS.NOTIFICATIONS_CREATE,
    PERMISSIONS.NOTIFICATIONS_READ,
    PERMISSIONS.NOTIFICATIONS_UPDATE,
    PERMISSIONS.NOTIFICATIONS_DELETE,
    PERMISSIONS.API_KEYS_MANAGE
  ]
} as const;