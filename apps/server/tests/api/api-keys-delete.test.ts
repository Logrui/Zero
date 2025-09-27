/**
 * Contract Test: DELETE /api/notifications/keys/[id]
 * 
 * Tests API key deletion endpoint following TDD approach.
 * These tests MUST FAIL initially until implementation is complete.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockHonoApp, MockAuthHelper } from '../helpers/test-setup';
import type { TestApiResponse } from '../helpers/test-setup';

describe('DELETE /api/notifications/keys/[id] - Contract Tests', () => {
  let testApp: MockHonoApp;

  beforeEach(() => {
    testApp = new MockHonoApp();
  });

  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should delete API key with valid ID and internal authentication', async () => {
    const apiKeyId = 'test-api-key-123';

    const response = await testApp.request(`/api/notifications/keys/${apiKeyId}`, {
      method: 'DELETE',
      headers: MockAuthHelper.getInternalHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: apiKeyId,
      deleted: true
    });
  });

  it('should return 404 for non-existent API key', async () => {
    const nonExistentId = 'non-existent-key-456';

    const response = await testApp.request(`/api/notifications/keys/${nonExistentId}`, {
      method: 'DELETE',
      headers: MockAuthHelper.getInternalHeaders()
    });

    expect(response.status).toBe(404);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });

  it('should reject API key authentication (requires internal auth)', async () => {
    const apiKeyId = 'test-api-key-789';

    const response = await testApp.request(`/api/notifications/keys/${apiKeyId}`, {
      method: 'DELETE',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid internal authentication', async () => {
    const apiKeyId = 'test-api-key-999';

    const response = await testApp.request(`/api/notifications/keys/${apiKeyId}`, {
      method: 'DELETE',
      headers: { 'X-Internal-Source': 'false', 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('should reject missing authentication', async () => {
    const apiKeyId = 'test-api-key-111';

    const response = await testApp.request(`/api/notifications/keys/${apiKeyId}`, {
      method: 'DELETE'
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});