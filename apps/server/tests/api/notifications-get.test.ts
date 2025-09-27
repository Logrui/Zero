/**
 * Contract Test: GET /api/notifications/[uuid]
 * 
 * Tests individual notification retrieval endpoint following TDD approach.
 * These tests MUST FAIL initially until implementation is complete.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockHonoApp, MockAuthHelper } from '../helpers/test-setup';
import type { TestApiResponse } from '../helpers/test-setup';

describe('GET /api/notifications/[uuid] - Contract Tests', () => {
  let testApp: MockHonoApp;

  beforeEach(() => {
    testApp = new MockHonoApp();
  });

  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should get notification by UUID with valid authentication', async () => {
    const notificationId = 'test-notification-uuid-123';

    const response = await testApp.request(`/api/notifications/${notificationId}`, {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: notificationId,
      subject: expect.any(String),
      body: expect.any(String),
      tags: expect.any(Array),
      readStatus: expect.any(Boolean),
      createdAt: expect.any(String)
    });
  });

  it('should return 404 for non-existent notification', async () => {
    const nonExistentId = 'non-existent-uuid-456';

    const response = await testApp.request(`/api/notifications/${nonExistentId}`, {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(404);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('should reject unauthorized access', async () => {
    const notificationId = 'test-notification-uuid-789';

    const response = await testApp.request(`/api/notifications/${notificationId}`, {
      method: 'GET',
      headers: MockAuthHelper.getInvalidApiKeyHeaders()
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('should reject missing authentication', async () => {
    const notificationId = 'test-notification-uuid-999';

    const response = await testApp.request(`/api/notifications/${notificationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});