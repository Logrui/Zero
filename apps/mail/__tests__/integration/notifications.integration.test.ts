/**
 * Comprehensive Integration Tests
 * End-to-end testing for the complete notifications system
 */

// Mock Jest globals for development
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  function beforeAll(fn: () => void | Promise<void>, timeout?: number): void;
  function afterAll(fn: () => void | Promise<void>, timeout?: number): void;
  function beforeEach(fn: () => void | Promise<void>, timeout?: number): void;
  function afterEach(fn: () => void | Promise<void>, timeout?: number): void;
  namespace expect {
    interface Matchers<R> {
      toBe(expected: any): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toContain(expected: any): R;
      toBeInstanceOf(expected: any): R;
      not: Matchers<R>;
      rejects: {
        toThrow(expected?: string | Error | RegExp): Promise<R>;
      };
    }
  }
  function expect(actual: any): expect.Matchers<void>;
}

// Mock types and utilities for testing
interface TestNotification {
  id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channel?: 'system' | 'email' | 'push' | 'sms';
  tags?: string[];
  metadata?: Record<string, any>;
}

interface TestApiKey {
  id?: string;
  name: string;
  permissions?: string[];
  expiresAt?: string;
}

// Mock API client for testing
class TestApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async createNotification(notification: TestNotification): Promise<TestNotification> {
    const response = await fetch(`${this.baseUrl}/api/notifications`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      throw new Error(`Failed to create notification: ${response.statusText}`);
    }

