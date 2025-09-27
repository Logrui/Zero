import { describe, it, expect } from 'vitest';
import { testApp, MockAuthHelper, type TestApiResponse } from '../helpers/test-setup';

/**
 * Contract Test: POST /api/notifications/keys
 * 
 * This test MUST FAIL initially (TDD approach).
 * Tests the API key creation endpoint.
 * 
 * Test Cases:
 * 1. Create API key with valid request
 * 2. Create API key with expiration
 * 3. Create API key with custom permissions
 * 4. Reject duplicate key names for same user
 * 5. Reject unauthorized access
 */

describe('POST /api/notifications/keys - Contract Tests', () => {
  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should create API key with valid request', async () => {
    const payload = {
      name: 'My Test Key',
      permissions: ['notifications:create']
    };

    const response = await testApp.request('/api/notifications/keys', {
      method: 'POST',
      headers: MockAuthHelper.getInternalHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: payload.name,
      permissions: payload.permissions
    });
    expect(result.data.key).toBeDefined(); // Full key only returned on creation
    expect(result.data.keyPrefix).toBeDefined();
  });

  it('should create API key with expiration', async () => {
    const payload = {
      name: 'Expiring Key',
      permissions: ['notifications:create'],
      expiresAt: '2025-01-01T00:00:00.000Z'
    };

    const response = await testApp.request('/api/notifications/keys', {
      method: 'POST',
      headers: MockAuthHelper.getInternalHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: payload.name,
      expiresAt: payload.expiresAt  // JSON serialized, so it should be a string
    });
  });

  it('should reject duplicate key names for same user', async () => {
    const payload = {
      name: 'Duplicate Key Name',
      permissions: ['notifications:create']
    };

    // First request should succeed
    await testApp.request('/api/notifications/keys', {
      method: 'POST',
      headers: MockAuthHelper.getInternalHeaders(),
      body: JSON.stringify(payload)
    });

    // Second request with same name should fail
    const response = await testApp.request('/api/notifications/keys', {
      method: 'POST',
      headers: MockAuthHelper.getInternalHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(409);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should reject unauthorized access', async () => {
    const payload = {
      name: 'Test Key',
      permissions: ['notifications:create']
    };

    const response = await testApp.request('/api/notifications/keys', {
      method: 'POST',
      headers: MockAuthHelper.getInvalidApiKeyHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});