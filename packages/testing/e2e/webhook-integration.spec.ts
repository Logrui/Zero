/**
 * Integration Test: External Webhook Integration (T014)
 * 
 * Tests external applications sending notifications via HTTP POST API:
 * - Valid webhook requests with proper authentication
 * - Rate limiting enforcement (100 requests per minute)
 * - Invalid API key handling
 * - Malformed data validation and error responses
 * - Different content types and payload formats
 * 
 * Covers FR-001, FR-002, FR-012: External webhook integration with rate limiting
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe('External Webhook Integration', () => {
  let apiContext: APIRequestContext;
  let testApiKey: string;
  let baseURL: string;

  test.beforeAll(async ({ playwright }) => {
    // Create API context for direct HTTP calls
    apiContext = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3000'
    });
    baseURL = process.env.BASE_URL || 'http://localhost:3000';
    
    // Create a test API key for webhook testing
    // This would typically be done through the API or test setup
    testApiKey = await createTestApiKey();
  });

  test.afterAll(async () => {
    await apiContext.dispose();
    // Clean up test API key
    await deleteTestApiKey(testApiKey);
  });

  test('should accept valid webhook notifications with proper authentication', async () => {
    const notificationPayload = {
      subject: 'New potential event added to Events database',
      body: 'A new potential event has been sourced from john@example.com email from sender',
      tags: ['N8N', 'External Integration', 'Automation']
    };

    const response = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: notificationPayload
    });

    expect(response.status()).toBe(201);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(responseData.data.subject).toBe(notificationPayload.subject);
    expect(responseData.data.body).toBe(notificationPayload.body);
    expect(responseData.data.tags).toEqual(notificationPayload.tags);
    expect(responseData.data.source).toBe('api');
  });

  test('should enforce rate limiting after 100 requests per minute', async () => {
    const payloadTemplate = {
      subject: 'Rate limit test notification',
      body: 'Testing rate limiting functionality',
      tags: ['Test', 'Rate Limit']
    };

    // Send 100 requests (should all succeed)
    const successfulRequests = [];
    for (let i = 0; i < 100; i++) {
      const request = apiContext.post('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          ...payloadTemplate,
          subject: `${payloadTemplate.subject} ${i + 1}`
        }
      });
      successfulRequests.push(request);
    }

    const responses = await Promise.all(successfulRequests);
    
    // All 100 requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(201);
    });

    // Send additional requests (should be rate limited)
    const rateLimitedRequests = [];
    for (let i = 0; i < 5; i++) {
      const request = apiContext.post('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          ...payloadTemplate,
          subject: `${payloadTemplate.subject} rate limited ${i + 1}`
        }
      });
      rateLimitedRequests.push(request);
    }

    const rateLimitedResponses = await Promise.all(rateLimitedRequests);
    
    // At least some should be rate limited
    const rateLimited = rateLimitedResponses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
    
    // Check rate limit response format
    const rateLimitResponse = await rateLimited[0].json();
    expect(rateLimitResponse.success).toBe(false);
    expect(rateLimitResponse.error.code).toBe('RATE_LIMITED');
    expect(rateLimitResponse.error.message).toContain('rate limit');
  });

  test('should reject invalid API key authentication', async () => {
    const payload = {
      subject: 'Test with invalid key',
      body: 'This should fail authentication',
      tags: ['Test']
    };

    // Test with completely invalid key
    const invalidResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': 'Bearer invalid-key-123',
        'Content-Type': 'application/json'
      },
      data: payload
    });

    expect(invalidResponse.status()).toBe(401);
    const invalidData = await invalidResponse.json();
    expect(invalidData.success).toBe(false);
    expect(invalidData.error.code).toBe('UNAUTHORIZED');
    expect(invalidData.error.message).toContain('Invalid API key');

    // Test with malformed authorization header
    const malformedResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': 'InvalidFormat token123',
        'Content-Type': 'application/json'
      },
      data: payload
    });

    expect(malformedResponse.status()).toBe(401);

    // Test with missing authorization
    const missingAuthResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: payload
    });

    expect(missingAuthResponse.status()).toBe(401);
  });

  test('should validate request data and return detailed error messages', async () => {
    // Test missing required fields
    const missingFieldsResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 'Missing body and tags'
        // body and tags missing
      }
    });

    expect(missingFieldsResponse.status()).toBe(400);
    const missingFieldsData = await missingFieldsResponse.json();
    expect(missingFieldsData.success).toBe(false);
    expect(missingFieldsData.error.code).toBe('VALIDATION_ERROR');
    expect(missingFieldsData.error.message).toContain('Missing required fields');

    // Test invalid field types
    const invalidTypesResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 123, // Should be string
        body: 'Valid body',
        tags: 'invalid-tags' // Should be array
      }
    });

    expect(invalidTypesResponse.status()).toBe(400);

    // Test field length validation
    const tooLongResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 'A'.repeat(201), // Too long
        body: 'Valid body',
        tags: ['Test']
      }
    });

    expect(tooLongResponse.status()).toBe(400);
    const tooLongData = await tooLongResponse.json();
    expect(tooLongData.error.message).toContain('subject');

    // Test too many tags
    const tooManyTagsResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 'Valid subject',
        body: 'Valid body',
        tags: Array(11).fill('tag') // Maximum 10 tags
      }
    });

    expect(tooManyTagsResponse.status()).toBe(400);
  });

  test('should handle different content types and malformed JSON', async () => {
    // Test malformed JSON
    const malformedResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: '{"subject": "test", "body": "test", "tags": ["test"]' // Missing closing brace
    });

    expect(malformedResponse.status()).toBe(400);
    const malformedData = await malformedResponse.json();
    expect(malformedData.error.code).toBe('VALIDATION_ERROR');
    expect(malformedData.error.message).toContain('Invalid JSON');

    // Test missing content-type header
    const noContentTypeResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
        // No Content-Type header
      },
      data: {
        subject: 'Test without content type',
        body: 'This should fail',
        tags: ['Test']
      }
    });

    expect(noContentTypeResponse.status()).toBe(400);

    // Test wrong content type
    const wrongContentTypeResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/xml'
      },
      data: '<notification><subject>XML Test</subject></notification>'
    });

    expect(wrongContentTypeResponse.status()).toBe(400);
  });

  test('should handle concurrent webhook requests correctly', async () => {
    const concurrentRequests = [];
    
    // Send 20 concurrent requests
    for (let i = 0; i < 20; i++) {
      const request = apiContext.post('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          subject: `Concurrent notification ${i + 1}`,
          body: `Testing concurrent webhook processing ${i + 1}`,
          tags: ['Concurrent', 'Test', `Batch-${Math.floor(i / 5)}`]
        }
      });
      concurrentRequests.push(request);
    }

    const responses = await Promise.all(concurrentRequests);
    
    // All requests should succeed (within rate limit)
    responses.forEach((response, index) => {
      expect(response.status()).toBe(201);
    });

    // Verify all notifications have unique IDs
    const responseData = await Promise.all(responses.map(r => r.json()));
    const ids = responseData.map(data => data.data.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should support different webhook payload scenarios', async () => {
    // Test minimal valid payload
    const minimalResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 'Minimal',
        body: 'M',
        tags: ['Min']
      }
    });

    expect(minimalResponse.status()).toBe(201);

    // Test maximum valid payload
    const maximalResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        subject: 'A'.repeat(200), // Maximum length
        body: 'B'.repeat(5000), // Maximum length
        tags: Array(10).fill('tag').map((tag, i) => `${tag}-${i}`) // Maximum tags
      }
    });

    expect(maximalResponse.status()).toBe(201);

    // Test realistic N8N webhook payload
    const n8nResponse = await apiContext.post('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'n8n/1.0.0'
      },
      data: {
        subject: 'New lead from contact form',
        body: 'Name: John Doe, Email: john@example.com, Message: Interested in your services',
        tags: ['N8N', 'Lead', 'Contact Form', 'Sales']
      }
    });

    expect(n8nResponse.status()).toBe(201);
    const n8nData = await n8nResponse.json();
    expect(n8nData.data.tags).toContain('N8N');
  });
});

// Helper functions for test setup
async function createTestApiKey(): Promise<string> {
  // This would integrate with Zero's API key creation system
  // For now, return a mock API key that matches the expected format
  return 'zn_test_key_' + Math.random().toString(36).substring(2, 34);
}

async function deleteTestApiKey(apiKey: string): Promise<void> {
  // This would integrate with Zero's API key deletion system
  console.log(`Cleaning up test API key: ${apiKey}`);
}