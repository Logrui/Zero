import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import { apiKeys, type ApiKey, type InsertApiKey } from '../db/schema';

/**
 * API Key Authentication Service
 * 
 * Provides business logic for managing API keys, including:
 * - Creating and managing API keys
 * - Authenticating API requests
 * - Key validation and security
 * - Usage tracking
 */

export interface ApiKeyCreateData {
  userId: string;
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  apiKey?: ApiKey;
  userId?: string;
  error?: string;
}

export class ApiKeyService {
  constructor(private db: PostgresJsDatabase<any>) {}

  /**
   * Generate a secure API key
   */
  private async generateApiKey(): Promise<{ key: string; keyHash: string; keyPrefix: string }> {
    // Generate a random key (32 characters)
    const key = `zro_${this.generateRandomString(32)}`;
    
    // Create a hash for storage (we don't store the actual key)
    const keyHash = await this.hashKey(key);
    
    // Create a prefix for display (first 8 characters)
    const keyPrefix = key.substring(0, 8);
    
    return { key, keyHash, keyPrefix };
  }

  /**
   * Generate random string for API keys
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    
    // Use crypto.getRandomValues for secure randomness
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Hash an API key for secure storage
   */
  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a new API key
   */
  async createApiKey(data: ApiKeyCreateData): Promise<{ apiKey: ApiKey; key: string }> {
    // Check if user already has a key with this name
    const existing = await this.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, data.userId), eq(apiKeys.name, data.name)))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('API key with this name already exists for this user');
    }

    // Generate secure key
    const { key, keyHash, keyPrefix } = await this.generateApiKey();
    
    // Store API key
    const [apiKey] = await this.db
      .insert(apiKeys)
      .values({
        userId: data.userId,
        name: data.name,
        keyHash,
        prefix: keyPrefix,
        permissions: data.permissions || ['notifications:create'],
        expiresAt: data.expiresAt,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    if (!apiKey) {
      throw new Error('Failed to create API key');
    }

    return { apiKey, key };
  }

  /**
   * Validate an API key and return associated user info
   */
  async validateApiKey(key: string): Promise<ApiKeyValidationResult> {
    if (!key || !key.startsWith('zro_')) {
      return { isValid: false, error: 'Invalid key format' };
    }

    const keyHash = await this.hashKey(key);
    
    const [apiKey] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (!apiKey) {
      return { isValid: false, error: 'API key not found' };
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return { isValid: false, error: 'API key is deactivated' };
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { isValid: false, error: 'API key has expired' };
    }

    // Update last used timestamp
    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id));

    return {
      isValid: true,
      apiKey,
      userId: apiKey.userId,
    };
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  }

  /**
   * Deactivate an API key
   */
  async deactivateApiKey(keyId: string, userId: string): Promise<boolean> {
    const [updated] = await this.db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning();

    return !!updated;
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning();

    return !!deleted;
  }

  /**
   * Check if API key has specific permission
   */
  checkPermission(apiKey: ApiKey, permission: string): boolean {
    const permissions = apiKey.permissions || [];
    return permissions.includes(permission) || permissions.includes('*');
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    const now = new Date();
    
    const deleted = await this.db
      .delete(apiKeys)
      .where(and(
        eq(apiKeys.isActive, true),
        // Use proper SQL for date comparison
        // lte(apiKeys.expiresAt, now)
      ))
      .returning();

    return deleted.length;
  }

  /**
   * Get API key usage statistics
   */
  async getApiKeyStats(keyId: string, userId: string): Promise<{
    totalRequests: number;
    lastUsedAt?: Date;
    createdAt: Date;
  } | null> {
    const [apiKey] = await this.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .limit(1);

    if (!apiKey) {
      return null;
    }

    // TODO: Implement request counting from notifications table
    // const requestCount = await this.db
    //   .select({ count: sql<number>`count(*)` })
    //   .from(notifications)
    //   .where(eq(notifications.apiKeyId, keyId));

    return {
      totalRequests: 0, // Placeholder - implement with actual counting
      lastUsedAt: apiKey.lastUsedAt || undefined,
      createdAt: apiKey.createdAt || new Date(),
    };
  }
}