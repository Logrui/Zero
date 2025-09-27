/**
 * Request Validation Integration
 * Centralized validation utilities for API requests
 */

import { z } from 'zod';
import { ValidationError } from './error-handler';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').optional().default(50),
  
  // Search and filtering
  search: z.string().max(200, 'Search query too long').optional(),
  tags: z.union([
    z.string().transform(str => str.split(',').map(tag => tag.trim()).filter(Boolean)),
    z.array(z.string())
  ]).optional(),
  
  // Boolean flags
  boolean: z.union([
    z.boolean(),
    z.string().transform(str => str.toLowerCase() === 'true')
  ]).optional(),
  
  // Date validation
  dateString: z.string().datetime().optional(),
  
  // Priority levels
  priority: z.enum(['low', 'medium', 'high']).optional()
};

/**
 * Notification-specific validation schemas
 */
export const notificationSchemas = {
  // Create notification
  create: z.object({
    subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
    body: z.string().min(1, 'Body is required').max(2000, 'Body too long'),
    tags: z.array(z.string().min(1)).min(1, 'At least one tag required').max(10, 'Too many tags'),
    priority: commonSchemas.priority.default('medium')
  }),
  
  // Update notification
  update: z.object({
    isRead: z.boolean().optional(),
    tags: z.array(z.string()).optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided'),
  
  // Query notifications
  query: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    search: commonSchemas.search,
    tags: commonSchemas.tags,
    unreadOnly: commonSchemas.boolean,
    priority: commonSchemas.priority,
    dateFrom: commonSchemas.dateString,
    dateTo: commonSchemas.dateString
  }),
  
  // Bulk operations
  bulkIds: z.object({
    ids: z.array(commonSchemas.uuid).min(1, 'At least one ID required').max(50, 'Too many IDs')
  })
};

/**
 * API key validation schemas
 */
export const apiKeySchemas = {
  // Create API key
  create: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    permissions: z.array(z.string()).optional().default(['notifications:create']),
    expiresAt: commonSchemas.dateString
  }),
  
  // Update API key
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

/**
 * Validate request body against schema
 */
export async function validateBody<T>(
  request: { json(): Promise<any> },
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Request validation failed',
        error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }
    throw new ValidationError('Invalid JSON in request body');
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T>(
  url: string | URL,
  schema: z.ZodSchema<T>
): T {
  try {
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const params = Object.fromEntries(urlObj.searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Query parameter validation failed',
        error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }
    throw new ValidationError('Invalid query parameters');
  }
}

/**
 * Validate route parameters
 */
export function validateParams<T>(
  params: Record<string, any>,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Route parameter validation failed',
        error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      );
    }
    throw new ValidationError('Invalid route parameters');
  }
}

/**
 * Sanitize string input to prevent XSS and other attacks
 */
export function sanitizeString(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(tag => sanitizeString(tag))
    .slice(0, 10); // Max 10 tags
}

/**
 * Validate and sanitize notification data
 */
export function sanitizeNotificationData(data: any) {
  return {
    ...data,
    subject: sanitizeString(data.subject || ''),
    body: sanitizeString(data.body || ''),
    tags: sanitizeTags(data.tags || [])
  };
}

/**
 * Content-Type validation
 */
export function validateContentType(request: { headers: { get(name: string): string | null } }, expectedType = 'application/json') {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes(expectedType)) {
    throw new ValidationError(`Content-Type must be ${expectedType}`);
  }
}

/**
 * Rate limit validation helpers
 */
export function parseRateLimitHeaders(headers: { get(name: string): string | null }) {
  const remaining = headers.get('x-ratelimit-remaining');
  const resetTime = headers.get('x-ratelimit-reset');
  
  return {
    remaining: remaining ? parseInt(remaining, 10) : null,
    resetTime: resetTime ? parseInt(resetTime, 10) : null
  };
}