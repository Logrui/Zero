import { describe, it, expect } from 'vitest';
import { testApp, MockAuthHelper, type TestApiResponse } from '../helpers/test-setup';

/**
 * Contract Test: POST /api/notifications
 * 
 * This test MUST FAIL initially (TDD approach).
 * Tests the notification creation endpoint with proper validation and authentication.
 * 
 * Test Cases:
 * 1. Create notification with valid API key
 * 2. Create notification with internal source
 * 3. Reject invalid API key
 * 4. Reject malformed request body
 * 5. Reject missing required fields
 * 6. Rate limiting enforcement
 */

describe('POST /api/notifications - Contract Tests', () => {
  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should create notification with valid API key', async () => {
    const payload = {
      subject: 'Test Notification',
      body: 'This is a test notification from API',
      tags: ['test', 'api']
    };

    const response = await testApp.request('/api/notifications', {
      method: 'POST',
      headers: MockAuthHelper.getValidApiKeyHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      subject: payload.subject,
      body: payload.body,
      tags: payload.tags,
      source: 'api',
      readStatus: false
    });
    expect(result.data.id).toBeDefined();
    expect(result.data.createdAt).toBeDefined();
  });

  it('should create notification with internal source', async () => {
    const payload = {
      subject: 'Internal Notification',
      body: 'This is an internal notification',
      tags: ['internal', 'system'],
      userId: 'user-123'
    };

    const response = await testApp.request('/api/notifications', {
      method: 'POST',
      headers: MockAuthHelper.getInternalHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(201);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      subject: payload.subject,
      body: payload.body,
      tags: payload.tags,
      source: 'internal',
      userId: 'user-123'
    });
  });

  it('should reject invalid API key', async () => {
    const payload = {
      subject: 'Test Notification',
      body: 'This should fail',
      tags: ['test']
    };

    const response = await testApp.request('/api/notifications', {
      method: 'POST',
      headers: MockAuthHelper.getInvalidApiKeyHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject malformed request body', async () => {
    const response = await testApp.request('/api/notifications', {
      method: 'POST',
      headers: MockAuthHelper.getValidApiKeyHeaders(),
      body: 'invalid json'
    });

    expect(response.status).toBe(400);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject missing required fields', async () => {
    const payload = {
      subject: 'Test',
      // Missing body and tags
    };

    const response = await testApp.request('/api/notifications', {
      method: 'POST',
      headers: MockAuthHelper.getValidApiKeyHeaders(),
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(400);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('body');
    expect(result.error.message).toContain('tags');
  });

  it('should enforce rate limiting', async () => {
    const payload = {
      subject: 'Rate limit test',
      body: 'Testing rate limits',
      tags: ['rate-limit']
    };

    // Make multiple rapid requests to trigger rate limit
    const requests = Array(11).fill(null).map(() =>
      testApp.request('/api/notifications', {
        method: 'POST',
        headers: MockAuthHelper.getValidApiKeyHeaders(),
        body: JSON.stringify(payload)
      })
    );

    const responses = await Promise.all(requests);
    
    // At least one should be rate limited (429)
    const rateLimitedResponse = responses.find(r => r.status === 429);
    expect(rateLimitedResponse).toBeDefined();
    
    if (rateLimitedResponse) {
      const result = await rateLimitedResponse.json() as TestApiResponse;
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMITED');
    }
  });
});