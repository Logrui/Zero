/**
 * Zod Validation Schemas for Notifications API
 * 
 * This file provides comprehensive validation for all notification-related API endpoints.
 * It includes schemas for requests, responses, and data transformation.
 * 
 * Used by API endpoints to validate incoming requests and ensure data integrity.
 */

import { z } from 'zod';

// Core validation primitives
const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();
const dateStringSchema = z.string().datetime();

// Tag validation
export const tagSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  description: z.string().max(200).optional(),
  isSystem: z.boolean(),
  createdAt: z.date()
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  description: z.string().max(200).optional(),
  isSystem: z.boolean().default(false)
});

// Notification validation
export const notificationSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string()).min(1).max(10),
  source: z.enum(['internal', 'api']),
  apiKeyId: uuidSchema.optional(),
  readStatus: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const createNotificationSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10),
  userId: uuidSchema.optional() // Optional for API calls (inferred from API key)
});

export const updateNotificationSchema = z.object({
  readStatus: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10).optional()
});

// Notification filters validation
export const notificationFiltersSchema = z.object({
  tags: z.array(z.string()).optional(),
  readStatus: z.boolean().optional(),
  source: z.enum(['internal', 'api']).optional(),
  dateFrom: dateStringSchema.optional(),
  dateTo: dateStringSchema.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

// API Key validation
export const apiKeySchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: z.string().min(1).max(100),
  keyPrefix: z.string().length(8),
  permissions: z.array(z.string()).default(['notifications:create', 'notifications:read']),
  lastUsedAt: z.date().optional(),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
  isActive: z.boolean()
});

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(['notifications:create', 'notifications:read']),
  expiresAt: dateStringSchema.optional()
});

// Query parameter validation
export const uuidParamSchema = z.object({
  id: uuidSchema
});

// Webhook payload validation
export const webhookPayloadSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string().min(1).max(30)).min(1).max(10)
});

// Response validation schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.enum(['UNAUTHORIZED', 'INVALID_API_KEY', 'RATE_LIMITED', 'VALIDATION_ERROR', 'NOT_FOUND']),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  }).optional()
});

export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean()
  })
});

// Authentication validation
export const authHeaderSchema = z.object({
  'x-api-key': z.string().min(32).optional(),
  'authorization': z.string().regex(/^Bearer .+/).optional(),
  'x-internal-source': z.enum(['true', 'false']).optional()
});

// Rate limiting validation
export const rateLimitConfigSchema = z.object({
  requests: z.number().int().positive(),
  window: z.string().regex(/^\d+\s+(s|m|h|d)$/, 'Must be format like "10 m" or "1 h"')
});

// Export type inference for TypeScript
export type NotificationData = z.infer<typeof notificationSchema>;
export type CreateNotificationRequest = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationRequest = z.infer<typeof updateNotificationSchema>;
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;
export type ApiKeyData = z.infer<typeof apiKeySchema>;
export type CreateApiKeyRequest = z.infer<typeof createApiKeySchema>;
export type TagData = z.infer<typeof tagSchema>;
export type CreateTagRequest = z.infer<typeof createTagSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type ApiResponse<T = unknown> = z.infer<typeof apiResponseSchema> & { data?: T };
export type PaginatedResponse<T = unknown> = z.infer<typeof paginatedResponseSchema> & { data: T[] };

// Utility validation functions
export function validateNotificationCreate(data: unknown): CreateNotificationRequest {
  return createNotificationSchema.parse(data);
}

export function validateNotificationUpdate(data: unknown): UpdateNotificationRequest {
  return updateNotificationSchema.parse(data);
}

export function validateApiKeyCreate(data: unknown): CreateApiKeyRequest {
  return createApiKeySchema.parse(data);
}

export function validateFilters(params: unknown): NotificationFilters {
  return notificationFiltersSchema.parse(params);
}

export function validateUuidParam(params: unknown): { id: string } {
  return uuidParamSchema.parse(params);
}

export function validateWebhookPayload(data: unknown): WebhookPayload {
  return webhookPayloadSchema.parse(data);
}

// Safe parsing functions that return errors instead of throwing
export function safeValidateNotificationCreate(data: unknown) {
  return createNotificationSchema.safeParse(data);
}

export function safeValidateNotificationUpdate(data: unknown) {
  return updateNotificationSchema.safeParse(data);
}

export function safeValidateApiKeyCreate(data: unknown) {
  return createApiKeySchema.safeParse(data);
}

export function safeValidateFilters(params: unknown) {
  return notificationFiltersSchema.safeParse(params);
}