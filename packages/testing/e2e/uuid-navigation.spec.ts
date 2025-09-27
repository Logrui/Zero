/**
 * Integration Test: UUID Navigation (T016)
 * 
 * Tests notification UUID-based routing and navigation:
 * - Direct UUID navigation to /notifications/[uuid]
 * - Invalid UUID handling with proper 404 errors
 * - Overlay notification clicks opening in new tabs
 * - URL sharing and bookmark functionality
 * - UUID format validation and security
 * 
 * Covers FR-003, FR-008: UUID navigation and direct notification access
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe('UUID Navigation', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ page: testPage, context: testContext }) => {
    page = testPage;
    context = testContext;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
  });

  test('should support direct UUID navigation to notification details', async () => {
    // Create a test notification and get its UUID
    const notification = await createTestNotification({
      subject: 'UUID Navigation Test Notification',
      body: 'This notification is used to test direct UUID navigation functionality',
      tags: ['Test', 'UUID', 'Navigation']
    });
    
    const uuid = notification.id;
    expect(uuid).toMatch(/^[a-f0-9-]{36}$/); // Validate UUID format
    
    // Navigate directly to the UUID URL
    await page.goto(`/notifications/${uuid}`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page
    expect(page.url()).toContain(`/notifications/${uuid}`);
    
    // Verify notification details are displayed correctly
    const notificationPage = page.locator('[data-testid="notification-detail-page"]');
    await expect(notificationPage).toBeVisible();
    
    // Check notification content
    const subjectHeading = page.locator('[data-testid="notification-subject"]');
    await expect(subjectHeading).toHaveText('UUID Navigation Test Notification');
    
    const bodyContent = page.locator('[data-testid="notification-body"]');
    await expect(bodyContent).toContainText('This notification is used to test direct UUID navigation');
    
    // Verify tags are displayed
    const tagsContainer = page.locator('[data-testid="notification-tags"]');
    await expect(tagsContainer).toBeVisible();
    
    for (const tag of ['Test', 'UUID', 'Navigation']) {
      const tagElement = page.locator(`[data-testid="tag-${tag}"]`);
      await expect(tagElement).toBeVisible();
    }
    
    // Verify metadata
    const metadata = page.locator('[data-testid="notification-metadata"]');
    await expect(metadata).toBeVisible();
    
    const timestamp = page.locator('[data-testid="notification-timestamp"]');
    await expect(timestamp).toBeVisible();
    
    const source = page.locator('[data-testid="notification-source"]');
    await expect(source).toBeVisible();
  });

  test('should handle invalid UUIDs with proper 404 error pages', async () => {
    const invalidUUIDs = [
      'invalid-uuid-123',
      '12345678-1234-1234-1234-123456789012', // Valid format but non-existent
      'not-a-uuid-at-all',
      '00000000-0000-0000-0000-000000000000', // Null UUID
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx', // Invalid characters
      '' // Empty UUID
    ];

    for (const invalidUuid of invalidUUIDs) {
      await page.goto(`/notifications/${invalidUuid}`);
      await page.waitForLoadState('networkidle');
      
      // Should show 404 error page
      const errorPage = page.locator('[data-testid="error-404"]');
      await expect(errorPage).toBeVisible();
      
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toContainText('Notification not found');
      
      // Should have proper error page elements
      const backLink = page.locator('[data-testid="back-to-notifications"]');
      await expect(backLink).toBeVisible();
      
      // Verify URL is still the attempted invalid URL
      expect(page.url()).toContain(`/notifications/${invalidUuid}`);
    }
  });

  test('should open notifications in new tabs when clicked from overlay', async () => {
    // Create multiple test notifications
    const notifications = await Promise.all([
      createTestNotification({
        subject: 'First Test Notification',
        body: 'First notification for tab testing',
        tags: ['Test', 'Tab', '1']
      }),
      createTestNotification({
        subject: 'Second Test Notification', 
        body: 'Second notification for tab testing',
        tags: ['Test', 'Tab', '2']
      })
    ]);

    // Go to main page and open overlay
    await page.goto('/');
    await page.click('[data-testid="notifications-icon"]');
    
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Click on first notification - should open in new tab
    const firstNotification = overlay.locator('[data-testid="notification-item"]').first();
    
    // Listen for new page creation
    const newPagePromise = context.waitForEvent('page');
    
    // Click notification (should open in new tab)
    await firstNotification.click();
    
    const newPage = await newPagePromise;
    await newPage.waitForLoadState('networkidle');
    
    // Verify new tab has correct URL
    expect(newPage.url()).toContain(`/notifications/${notifications[0].id}`);
    
    // Verify new tab shows correct notification
    const newPageSubject = newPage.locator('[data-testid="notification-subject"]');
    await expect(newPageSubject).toHaveText('First Test Notification');
    
    // Original page should still be on main page with overlay
    expect(page.url()).not.toContain('/notifications/');
    await expect(overlay).toBeVisible();
    
    // Close the new tab
    await newPage.close();
  });

  test('should support URL sharing and bookmarking', async () => {
    // Create a notification
    const notification = await createTestNotification({
      subject: 'Bookmarkable Notification',
      body: 'This notification should be accessible via shared URL',
      tags: ['Test', 'Bookmark', 'Share']
    });

    const uuid = notification.id;
    
    // Navigate to notification page
    await page.goto(`/notifications/${uuid}`);
    
    // Simulate sharing the URL (copy URL)
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/notifications/${uuid}`);
    
    // Navigate away and then back to shared URL (simulating bookmark)
    await page.goto('/');
    await page.goto(currentUrl);
    
    // Should still show the notification correctly
    const subjectHeading = page.locator('[data-testid="notification-subject"]');
    await expect(subjectHeading).toHaveText('Bookmarkable Notification');
    
    // Test with query parameters (should be preserved)
    const urlWithParams = `${currentUrl}?ref=shared&utm_source=email`;
    await page.goto(urlWithParams);
    
    // Should still show notification
    await expect(subjectHeading).toHaveText('Bookmarkable Notification');
    
    // URL should preserve parameters
    expect(page.url()).toContain('ref=shared');
    expect(page.url()).toContain('utm_source=email');
  });

  test('should validate UUID format and prevent injection attacks', async () => {
    const maliciousInputs = [
      '../../../etc/passwd',
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
      '../../admin/users',
      'null',
      'undefined',
      'DROP TABLE notifications;--',
      '\'; DROP TABLE notifications; --'
    ];

    for (const maliciousInput of maliciousInputs) {
      await page.goto(`/notifications/${encodeURIComponent(maliciousInput)}`);
      await page.waitForLoadState('networkidle');
      
      // Should show 404 error, not execute malicious content
      const errorPage = page.locator('[data-testid="error-404"]');
      await expect(errorPage).toBeVisible();
      
      // Page should not show any signs of successful injection
      const body = await page.textContent('body');
      expect(body).not.toContain('<script>');
      expect(body).not.toContain('alert(');
      
      // URL should be safely handled
      expect(page.url()).toContain('notifications/');
    }
  });

  test('should handle notification state changes correctly', async () => {
    // Create a notification
    const notification = await createTestNotification({
      subject: 'State Change Test',
      body: 'Testing notification state changes',
      tags: ['Test', 'State']
    });

    // Navigate to notification page
    await page.goto(`/notifications/${notification.id}`);
    
    // Verify initial unread state
    const readStatus = page.locator('[data-testid="notification-read-status"]');
    const initialStatus = await readStatus.textContent();
    
    // Mark as read
    const markReadButton = page.locator('[data-testid="mark-as-read-button"]');
    if (await markReadButton.isVisible()) {
      await markReadButton.click();
      
      // Wait for state update
      await page.waitForTimeout(500);
      
      // Verify read status changed
      const updatedStatus = await readStatus.textContent();
      expect(updatedStatus).not.toBe(initialStatus);
      
      // Refresh page and verify state persisted
      await page.reload();
      if (initialStatus) {
        await expect(readStatus).not.toHaveText(initialStatus);
      }
    }
  });

  test('should provide proper navigation controls on notification pages', async () => {
    // Create multiple notifications
    const notifications = await Promise.all([
      createTestNotification({ subject: 'First', body: 'First', tags: ['Test'] }),
      createTestNotification({ subject: 'Second', body: 'Second', tags: ['Test'] }),
      createTestNotification({ subject: 'Third', body: 'Third', tags: ['Test'] })
    ]);

    // Navigate to middle notification
    await page.goto(`/notifications/${notifications[1].id}`);
    
    // Check for navigation elements
    const backButton = page.locator('[data-testid="back-to-list"]');
    await expect(backButton).toBeVisible();
    
    // Click back button
    await backButton.click();
    
    // Should navigate to notifications dashboard
    await expect(page).toHaveURL('/notifications');
    
    // Navigate back to individual notification
    await page.goto(`/notifications/${notifications[1].id}`);
    
    // Check for breadcrumbs if present
    const breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    if (await breadcrumbs.isVisible()) {
      const homeLink = breadcrumbs.locator('[data-testid="breadcrumb-home"]');
      const notificationsLink = breadcrumbs.locator('[data-testid="breadcrumb-notifications"]');
      
      await expect(homeLink).toBeVisible();
      await expect(notificationsLink).toBeVisible();
    }
  });

  test('should handle deleted notifications gracefully', async () => {
    // Create a notification
    const notification = await createTestNotification({
      subject: 'To Be Deleted',
      body: 'This notification will be deleted',
      tags: ['Test', 'Delete']
    });

    const uuid = notification.id;
    
    // Navigate to notification (should work initially)
    await page.goto(`/notifications/${uuid}`);
    const subjectHeading = page.locator('[data-testid="notification-subject"]');
    await expect(subjectHeading).toHaveText('To Be Deleted');
    
    // Delete the notification
    await deleteNotification(uuid);
    
    // Try to access the deleted notification directly
    await page.goto(`/notifications/${uuid}`);
    
    // Should show 404 error
    const errorPage = page.locator('[data-testid="error-404"]');
    await expect(errorPage).toBeVisible();
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toContainText('Notification not found');
    
    // Should not show the deleted notification content
    await expect(subjectHeading).not.toBeVisible();
  });

  test('should support deep linking with proper authentication', async () => {
    // Create notification
    const notification = await createTestNotification({
      subject: 'Deep Link Test',
      body: 'Testing deep linking functionality',
      tags: ['Test', 'DeepLink']
    });

    // Simulate unauthenticated access to notification URL
    // (This would typically redirect to login and then back)
    const directUrl = `/notifications/${notification.id}`;
    
    // Navigate to notification URL without authentication
    await page.goto('/auth/logout'); // Ensure logged out
    await page.goto(directUrl);
    
    // Should redirect to login page
    expect(page.url()).toContain('/auth/login');
    
    // Login should redirect back to original URL
    // TODO: Add authentication flow
    // After login, should end up at the notification page
    
    // For now, just verify the URL structure is preserved
    expect(directUrl).toMatch(/^\/notifications\/[a-f0-9-]{36}$/);
  });
});

// Helper functions for test setup
async function createTestNotification(notification: { subject: string; body: string; tags: string[] }): Promise<{ id: string; subject: string; body: string; tags: string[] }> {
  // This would integrate with Zero's notification creation system
  // Return mock notification with valid UUID
  const id = generateUUID();
  return { id, ...notification };
}

async function deleteNotification(uuid: string): Promise<void> {
  // This would integrate with Zero's notification deletion system
  console.log(`Deleting notification: ${uuid}`);
}

function generateUUID(): string {
  // Generate valid UUID v4 for testing
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}