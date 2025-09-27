/**
 * Integration Test: API Key Management Workflow (T013)
 * 
 * Tests the complete API key management flow from the Zero Mail frontend:
 * - Navigate to notifications dashboard
 * - Generate new API key with name
 * - Verify API key display and masking
 * - Delete API key and verify removal
 * - Test API key functionality with actual API calls
 * 
 * Covers FR-011: API key generation and management within notifications dashboard
 */

import { test, expect, type Page } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

test.describe('API Key Management Workflow', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ page: testPage, context: testContext }) => {
    page = testPage;
    context = testContext;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
    // This would typically involve logging in with test credentials
  });

  test('should create and manage API keys from notifications dashboard', async () => {
    // Navigate to notifications dashboard
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the notifications page
    await expect(page).toHaveURL('/notifications');
    
    // Navigate to API Keys section
    const apiKeysTab = page.locator('[data-testid="api-keys-tab"]');
    if (await apiKeysTab.isVisible()) {
      await apiKeysTab.click();
    }
    
    // Generate new API key
    await page.click('[data-testid="generate-api-key"]');
    await page.waitForSelector('[data-testid="api-key-form"]');
    
    // Fill in API key details
    await page.fill('[data-testid="key-name-input"]', 'Test Integration Key');
    
    // Set permissions if available
    const permissionsSection = page.locator('[data-testid="key-permissions"]');
    if (await permissionsSection.isVisible()) {
      await page.check('[data-testid="permission-notifications-create"]');
      await page.check('[data-testid="permission-notifications-read"]');
    }
    
    // Create the key
    await page.click('[data-testid="create-key-submit"]');
    
    // Verify API key is displayed (full key shown only once)
    await page.waitForSelector('[data-testid="api-key-value"]');
    const keyElement = page.locator('[data-testid="api-key-value"]');
    const fullKey = await keyElement.textContent();
    
    // Verify key format (should start with zn_ and be at least 32 chars)
    expect(fullKey).toMatch(/^zn_[a-zA-Z0-9]{32,}$/);
    
    // Copy the key for later use
    await page.click('[data-testid="copy-api-key"]');
    
    // Close the key display modal
    await page.click('[data-testid="key-modal-close"]');
    
    // Verify key appears in the API keys list (masked format)
    const keyList = page.locator('[data-testid="api-key-list"]');
    await expect(keyList).toBeVisible();
    
    const keyListItem = keyList.locator('[data-testid="api-key-item"]').first();
    await expect(keyListItem).toBeVisible();
    
    // Verify the key is masked in the list
    const maskedKey = keyListItem.locator('[data-testid="api-key-display"]');
    const maskedKeyText = await maskedKey.textContent();
    expect(maskedKeyText).toMatch(/^zn_[a-zA-Z0-9]{8}\.\.\./);
    
    // Verify key metadata
    const keyName = keyListItem.locator('[data-testid="api-key-name"]');
    await expect(keyName).toHaveText('Test Integration Key');
    
    const keyCreatedAt = keyListItem.locator('[data-testid="api-key-created"]');
    await expect(keyCreatedAt).toBeVisible();
  });

  test('should delete API key and verify removal', async () => {
    // First create a key to delete
    await page.goto('/notifications');
    
    // Create test API key
    await page.click('[data-testid="generate-api-key"]');
    await page.fill('[data-testid="key-name-input"]', 'Key To Delete');
    await page.click('[data-testid="create-key-submit"]');
    await page.click('[data-testid="key-modal-close"]');
    
    // Verify key exists in list
    const keyList = page.locator('[data-testid="api-key-list"]');
    const initialCount = await keyList.locator('[data-testid="api-key-item"]').count();
    expect(initialCount).toBeGreaterThan(0);
    
    // Delete the key
    const deleteButton = page.locator('[data-testid="delete-key-button"]').first();
    await deleteButton.click();
    
    // Confirm deletion in modal
    await page.waitForSelector('[data-testid="confirm-delete-modal"]');
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify key is removed from list
    await page.waitForTimeout(1000); // Wait for deletion to complete
    const finalCount = await keyList.locator('[data-testid="api-key-item"]').count();
    expect(finalCount).toBe(initialCount - 1);
  });

  test('should validate API key functionality with actual API calls', async () => {
    // Create API key for testing
    await page.goto('/notifications');
    await page.click('[data-testid="generate-api-key"]');
    await page.fill('[data-testid="key-name-input"]', 'Functional Test Key');
    await page.click('[data-testid="create-key-submit"]');
    
    // Get the API key value
    const keyElement = page.locator('[data-testid="api-key-value"]');
    const apiKey = await keyElement.textContent();
    
    await page.click('[data-testid="key-modal-close"]');
    
    // Test API key with actual notification creation
    const response = await page.evaluate(async (key) => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: 'Test API Key Notification',
          body: 'This notification was created to test API key functionality',
          tags: ['Test', 'Integration', 'API Key']
        })
      });
      
      return {
        status: res.status,
        data: await res.json()
      };
    }, apiKey);
    
    // Verify API call succeeded
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toMatch(/^[a-f0-9-]{36}$/);
    
    // Clean up: delete the test key
    await page.locator('[data-testid="delete-key-button"]').first().click();
    await page.click('[data-testid="confirm-delete"]');
  });

  test('should handle API key creation errors gracefully', async () => {
    await page.goto('/notifications');
    
    // Try to create key with empty name
    await page.click('[data-testid="generate-api-key"]');
    await page.click('[data-testid="create-key-submit"]');
    
    // Verify validation error
    const errorMessage = page.locator('[data-testid="form-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Key name is required');
    
    // Try with name that's too long
    await page.fill('[data-testid="key-name-input"]', 'A'.repeat(101));
    await page.click('[data-testid="create-key-submit"]');
    
    await expect(errorMessage).toContainText('Key name must be 100 characters or less');
    
    // Cancel form
    await page.click('[data-testid="cancel-key-creation"]');
    await expect(page.locator('[data-testid="api-key-form"]')).not.toBeVisible();
  });

  test('should display API key usage statistics', async () => {
    // Create API key
    await page.goto('/notifications');
    await page.click('[data-testid="generate-api-key"]');
    await page.fill('[data-testid="key-name-input"]', 'Usage Stats Test');
    await page.click('[data-testid="create-key-submit"]');
    
    const apiKey = await page.locator('[data-testid="api-key-value"]').textContent();
    await page.click('[data-testid="key-modal-close"]');
    
    // Make some API calls to generate usage
    await page.evaluate(async (key) => {
      for (let i = 0; i < 3; i++) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subject: `Usage test ${i + 1}`,
            body: 'Testing API key usage tracking',
            tags: ['Usage', 'Test']
          })
        });
      }
    }, apiKey);
    
    // Refresh to see updated stats
    await page.reload();
    
    // Verify usage statistics are displayed
    const keyItem = page.locator('[data-testid="api-key-item"]').first();
    const lastUsed = keyItem.locator('[data-testid="api-key-last-used"]');
    
    await expect(lastUsed).toBeVisible();
    await expect(lastUsed).not.toHaveText('Never');
    
    // Clean up
    await page.locator('[data-testid="delete-key-button"]').first().click();
    await page.click('[data-testid="confirm-delete"]');
  });
});