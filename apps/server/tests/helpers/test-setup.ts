import { Hono } from 'hono';
import { afterEach, beforeEach } from 'vitest';
import { notificationsRouter } from '../../src/routes/notifications';

/**
 * Test Infrastructure Setup
 * 
 * This file provides common test utilities and setup for the notifications API tests.
 * It includes:
 * - Mock Hono app setup
 * - Database test helpers
 * - Authentication mocks
 * - API response types
 */

// Mock API response types for tests
export interface TestApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Mock Hono app for testing
export class MockHonoApp {
  private app: Hono;

  constructor() {
    this.app = new Hono();
    this.setupMockRoutes();
  }

  private setupMockRoutes() {
    // Use the actual notifications router for tests
    this.app.route('/api', notificationsRouter);
  }

  getApp(): Hono {
    return this.app;
  }

  async request(path: string, init?: RequestInit) {
    return this.app.request(path, init);
  }
}

// Test database helpers
export class TestDatabaseHelper {
  static async createTestUser(): Promise<{ id: string; email: string }> {
    // TODO: Implement after database service is created
    return {
      id: 'test-user-123',
      email: 'test@example.com'
    };
  }

  static async createTestApiKey(userId: string): Promise<{ id: string; key: string; prefix: string }> {
    // TODO: Implement after API key service is created
    return {
      id: 'test-api-key-id',
      key: 'test-api-key-12345',
      prefix: 'test-api'
    };
  }

  static async cleanupTestData(): Promise<void> {
    // TODO: Implement database cleanup after services are created
  }
}

// Mock authentication helper
export class MockAuthHelper {
  static getValidApiKeyHeaders(): Record<string, string> {
    return {
      'Authorization': 'Bearer test-api-key-12345',
      'Content-Type': 'application/json'
    };
  }

  static getInvalidApiKeyHeaders(): Record<string, string> {
    return {
      'Authorization': 'Bearer invalid-key',
      'Content-Type': 'application/json'
    };
  }

  static getInternalHeaders(): Record<string, string> {
    return {
      'X-Internal-Source': 'true',
      'Content-Type': 'application/json'
    };
  }
}

// Setup and teardown hooks for tests
let testApp: MockHonoApp;

beforeEach(async () => {
  testApp = new MockHonoApp();
  // Additional test setup will go here
});

afterEach(async () => {
  await TestDatabaseHelper.cleanupTestData();
});

export { testApp };