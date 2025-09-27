/**
 * Contract Test: GET /api/notifications/keys
 * 
 * Tests API key listing endpoint following TDD approach.
 * These tests MUST FAIL initially until implementation is complete.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockHonoApp, MockAuthHelper } from '../helpers/test-setup';
import type { TestApiResponse } from '../helpers/test-setup';

describe('GET /api/notifications/keys - Contract Tests', () => {
  let testApp: MockHonoApp;

  beforeEach(() => {
    testApp = new MockHonoApp();
  });

  // Note: These tests WILL FAIL initially - this is intentional for TDD approach

  it('should list API keys with internal authentication', async () => {
    const response = await testApp.request('/api/notifications/keys', {
      method: 'GET',
      headers: MockAuthHelper.getInternalHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    
    // Verify API key structure (without exposing actual key values)
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const firstKey = result.data[0];
      expect(firstKey).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        keyPreview: expect.any(String), // Should be masked like "nk_test_****"
        createdAt: expect.any(String),
        lastUsed: expect.any(String)
      });
      expect(firstKey).not.toHaveProperty('keyHash'); // Should not expose hash
      expect(firstKey).not.toHaveProperty('key'); // Should not expose actual key
    }
  });

  it('should return empty array when no keys exist', async () => {
    const response = await testApp.request('/api/notifications/keys', {
      method: 'GET',
      headers: MockAuthHelper.getInternalHeaders()
    });

    expect(response.status).toBe(200);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(0);
  });

  it('should reject API key authentication (requires internal auth)', async () => {
    const response = await testApp.request('/api/notifications/keys', {
      method: 'GET',
      headers: MockAuthHelper.getValidApiKeyHeaders()
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid internal authentication', async () => {
    const response = await testApp.request('/api/notifications/keys', {
      method: 'GET',
      headers: { 'X-Internal-Source': 'false', 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });

  it('should reject missing authentication', async () => {
    const response = await testApp.request('/api/notifications/keys', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status).toBe(401);
    
    const result = await response.json() as TestApiResponse;
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNAUTHORIZED');
  });
});