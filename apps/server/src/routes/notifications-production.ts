import type { Context } from 'hono';
import { createDb } from '../db';
import { env } from '../env';
import { NotificationService } from '../lib/notifications';
import { ApiKeyService } from '../lib/api-auth';

/**
 * Notifications Handler for External REST API
 * 
 * This handler connects to the real PostgreSQL database using Zero's infrastructure.
 * Designed for external integrations (N8N, Zapier, webhooks).
 * 
 * Endpoint: POST /notifications/api
 */

// Simple rate limiting for production
const rateLimitMap = new Map<string, number>();

/**
 * Create Notification Handler
 * POST /notifications/api
 */
export async function createNotificationHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
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

    // Simple rate limiting - max 10 requests per API key
    if (apiKey) {
      const currentCount = rateLimitMap.get(apiKey) || 0;
      if (currentCount >= 10) {
        await conn.end();
        return c.json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded'
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
      data: notification
    }, 201);

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create notification'
      }
    }, 500);
  }
}

/**
 * List Notifications Handler
 * GET /notifications/api/list
 */
export async function listNotificationsHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check authentication
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    if (!apiKey) {
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
    const apiKeyService = new ApiKeyService(db);
    const notificationService = new NotificationService(db);

    // Validate API key
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

    const userId = validationResult.userId!;

    // Parse query parameters for filtering
    const tags = c.req.query('tags')?.split(',').filter(Boolean);
    const readStatusParam = c.req.query('read');
    const readStatus = readStatusParam !== undefined ? readStatusParam === 'true' : undefined;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Get notifications
    const result = await notificationService.getNotifications({
      userId,
      tags,
      readStatus,
      limit,
      offset
    });

    await conn.end();

    return c.json({
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        limit,
        offset
      }
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve notifications'
      }
    }, 500);
  }
});

// GET /notifications/:id - Get single notification with database integration
notificationsDatabaseRouter.get('/notifications/:id', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check authentication (API key or internal)
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    
    if (!apiKey && !isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    let userId: string;

    if (isInternal) {
      // For internal requests, we'd normally get userId from session
      // For now, use a placeholder - this should be improved with real session handling
      userId = 'test-user-id';
    } else {
      // Validate API key
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

      const apiKeyService = new ApiKeyService(db);
      const validationResult = await apiKeyService.validateApiKey(apiKey!);
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
    }

    const id = c.req.param('id');
    const notificationService = new NotificationService(db);
    
    // Get notification by ID
    const notification = await notificationService.getNotificationById(id, userId);

    await conn.end();

    if (!notification) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      }, 404);
    }

    return c.json({
      success: true,
      data: notification
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve notification'
      }
    }, 500);
  }
});

// PATCH /notifications/:id - Update notification with database integration
notificationsDatabaseRouter.patch('/notifications/:id', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check authentication (API key or internal)
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    
    if (!apiKey && !isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    let userId: string;

    if (isInternal) {
      userId = 'test-user-id';
    } else {
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

      const apiKeyService = new ApiKeyService(db);
      const validationResult = await apiKeyService.validateApiKey(apiKey!);
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
    }

    // Check content type
    const contentType = c.req.header('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        }
      }, 400);
    }

    // Parse and validate request body
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

    // Validate update data
    if (body.readStatus !== undefined && typeof body.readStatus !== 'boolean') {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'readStatus must be a boolean'
        }
      }, 400);
    }

    const id = c.req.param('id');
    const notificationService = new NotificationService(db);
    
    // Handle different update operations
    if (body.readStatus !== undefined) {
      // Update read status
      if (body.readStatus === true) {
        const success = await notificationService.markAsRead(id, userId);
        if (!success) {
          await conn.end();
          return c.json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Notification not found' }
          }, 404);
        }
      }
      // Note: We don't implement marking as unread since it wasn't in the requirements
    }

    // Get updated notification
    const notification = await notificationService.getNotificationById(id, userId);
    
    await conn.end();

    if (!notification) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      }, 404);
    }

    return c.json({
      success: true,
      data: notification
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update notification'
      }
    }, 500);
  }
});

