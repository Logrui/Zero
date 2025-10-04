import type { Context } from 'hono';
import { createDb } from '../db';
import { env } from '../env';
import { ApiKeyService } from '../lib/api-auth';

/**
 * API Key Management Handlers
 * 
 * Endpoints for creating and managing API keys
 */

/**
 * Create API Key Handler
 * POST /notifications/api/keys
 */
export async function createApiKeyHandler(c: Context) {
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
    if (!body.name) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required field: name'
        }
      }, 400);
    }

    // For now, use a default test user ID
    // TODO: In production, get userId from authenticated session
    const userId = body.userId || 'test-user-123';

    // Initialize API key service
    const apiKeyService = new ApiKeyService(db);

    // Create API key
    const result = await apiKeyService.createApiKey({
      userId,
      name: body.name,
      permissions: body.permissions || ['notifications:create', 'notifications:read'],
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined
    });

    await conn.end();

    return c.json({
      success: true,
      data: {
        id: result.apiKey.id,
        key: result.key, // Only returned once!
        name: result.apiKey.name,
        keyPrefix: result.apiKey.prefix,  // Map 'prefix' column to 'keyPrefix' for frontend
        permissions: result.apiKey.permissions,
        createdAt: result.apiKey.createdAt,
        expiresAt: result.apiKey.expiresAt
      }
    }, 201);

  } catch (error: any) {
    await conn.end();
    console.error('Error creating API key:', error);
    
    // Handle duplicate key error
    if (error.message?.includes('already exists')) {
      return c.json({
        success: false,
        error: {
          code: 'DUPLICATE_KEY',
          message: error.message
        }
      }, 409);
    }
    
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API key'
      }
    }, 500);
  }
}

/**
 * List API Keys Handler
 * GET /notifications/api/keys
 */
export async function listApiKeysHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
  
  try {
    // For now, use a default test user ID
    // TODO: In production, get userId from authenticated session
    const userId = 'test-user-123';

    const apiKeyService = new ApiKeyService(db);
    const keys = await apiKeyService.getUserApiKeys(userId);

    await conn.end();

    return c.json({
      success: true,
      data: keys.map(key => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.prefix,  // Map 'prefix' column to 'keyPrefix' for frontend
        permissions: key.permissions,
        isActive: key.isActive,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        usage: { totalRequests: 0, thisMonth: 0 },  // TODO: Implement real usage tracking
        rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 }  // Default rate limits
      }))
    });

  } catch (error) {
    await conn.end();
    console.error('Error listing API keys:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list API keys'
      }
    }, 500);
  }
}

/**
 * Delete API Key Handler
 * DELETE /notifications/api/keys/:id
 */
export async function deleteApiKeyHandler(c: Context) {
  const { db, conn } = createDb(env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL);
  
  try {
    const keyId = c.req.param('id');
    
    if (!keyId) {
      await conn.end();
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing key ID'
        }
      }, 400);
    }

    // For now, use a default test user ID
    const userId = 'test-user-123';

    const apiKeyService = new ApiKeyService(db);
    const deleted = await apiKeyService.deleteApiKey(keyId, userId);

    await conn.end();

    if (!deleted) {
      return c.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API key not found'
        }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'API key deleted successfully'
    });

  } catch (error) {
    await conn.end();
    console.error('Error deleting API key:', error);
    return c.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete API key'
      }
    }, 500);
  }
}