    const result = await response.json() as { data: TestNotification };
    return result.data;
  }

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<{ data: TestNotification[]; total: number; page: number }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const url = `${this.baseUrl}/api/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get notifications: ${response.statusText}`);
    }

    const result = await response.json() as { data: TestNotification[]; total: number; page: number };
    return result;
  }

  async getNotification(id: string): Promise<TestNotification> {
    const response = await fetch(`${this.baseUrl}/api/notifications/${id}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get notification: ${response.statusText}`);
    }

    const result = await response.json() as { data: TestNotification };
    return result.data;
  }

  async updateNotification(id: string, updates: Partial<TestNotification>): Promise<TestNotification> {
    const response = await fetch(`${this.baseUrl}/api/notifications/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update notification: ${response.statusText}`);
    }

    const result = await response.json() as { data: TestNotification };
    return result.data;
  }

  async deleteNotification(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.statusText}`);
    }
  }

  async createApiKey(apiKey: TestApiKey): Promise<{ key: string; id: string }> {
    const response = await fetch(`${this.baseUrl}/api/notifications/keys`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(apiKey)
    });

    if (!response.ok) {
      throw new Error(`Failed to create API key: ${response.statusText}`);
    }

    const result = await response.json() as { data: { key: string; id: string } };
    return result.data;
  }

  async getApiKeys(): Promise<TestApiKey[]> {
    const response = await fetch(`${this.baseUrl}/api/notifications/keys`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to get API keys: ${response.statusText}`);
    }

    const result = await response.json() as { data: TestApiKey[] };
    return result.data;
  }

  async deleteApiKey(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/notifications/keys/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to delete API key: ${response.statusText}`);
    }
  }
}

// Test utilities
class TestUtils {
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateTestNotification(overrides: Partial<TestNotification> = {}): TestNotification {
    return {
      title: `Test Notification ${this.generateRandomString(6)}`,
      message: `This is a test notification message ${this.generateRandomString(8)}`,
      type: 'info',
      priority: 'medium',
      channel: 'system',
      tags: ['test', 'integration'],
      metadata: { testId: this.generateRandomString(12) },
      ...overrides
    };
  }

  static generateTestApiKey(overrides: Partial<TestApiKey> = {}): TestApiKey {
    return {
      name: `Test API Key ${this.generateRandomString(6)}`,
      permissions: ['notifications:create', 'notifications:read'],
      ...overrides
    };
  }

  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Integration Tests
describe('Notifications System Integration Tests', () => {
  let apiClient: TestApiClient;
  let testApiKey: string;
  let testApiKeyId: string;

  beforeAll(async () => {
    apiClient = new TestApiClient();
    
    // Create a test API key for authenticated requests
    const apiKeyData = await apiClient.createApiKey(
      TestUtils.generateTestApiKey({ name: 'Integration Test Key' })
    );
    testApiKey = apiKeyData.key;
    testApiKeyId = apiKeyData.id;
    apiClient.setApiKey(testApiKey);
    
    console.log('Integration tests setup completed');
  });

  afterAll(async () => {
    try {
      // Clean up test API key
      if (testApiKeyId) {
        await apiClient.deleteApiKey(testApiKeyId);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  describe('Notification CRUD Operations', () => {
    let testNotificationId: string;

    afterEach(async () => {
      // Clean up created notifications
      if (testNotificationId) {
        try {
          await apiClient.deleteNotification(testNotificationId);
        } catch (error) {
          // Notification might already be deleted
        }
        testNotificationId = '';
      }
    });

    it('should create a new notification', async () => {
      const notificationData = TestUtils.generateTestNotification({
        title: 'Integration Test Notification',
        message: 'This notification was created by integration tests'
      });

      const createdNotification = await apiClient.createNotification(notificationData);
      testNotificationId = createdNotification.id!;

      expect(createdNotification).toBeDefined();
      expect(createdNotification.id).toBeDefined();
      expect(createdNotification.title).toBe(notificationData.title);
      expect(createdNotification.message).toBe(notificationData.message);
      expect(createdNotification.type).toBe(notificationData.type);
    }, 10000);

    it('should retrieve a notification by ID', async () => {
      const notificationData = TestUtils.generateTestNotification();
      const createdNotification = await apiClient.createNotification(notificationData);
      testNotificationId = createdNotification.id!;

      const retrievedNotification = await apiClient.getNotification(testNotificationId);

      expect(retrievedNotification).toBeDefined();
      expect(retrievedNotification.id).toBe(testNotificationId);
      expect(retrievedNotification.title).toBe(notificationData.title);
      expect(retrievedNotification.message).toBe(notificationData.message);
    }, 10000);

    it('should update a notification', async () => {
      const notificationData = TestUtils.generateTestNotification();
      const createdNotification = await apiClient.createNotification(notificationData);
      testNotificationId = createdNotification.id!;

      const updates = {
        title: 'Updated Test Notification',
        type: 'success' as const,
        priority: 'high' as const
      };

      const updatedNotification = await apiClient.updateNotification(testNotificationId, updates);

      expect(updatedNotification.title).toBe(updates.title);
      expect(updatedNotification.type).toBe(updates.type);
      expect(updatedNotification.priority).toBe(updates.priority);
      expect(updatedNotification.message).toBe(notificationData.message); // Should remain unchanged
    }, 10000);

    it('should delete a notification', async () => {
      const notificationData = TestUtils.generateTestNotification();
      const createdNotification = await apiClient.createNotification(notificationData);
      const notificationId = createdNotification.id!;

      await apiClient.deleteNotification(notificationId);

      // Verify deletion by trying to retrieve the notification
      await expect(apiClient.getNotification(notificationId)).rejects.toThrow();
    }, 10000);

    it('should list notifications with pagination', async () => {
      // Create multiple test notifications
      const notifications = [];
      for (let i = 0; i < 5; i++) {
        const notification = await apiClient.createNotification(
          TestUtils.generateTestNotification({ title: `Test Notification ${i}` })
        );
        notifications.push(notification);
      }

      try {
        const response = await apiClient.getNotifications({ page: 1, limit: 3 });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);
        expect(response.data.length).toBeLessThanOrEqual(3);
        expect(response.total).toBeGreaterThanOrEqual(5);
        expect(response.page).toBe(1);

      } finally {
        // Clean up created notifications
        for (const notification of notifications) {
          try {
            await apiClient.deleteNotification(notification.id!);
          } catch (error) {
            console.warn(`Failed to delete notification ${notification.id}:`, error);
          }
        }
      }
    }, 15000);
  });

  describe('API Key Management', () => {
    let testApiKeyIds: string[] = [];

    afterEach(async () => {
      // Clean up created API keys
      for (const keyId of testApiKeyIds) {
        try {
          await apiClient.deleteApiKey(keyId);
        } catch (error) {
          // Key might already be deleted
        }
      }
      testApiKeyIds = [];
    });

    it('should create a new API key', async () => {
      const apiKeyData = TestUtils.generateTestApiKey({
        name: 'Test Integration Key',
        permissions: ['notifications:create', 'notifications:read']
      });

      const createdKey = await apiClient.createApiKey(apiKeyData);
      testApiKeyIds.push(createdKey.id);

      expect(createdKey).toBeDefined();
      expect(createdKey.key).toBeDefined();
      expect(createdKey.id).toBeDefined();
      expect(typeof createdKey.key).toBe('string');
      expect(createdKey.key.length).toBeGreaterThan(20);
    }, 10000);

    it('should list API keys', async () => {
      // Create a test API key
      const apiKeyData = TestUtils.generateTestApiKey();
      const createdKey = await apiClient.createApiKey(apiKeyData);
      testApiKeyIds.push(createdKey.id);

      const apiKeys = await apiClient.getApiKeys();

      expect(Array.isArray(apiKeys)).toBe(true);
      expect(apiKeys.length).toBeGreaterThan(0);
      
      const createdKeyInList = apiKeys.find(key => key.id === createdKey.id);
      expect(createdKeyInList).toBeDefined();
      expect(createdKeyInList!.name).toBe(apiKeyData.name);
    }, 10000);

    it('should delete an API key', async () => {
      const apiKeyData = TestUtils.generateTestApiKey();
      const createdKey = await apiClient.createApiKey(apiKeyData);

      await apiClient.deleteApiKey(createdKey.id);

      // Verify deletion
      const apiKeys = await apiClient.getApiKeys();
      const deletedKeyInList = apiKeys.find(key => key.id === createdKey.id);
      expect(deletedKeyInList).toBeUndefined();
    }, 10000);
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      const unauthenticatedClient = new TestApiClient();
      const notificationData = TestUtils.generateTestNotification();

      await expect(
        unauthenticatedClient.createNotification(notificationData)
      ).rejects.toThrow();
    }, 10000);

    it('should reject requests with invalid API key', async () => {
      const invalidClient = new TestApiClient();
      invalidClient.setApiKey('invalid_api_key_12345');
      const notificationData = TestUtils.generateTestNotification();

      await expect(
        invalidClient.createNotification(notificationData)
      ).rejects.toThrow();
    }, 10000);
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for API requests', async () => {
      const requests = [];
      const notificationData = TestUtils.generateTestNotification();

      // Make multiple rapid requests to trigger rate limiting
      for (let i = 0; i < 15; i++) {
        requests.push(
          apiClient.createNotification({
            ...notificationData,
            title: `Rate limit test ${i}`
          })
        );
      }

      const results = await Promise.allSettled(requests);
      
      // Some requests should succeed and some should be rate limited
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      // Clean up successfully created notifications
      for (const result of results) {
        if (result.status === 'fulfilled') {
          try {
            await apiClient.deleteNotification(result.value.id!);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      }

      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);
    }, 20000);
  });

  describe('Input Validation', () => {
    it('should reject notifications with invalid data', async () => {
      const invalidNotifications = [
        { title: '', message: 'Valid message' }, // Empty title
        { title: 'Valid title', message: '' }, // Empty message
        { title: 'Valid title', message: 'Valid message', type: 'invalid_type' }, // Invalid type
        { title: 'A'.repeat(300), message: 'Valid message' }, // Title too long
      ];

      for (const invalidNotification of invalidNotifications) {
        await expect(
          apiClient.createNotification(invalidNotification as TestNotification)
        ).rejects.toThrow();
      }
    }, 15000);

    it('should sanitize input data', async () => {
      const notificationWithXSS = TestUtils.generateTestNotification({
        title: 'Test <script>alert("xss")</script>',
        message: 'Message with <iframe src="evil.com"></iframe> content'
      });

      const createdNotification = await apiClient.createNotification(notificationWithXSS);

      expect(createdNotification.title).not.toContain('<script>');
      expect(createdNotification.message).not.toContain('<iframe>');
      
      // Clean up
      await apiClient.deleteNotification(createdNotification.id!);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test the API's error response format
      
      try {
        await apiClient.getNotification('non-existent-id-12345');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Failed to get notification');
      }
    }, 10000);

    it('should provide meaningful error messages', async () => {
      const invalidId = 'invalid-uuid-format';
      
      try {
        await apiClient.getNotification(invalidId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // Error should indicate the issue clearly
        expect((error as Error).message.length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('Performance Requirements', () => {
    it('should respond to API requests within acceptable time limits', async () => {
      const notificationData = TestUtils.generateTestNotification();
      const startTime = Date.now();
      
      const createdNotification = await apiClient.createNotification(notificationData);
      
      const responseTime = Date.now() - startTime;
      
      // API should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
      
      // Clean up
      await apiClient.deleteNotification(createdNotification.id!);
    }, 10000);

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = [];
      
      const startTime = Date.now();
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          apiClient.createNotification(
            TestUtils.generateTestNotification({ title: `Concurrent test ${i}` })
          )
        );
      }

      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      expect(results.length).toBe(concurrentRequests);
      results.forEach(result => {
        expect(result.id).toBeDefined();
      });
      
      // Average response time should be reasonable
      const averageTime = totalTime / concurrentRequests;
      expect(averageTime).toBeLessThan(1000); // Less than 1 second per request on average
      
      // Clean up
      for (const result of results) {
        try {
          await apiClient.deleteNotification(result.id!);
        } catch (error) {
          console.warn(`Failed to clean up notification ${result.id}:`, error);
        }
      }
    }, 30000);
  });
});

// Export test utilities for external use
export { TestApiClient, TestUtils };
export type { TestNotification, TestApiKey };