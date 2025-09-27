/**
 * Contract Test: DELETE /api/notifications/[uuid]
 * 
 * Tests notification deletion endpoint following TDD approach.
 * These tests MUST FAIL initially until implementation is complete.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockHonoApp, MockAuthHelper } from '../helpers/test-setup';
import type { TestApiResponse } from '../helpers/test-setup';

describe('DELETE /api/notifications/[uuid] - Contract Tests', () => {
  let testApp: MockHonoApp;

  beforeEach(() => {
    testApp = new MockHonoApp();
  });

  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should delete notification with valid UUID', async () => {
    const notificationId = 'test-notification-uuid-123';

    const response = await testApp.request(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: notificationId,
      deleted: true
    });
  });

  it('should return 404 for non-existent notification', async () => {
    const nonExistentId = 'non-existent-uuid-456';

    const response = await testApp.request(`/api/notifications/${nonExistentId}`, {
      method: 'DELETE',
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
      method: 'DELETE',
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
      method: 'DELETE'
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});