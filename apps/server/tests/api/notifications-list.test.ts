import { describe, it, expect } from 'vitest';
import { testApp, MockAuthHelper, type TestApiResponse } from '../helpers/test-setup';

/**
 * Contract Test: GET /api/notifications
 * 
 * This test MUST FAIL initially (TDD approach).
 * Tests the notification list endpoint with filtering and pagination.
 * 
 * Test Cases:
 * 1. List notifications with valid authentication
 * 2. Filter by tags
 * 3. Filter by read status  
 * 4. Pagination support
 * 5. Reject unauthorized access
 */

describe('GET /api/notifications - Contract Tests', () => {
  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should list notifications with valid authentication', async () => {
    const response = await testApp.request('/api/notifications', {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter notifications by tags', async () => {
    const response = await testApp.request('/api/notifications?tags=urgent,system', {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter notifications by read status', async () => {
    const response = await testApp.request('/api/notifications?readStatus=false', {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should support pagination', async () => {
    const response = await testApp.request('/api/notifications?limit=10&offset=0', {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should reject unauthorized access', async () => {
    const response = await testApp.request('/api/notifications', {
      method: 'GET',
      headers: MockAuthHelper.getInvalidApiKeyHeaders()
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});