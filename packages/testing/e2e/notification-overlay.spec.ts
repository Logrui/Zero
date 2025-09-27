/**
 * Integration Test: Notification Overlay Display (T015)
 * 
 * Tests the notification overlay behavior in Zero Mail's bottom bar:
 * - Overlay display with proper notification limits (10 visible, 50 total)
 * - Subject expansion for long notification titles
 * - "View All" navigation to full dashboard
 * - Scroll behavior and virtual scrolling
 * - Read/unread status handling
 * - Real-time notification updates
 * 
 * Covers FR-006, FR-007, FR-014: Notification overlay display and interaction
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Notification Overlay Display', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
    
    // Navigate to main application
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display notifications with proper limits and expansion', async () => {
    // Create test notifications (more than 50 to test limits)
    await createTestNotifications(60);
    
    // Open notification overlay
    const notificationIcon = page.locator('[data-testid="notifications-icon"]');
    await expect(notificationIcon).toBeVisible();
    await notificationIcon.click();
    
    // Wait for overlay to appear
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Check initial display - should show 10 notifications initially in viewport
    const visibleNotifications = overlay.locator('[data-testid="notification-item"]:visible');
    const visibleCount = await visibleNotifications.count();
    expect(visibleCount).toBeLessThanOrEqual(10);
    
    // Check total notifications in overlay - should be max 50
    const totalNotifications = overlay.locator('[data-testid="notification-item"]');
    const totalCount = await totalNotifications.count();
    expect(totalCount).toBeLessThanOrEqual(50);
    expect(totalCount).toBeGreaterThan(0);
    
    // Verify overlay structure
    const overlayHeader = overlay.locator('[data-testid="overlay-header"]');
    await expect(overlayHeader).toBeVisible();
    
    const viewAllButton = overlay.locator('[data-testid="view-all-notifications"]');
    await expect(viewAllButton).toBeVisible();
    
    // Test scrolling to see more notifications
    const scrollContainer = overlay.locator('[data-testid="notifications-scroll-container"]');
    
    // Scroll down in overlay
    await scrollContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(500);
    
    // Check that more notifications became visible
    const visibleAfterScroll = await overlay.locator('[data-testid="notification-item"]:visible').count();
    expect(visibleAfterScroll).toBeGreaterThan(visibleCount);
  });

  test('should expand long notification subjects correctly', async () => {
    // Create notifications with varying subject lengths
    const notifications = [
      {
        subject: 'Short subject',
        body: 'Normal notification body',
        tags: ['Test']
      },
      {
        subject: 'This is a very long notification subject that should be truncated initially and require expansion to view the full text content',
        body: 'Notification with long subject',
        tags: ['Test', 'Long Subject']
      },
      {
        subject: 'Medium length subject that might need expansion',
        body: 'Another test notification',
        tags: ['Test', 'Medium']
      }
    ];
    
    for (const notification of notifications) {
      await createSingleNotification(notification);
    }
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Find notification with long subject
    const longSubjectNotification = overlay.locator('[data-testid="notification-item"]').filter({
      hasText: 'This is a very long notification subject'
    });
    
    await expect(longSubjectNotification).toBeVisible();
    
    // Check if subject is initially truncated
    const subjectElement = longSubjectNotification.locator('[data-testid="notification-subject"]');
    const initialText = await subjectElement.textContent();
    
    // Click to expand subject
    await subjectElement.click();
    
    // Verify expansion
    await page.waitForTimeout(300); // Wait for animation
    const expandedClasses = await subjectElement.getAttribute('class');
    expect(expandedClasses).toContain('expanded');
    
    // Verify full text is now visible
    const expandedText = await subjectElement.textContent();
    expect(expandedText).toContain('truncated initially and require expansion');
    
    // Click again to collapse
    await subjectElement.click();
    await page.waitForTimeout(300);
    
    const collapsedClasses = await subjectElement.getAttribute('class');
    expect(collapsedClasses).not.toContain('expanded');
  });

  test('should navigate to dashboard when "View All" is clicked', async () => {
    // Create some notifications
    await createTestNotifications(15);
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Click "View All" button
    const viewAllButton = overlay.locator('[data-testid="view-all-notifications"]');
    await expect(viewAllButton).toBeVisible();
    await viewAllButton.click();
    
    // Verify navigation to notifications dashboard
    await expect(page).toHaveURL('/notifications');
    
    // Verify overlay is closed
    await expect(overlay).not.toBeVisible();
    
    // Verify dashboard content is loaded
    const dashboard = page.locator('[data-testid="notifications-dashboard"]');
    await expect(dashboard).toBeVisible();
  });

  test('should handle read/unread status correctly in overlay', async () => {
    // Create notifications
    await createTestNotifications(10);
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Find first notification
    const firstNotification = overlay.locator('[data-testid="notification-item"]').first();
    await expect(firstNotification).toBeVisible();
    
    // Check initial unread state
    const unreadIndicator = firstNotification.locator('[data-testid="unread-indicator"]');
    await expect(unreadIndicator).toBeVisible();
    
    // Mark notification as read by clicking
    const markReadButton = firstNotification.locator('[data-testid="mark-as-read"]');
    if (await markReadButton.isVisible()) {
      await markReadButton.click();
    } else {
      // Alternative: click the notification itself to mark as read
      await firstNotification.click();
    }
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify unread indicator is gone
    await expect(unreadIndicator).not.toBeVisible();
    
    // Verify notification appears read
    const readClasses = await firstNotification.getAttribute('class');
    expect(readClasses).toContain('read');
  });

  test('should show correct notification metadata in overlay', async () => {
    const testNotification = {
      subject: 'Test Notification with Metadata',
      body: 'This notification should display proper metadata',
      tags: ['Test', 'Metadata', 'Overlay']
    };
    
    await createSingleNotification(testNotification);
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    
    // Find the test notification
    const notification = overlay.locator('[data-testid="notification-item"]').first();
    
    // Verify subject
    const subject = notification.locator('[data-testid="notification-subject"]');
    await expect(subject).toHaveText(testNotification.subject);
    
    // Verify body preview (might be truncated)
    const bodyPreview = notification.locator('[data-testid="notification-body-preview"]');
    await expect(bodyPreview).toBeVisible();
    const bodyText = await bodyPreview.textContent();
    expect(bodyText).toContain('This notification should');
    
    // Verify tags
    const tags = notification.locator('[data-testid="notification-tags"]');
    await expect(tags).toBeVisible();
    
    for (const tag of testNotification.tags) {
      const tagElement = notification.locator(`[data-testid="tag-${tag}"]`);
      await expect(tagElement).toBeVisible();
    }
    
    // Verify timestamp
    const timestamp = notification.locator('[data-testid="notification-timestamp"]');
    await expect(timestamp).toBeVisible();
    
    // Verify source indicator (should show API or Internal)
    const sourceIndicator = notification.locator('[data-testid="notification-source"]');
    await expect(sourceIndicator).toBeVisible();
  });

  test('should handle overlay interactions correctly', async () => {
    await createTestNotifications(5);
    
    // Test opening overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Test closing overlay by clicking outside
    await page.click('body', { position: { x: 100, y: 100 } });
    await expect(overlay).not.toBeVisible();
    
    // Test opening again
    await page.click('[data-testid="notifications-icon"]');
    await expect(overlay).toBeVisible();
    
    // Test closing with escape key
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
    
    // Test opening again and closing with close button
    await page.click('[data-testid="notifications-icon"]');
    await expect(overlay).toBeVisible();
    
    const closeButton = overlay.locator('[data-testid="close-overlay"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(overlay).not.toBeVisible();
    }
  });

  test('should show notification count badge correctly', async () => {
    // Start with no notifications
    const notificationIcon = page.locator('[data-testid="notifications-icon"]');
    const countBadge = notificationIcon.locator('[data-testid="notification-count-badge"]');
    
    // Should not show badge when no unread notifications
    await expect(countBadge).not.toBeVisible();
    
    // Create some notifications
    await createTestNotifications(7);
    
    // Reload to see updated badge
    await page.reload();
    
    // Should show count badge
    await expect(countBadge).toBeVisible();
    await expect(countBadge).toHaveText('7');
    
    // Create more notifications (test 99+ display)
    await createTestNotifications(95);
    await page.reload();
    
    // Should show 99+ for large counts
    await expect(countBadge).toHaveText('99+');
  });

  test('should handle empty state correctly', async () => {
    // Ensure no notifications exist
    await clearAllNotifications();
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    await expect(overlay).toBeVisible();
    
    // Check empty state
    const emptyState = overlay.locator('[data-testid="empty-notifications"]');
    await expect(emptyState).toBeVisible();
    
    const emptyMessage = overlay.locator('[data-testid="empty-message"]');
    await expect(emptyMessage).toContainText('No notifications');
    
    // View All button should still be present but might be disabled
    const viewAllButton = overlay.locator('[data-testid="view-all-notifications"]');
    await expect(viewAllButton).toBeVisible();
  });

  test('should support keyboard navigation in overlay', async () => {
    await createTestNotifications(10);
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    const overlay = page.locator('[data-testid="notification-overlay"]');
    
    // Focus should be on the overlay
    await expect(overlay).toBeFocused();
    
    // Tab through notifications
    await page.keyboard.press('Tab');
    const firstNotification = overlay.locator('[data-testid="notification-item"]').first();
    await expect(firstNotification).toBeFocused();
    
    // Enter should open notification details or mark as read
    await page.keyboard.press('Enter');
    
    // Arrow keys should navigate between notifications
    await page.keyboard.press('ArrowDown');
    const secondNotification = overlay.locator('[data-testid="notification-item"]').nth(1);
    await expect(secondNotification).toBeFocused();
    
    await page.keyboard.press('ArrowUp');
    await expect(firstNotification).toBeFocused();
  });
});

// Helper functions for test setup
async function createTestNotifications(count: number): Promise<void> {
  // This would integrate with Zero's notification creation system
  // For testing purposes, we'll simulate notification creation
  for (let i = 0; i < count; i++) {
    await createSingleNotification({
      subject: `Test Notification ${i + 1}`,
      body: `This is test notification number ${i + 1} for overlay testing`,
      tags: ['Test', 'Overlay', `Batch-${Math.floor(i / 10)}`]
    });
  }
}

async function createSingleNotification(notification: { subject: string; body: string; tags: string[] }): Promise<void> {
  // This would create a single notification through the API
  console.log('Creating notification:', notification.subject);
}

async function clearAllNotifications(): Promise<void> {
  // This would remove all notifications for the test user
  console.log('Clearing all notifications');
}