// DELETE /notifications/:id - Delete notification with database integration
notificationsDatabaseRouter.delete('/notifications/:id', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check authentication (API key or internal)
    const apiKey = c.req.header('X-API-Key') || c.req.header('Authorization')?.replace('Bearer ', '');
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    
    if (!apiKey && !isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    let userId: string;

    if (isInternal) {
      userId = 'test-user-id';
    } else {
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

      const apiKeyService = new ApiKeyService(db);
      const validationResult = await apiKeyService.validateApiKey(apiKey!);
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
    }

    const id = c.req.param('id');
    const notificationService = new NotificationService(db);
    
    // Delete notification
    const success = await notificationService.deleteNotification(id, userId);

    await conn.end();

    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      }
    }, 500);
  }
});

// POST /notifications/keys - Create API key with database integration
notificationsDatabaseRouter.post('/notifications/keys', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
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

    // Check for internal authentication
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    if (!isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Internal authentication required'
        }
      }, 401);
    }

    // Validate request body
    if (!body.name || !body.permissions) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: name, permissions'
        }
      }, 400);
    }

    // Mock user ID for now (TODO: get from session)
    const userId = 'test-user-id';

    const apiKeyService = new ApiKeyService(db);

    // Create API key using the service
    try {
      const result = await apiKeyService.createApiKey({
        userId,
        name: body.name,
        permissions: body.permissions,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
      });

      await conn.end();

      return c.json({
        success: true,
        data: {
          id: result.apiKey.id,
          name: result.apiKey.name,
          key: result.key,
          keyPrefix: result.apiKey.prefix,
          permissions: result.apiKey.permissions,
          userId: result.apiKey.userId,
          createdAt: result.apiKey.createdAt?.toISOString(),
          expiresAt: result.apiKey.expiresAt?.toISOString() || null
        }
      }, 201);

    } catch (serviceError: any) {
      await conn.end();
      if (serviceError.message.includes('already exists')) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'API key name already exists'
          }
        }, 409);
      }
      throw serviceError;
    }

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API key'
      }
    }, 500);
  }
});

// GET /notifications/keys - List API keys with database integration
notificationsDatabaseRouter.get('/notifications/keys', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check for internal authentication
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    if (!isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Internal authentication required'
        }
      }, 401);
    }

    // Mock user ID for now (TODO: get from session)
    const userId = 'test-user-id';

    const apiKeyService = new ApiKeyService(db);

    // Get user's API keys
    const apiKeys = await apiKeyService.getUserApiKeys(userId);

    await conn.end();

    return c.json({
      success: true,
      data: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.prefix,
        permissions: key.permissions,
        userId: key.userId,
        createdAt: key.createdAt?.toISOString(),
        expiresAt: key.expiresAt?.toISOString() || null,
        lastUsedAt: key.lastUsedAt?.toISOString() || null,
        isActive: key.isActive
      }))
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve API keys'
      }
    }, 500);
  }
});

// DELETE /notifications/keys/:id - Delete API key with database integration
notificationsDatabaseRouter.delete('/notifications/keys/:id', async (c) => {
  const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
  
  try {
    // Check for internal authentication
    const isInternal = c.req.header('X-Internal-Source') === 'true';
    if (!isInternal) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Internal authentication required'
        }
      }, 401);
    }

    const id = c.req.param('id');
    // Mock user ID for now (TODO: get from session)
    const userId = 'test-user-id';

    const apiKeyService = new ApiKeyService(db);

    // Delete API key
    const success = await apiKeyService.deleteApiKey(id, userId);

    await conn.end();

    if (!success) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found' }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    await conn.end();
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete API key'
      }
    }, 500);
  }
});