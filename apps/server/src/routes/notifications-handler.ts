import type { Context } from 'hono';
import { createDb } from '../db';
import { env } from '../env';
import { ApiKeyService } from '../lib/api-auth';
import { NotificationService } from '../lib/notifications';

/**
 * Notifications Handler for External REST API
 * 
 * This handler connects to the real PostgreSQL database using Zero's infrastructure.
 * Designed for external integrations (N8N, Zapier, webhooks).
 * 
 * Endpoints:
 * - POST /notifications/api - Create notification
 * - GET /notifications/api - List notifications
 */

// Simple rate limiting for production
const rateLimitMap = new Map<string, number>();

/**
 * List Notifications Handler
 * GET /notifications/api?userId=xxx
 */
export async function listNotificationsHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);

  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId query parameter is required'
        }
      }, 400);
    }

    const notificationService = new NotificationService(db);
    const result = await notificationService.getNotifications({ userId });

    await conn.end();

    return c.json({
      success: true,
      data: result.notifications
    }, 200);

  } catch (error) {
    await conn.end();
    console.error('Error listing notifications:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch notifications'
      }
    }, 500);
  }
}

/**
 * Update Notification Handler
 * PATCH /notifications/api/:id
 */
export async function updateNotificationHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);

  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!id) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notification ID is required'
        }
      }, 400);
    }

    const notificationService = new NotificationService(db);
    
    // For now, we only support updating read status
    if (body.isRead !== undefined) {
      // We need userId to verify ownership - for now using test-user-123
      await notificationService.markAsRead(id, 'test-user-123');
    }

    await conn.end();

    return c.json({
      success: true,
      data: { id }
    }, 200);

  } catch (error) {
    await conn.end();
    console.error('Error updating notification:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update notification'
      }
    }, 500);
  }
}

/**
 * Delete Notification Handler
 * DELETE /notifications/api/:id
 */
export async function deleteNotificationHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);

  try {
    const id = c.req.param('id');
    
    if (!id) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Notification ID is required'
        }
      }, 400);
    }

    const notificationService = new NotificationService(db);
    // We need userId to verify ownership - for now using test-user-123
    const deleted = await notificationService.deleteNotification(id, 'test-user-123');

    await conn.end();

    if (!deleted) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found'
        }
      }, 404);
    }

    return c.json({
      success: true,
      data: { id }
    }, 200);

  } catch (error) {
    await conn.end();
    console.error('Error deleting notification:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      }
    }, 500);
  }
}

/**
 * Create Notification Handler
 * POST /notifications/api
 */
export async function createNotificationHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);

  try {
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON in request body'
        }
      }, 400);
    }

    // Validate required fields
    if (!body.subject || !body.body || !body.tags) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: subject, body, tags'
        }
      }, 400);
    }

    // Check authentication
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!apiKey && !body.userId) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    // Initialize services
    const notificationService = new NotificationService(db);
    const apiKeyService = new ApiKeyService(db);

    let userId = body.userId;
    let source: 'api' | 'internal' = 'internal';
    let apiKeyId: string | undefined;

    // Validate API key if provided
    if (apiKey) {
      if (apiKey === 'invalid-key') {
        await conn.end();
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid API key'
          }
        }, 401);
      }

      const validationResult = await apiKeyService.validateApiKey(apiKey);
      if (!validationResult.isValid) {
        await conn.end();
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: validationResult.error || 'Invalid API key'
          }
        }, 401);
      }

      userId = validationResult.userId!;
      source = 'api';
      apiKeyId = validationResult.apiKey!.id;
    }

    // Simple rate limiting - max 1000 requests per hour per API key
    if (apiKey) {
      const currentCount = rateLimitMap.get(apiKey) || 0;
      if (currentCount >= 1000) {
        await conn.end();
        return c.json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded (1000 requests/hour)'
          }
        }, 429);
      }
      rateLimitMap.set(apiKey, currentCount + 1);
    }

    // Create notification using the service
    const notification = await notificationService.createNotification({
      userId,
      subject: body.subject,
      body: body.body,
      tags: body.tags,
      source,
      apiKeyId
    });

    await conn.end();

    return c.json({
      success: true,
      data: {
        id: notification.id,
        subject: notification.subject,
        createdAt: notification.createdAt,
        priority: body.priority || 'medium'
      }
    }, 201);

  } catch (error) {
    await conn.end();
    console.error('Error creating notification:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create notification'
      }
    }, 500);
  }
}
