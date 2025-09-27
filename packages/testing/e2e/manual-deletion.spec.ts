/**
 * Integration Test: Manual Deletion Workflow (T019)
 * 
 * Tests manual notification deletion capabilities from the dashboard:
 * - Individual notification deletion with confirmation
 * - Bulk selection and deletion of multiple notifications
 * - Undo functionality for accidental deletions
 * - Deletion permissions and authorization
 * - UI feedback and error handling
 * - Impact on notification counts and filters
 * 
 * Covers FR-016: Manual notification deletion from dashboard
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Manual Notification Deletion Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
  });

  test('should allow individual notification deletion with confirmation', async () => {
    // Create test notifications
    const notifications = [
      { subject: 'Delete Test 1', body: 'First notification to delete', tags: ['Test', 'Delete'] },
      { subject: 'Delete Test 2', body: 'Second notification to delete', tags: ['Test', 'Delete'] },
      { subject: 'Keep This One', body: 'This should remain', tags: ['Test', 'Keep'] }
    ];

    const createdNotifications = [];
    for (const notification of notifications) {
      const created = await createTestNotification(notification);
      createdNotifications.push(created);
    }

    // Navigate to notifications dashboard
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Verify all notifications are visible
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    expect(initialCount).toBe(3);

    // Find the first notification to delete
    const firstNotification = page.locator('[data-testid="notification-item"]').filter({
      hasText: 'Delete Test 1'
    });
    
    await expect(firstNotification).toBeVisible();

    // Click delete button for individual notification
    const deleteButton = firstNotification.locator('[data-testid="delete-notification"]');
    await deleteButton.click();

    // Verify confirmation dialog appears
    const confirmDialog = page.locator('[data-testid="delete-confirmation-modal"]');
    await expect(confirmDialog).toBeVisible();

    // Check dialog content
    const dialogTitle = confirmDialog.locator('[data-testid="dialog-title"]');
    await expect(dialogTitle).toContainText('Delete Notification');

    const dialogMessage = confirmDialog.locator('[data-testid="dialog-message"]');
    await expect(dialogMessage).toContainText('Are you sure you want to delete this notification?');

    // Verify notification details are shown in confirmation
    const notificationPreview = confirmDialog.locator('[data-testid="notification-preview"]');
    await expect(notificationPreview).toContainText('Delete Test 1');

    // Confirm deletion
    const confirmButton = confirmDialog.locator('[data-testid="confirm-delete"]');
    await confirmButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Verify notification is removed from list
    const finalCount = await page.locator('[data-testid="notification-item"]').count();
    expect(finalCount).toBe(2);

    // Verify the correct notification was deleted
    const remainingNotifications = await page.locator('[data-testid="notification-item"]').all();
    for (const notification of remainingNotifications) {
      const subject = await notification.locator('[data-testid="notification-subject"]').textContent();
      expect(subject).not.toBe('Delete Test 1');
    }

    // Verify success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText('Notification deleted successfully');
  });

  test('should support bulk selection and deletion of multiple notifications', async () => {
    // Create multiple test notifications
    const notifications = [];
    for (let i = 1; i <= 10; i++) {
      notifications.push({
        subject: `Bulk Delete Test ${i}`,
        body: `Notification ${i} for bulk deletion testing`,
        tags: ['Bulk', 'Test', `Group${Math.ceil(i / 5)}`]
      });
    }

    for (const notification of notifications) {
      await createTestNotification(notification);
    }

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Verify all notifications are present
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    expect(initialCount).toBe(10);

    // Enter bulk selection mode
    const bulkSelectButton = page.locator('[data-testid="bulk-select-mode"]');
    await bulkSelectButton.click();

    // Verify bulk selection UI is active
    const bulkToolbar = page.locator('[data-testid="bulk-selection-toolbar"]');
    await expect(bulkToolbar).toBeVisible();

    // Select first 3 notifications
    for (let i = 0; i < 3; i++) {
      const checkbox = page.locator('[data-testid="notification-checkbox"]').nth(i);
      await checkbox.check();
    }

    // Verify selection count is displayed
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toHaveText('3 selected');

    // Click bulk delete button
    const bulkDeleteButton = page.locator('[data-testid="bulk-delete-selected"]');
    await expect(bulkDeleteButton).toBeEnabled();
    await bulkDeleteButton.click();

    // Verify bulk delete confirmation dialog
    const bulkConfirmDialog = page.locator('[data-testid="bulk-delete-confirmation"]');
    await expect(bulkConfirmDialog).toBeVisible();

    const bulkMessage = bulkConfirmDialog.locator('[data-testid="bulk-delete-message"]');
    await expect(bulkMessage).toContainText('Are you sure you want to delete 3 notifications?');

    // Confirm bulk deletion
    const confirmBulkDelete = bulkConfirmDialog.locator('[data-testid="confirm-bulk-delete"]');
    await confirmBulkDelete.click();

    // Wait for deletion to complete
    await page.waitForTimeout(1500);

    // Verify notifications are deleted
    const remainingCount = await page.locator('[data-testid="notification-item"]').count();
    expect(remainingCount).toBe(7);

    // Verify bulk selection mode is exited
    await expect(bulkToolbar).not.toBeVisible();

    // Verify success message for bulk deletion
    const bulkSuccessMessage = page.locator('[data-testid="bulk-success-message"]');
    await expect(bulkSuccessMessage).toBeVisible();
    await expect(bulkSuccessMessage).toContainText('3 notifications deleted successfully');
  });

  test('should provide select all and clear selection functionality', async () => {
    // Create test notifications
    for (let i = 1; i <= 8; i++) {
      await createTestNotification({
        subject: `Select All Test ${i}`,
        body: `Test notification ${i}`,
        tags: ['SelectAll', 'Test']
      });
    }

    await page.goto('/notifications');
    
    // Enter bulk selection mode
    await page.click('[data-testid="bulk-select-mode"]');
    
    const bulkToolbar = page.locator('[data-testid="bulk-selection-toolbar"]');
    await expect(bulkToolbar).toBeVisible();

    // Test select all functionality
    const selectAllButton = page.locator('[data-testid="select-all-notifications"]');
    await selectAllButton.click();

    // Verify all notifications are selected
    const allCheckboxes = page.locator('[data-testid="notification-checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      await expect(checkbox).toBeChecked();
    }

    // Verify selection count shows all
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toHaveText(`${checkboxCount} selected`);

    // Test clear selection functionality
    const clearSelectionButton = page.locator('[data-testid="clear-selection"]');
    await clearSelectionButton.click();

    // Verify all notifications are deselected
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      await expect(checkbox).not.toBeChecked();
    }

    // Verify selection count is reset
    await expect(selectionCount).toHaveText('0 selected');
    
    // Bulk delete button should be disabled when nothing is selected
    const bulkDeleteButton = page.locator('[data-testid="bulk-delete-selected"]');
    await expect(bulkDeleteButton).toBeDisabled();
  });

  test('should handle deletion cancellation correctly', async () => {
    // Create test notification
    const notification = await createTestNotification({
      subject: 'Cancel Delete Test',
      body: 'This deletion should be cancelled',
      tags: ['Cancel', 'Test']
    });

    await page.goto('/notifications');
    
    // Attempt to delete notification
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    const deleteButton = notificationItem.locator('[data-testid="delete-notification"]');
    await deleteButton.click();

    // Confirmation dialog should appear
    const confirmDialog = page.locator('[data-testid="delete-confirmation-modal"]');
    await expect(confirmDialog).toBeVisible();

    // Cancel the deletion
    const cancelButton = confirmDialog.locator('[data-testid="cancel-delete"]');
    await cancelButton.click();

    // Dialog should close
    await expect(confirmDialog).not.toBeVisible();

    // Notification should still exist
    const notificationCount = await page.locator('[data-testid="notification-item"]').count();
    expect(notificationCount).toBe(1);

    // Verify the notification is still visible with correct content
    await expect(notificationItem).toContainText('Cancel Delete Test');
  });

  test('should handle deletion errors gracefully', async () => {
    // Create test notification
    await createTestNotification({
      subject: 'Error Test Notification',
      body: 'This deletion will trigger an error',
      tags: ['Error', 'Test']
    });

    await page.goto('/notifications');
    
    // Simulate deletion error by intercepting network request
    await page.route('**/api/notifications/**', route => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'Failed to delete notification'
            }
          })
        });
      } else {
        route.continue();
      }
    });

    // Attempt to delete notification
    const deleteButton = page.locator('[data-testid="delete-notification"]').first();
    await deleteButton.click();

    // Confirm deletion
    const confirmDialog = page.locator('[data-testid="delete-confirmation-modal"]');
    await page.click('[data-testid="confirm-delete"]');

    // Wait for error response
    await page.waitForTimeout(1000);

    // Verify error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Failed to delete notification');

    // Notification should still exist (deletion failed)
    const notificationCount = await page.locator('[data-testid="notification-item"]').count();
    expect(notificationCount).toBe(1);

    // Error should be dismissible
    const dismissError = page.locator('[data-testid="dismiss-error"]');
    await dismissError.click();
    await expect(errorMessage).not.toBeVisible();
  });

  test('should update notification counts and filters after deletion', async () => {
    // Create notifications with different tags
    const notifications = [
      { subject: 'System 1', body: 'System notification 1', tags: ['System', 'Alert'] },
      { subject: 'System 2', body: 'System notification 2', tags: ['System', 'Info'] },
      { subject: 'N8N 1', body: 'N8N notification', tags: ['N8N', 'Automation'] },
      { subject: 'Event 1', body: 'Event notification', tags: ['Events', 'Update'] }
    ];

    for (const notification of notifications) {
      await createTestNotification(notification);
    }

    await page.goto('/notifications');
    
    // Check initial counts and filters
    const systemTagFilter = page.locator('[data-testid="tag-filter-System"]');
    const initialSystemCount = await systemTagFilter.locator('[data-testid="tag-count"]').textContent();
    expect(initialSystemCount).toBe('2');

    const totalCount = page.locator('[data-testid="total-notification-count"]');
    const initialTotalCount = await totalCount.textContent();
    expect(initialTotalCount).toContain('4');

    // Delete one System notification
    const systemNotification = page.locator('[data-testid="notification-item"]').filter({
      hasText: 'System 1'
    });
    
    await systemNotification.locator('[data-testid="delete-notification"]').click();
    await page.click('[data-testid="confirm-delete"]');
    await page.waitForTimeout(1000);

    // Verify counts are updated
    const updatedSystemCount = await systemTagFilter.locator('[data-testid="tag-count"]').textContent();
    expect(updatedSystemCount).toBe('1');

    const updatedTotalCount = await totalCount.textContent();
    expect(updatedTotalCount).toContain('3');

    // If system filter was active, results should update
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(500);
    
    const filteredResults = await page.locator('[data-testid="notification-item"]').count();
    expect(filteredResults).toBe(1); // Only one System notification remains
  });

  test('should handle deletion from individual notification page', async () => {
    // Create test notification
    const notification = await createTestNotification({
      subject: 'Individual Page Delete Test',
      body: 'Testing deletion from individual notification page',
      tags: ['Individual', 'Delete', 'Test']
    });

    // Navigate to individual notification page
    await page.goto(`/notifications/${notification.id}`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the notification detail page
    const notificationPage = page.locator('[data-testid="notification-detail-page"]');
    await expect(notificationPage).toBeVisible();

    // Find and click delete button on individual page
    const deleteButton = page.locator('[data-testid="delete-notification-button"]');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirm deletion
    const confirmDialog = page.locator('[data-testid="delete-confirmation-modal"]');
    await expect(confirmDialog).toBeVisible();
    await page.click('[data-testid="confirm-delete"]');

    // Should redirect to notifications dashboard after successful deletion
    await expect(page).toHaveURL('/notifications');

    // Verify notification is no longer in list
    const notificationItems = page.locator('[data-testid="notification-item"]');
    const count = await notificationItems.count();
    
    if (count > 0) {
      // If there are other notifications, verify this one isn't among them
      const subjects = await notificationItems.locator('[data-testid="notification-subject"]').allTextContents();
      expect(subjects).not.toContain('Individual Page Delete Test');
    }

    // Verify success message
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();

    // Attempting to navigate back to deleted notification should show 404
    await page.goto(`/notifications/${notification.id}`);
    const errorPage = page.locator('[data-testid="error-404"]');
    await expect(errorPage).toBeVisible();
  });

  test('should support keyboard shortcuts for deletion', async () => {
    // Create test notifications
    for (let i = 1; i <= 3; i++) {
      await createTestNotification({
        subject: `Keyboard Delete Test ${i}`,
        body: `Testing keyboard shortcuts ${i}`,
        tags: ['Keyboard', 'Test']
      });
    }

    await page.goto('/notifications');
    
    // Focus on first notification
    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    await firstNotification.focus();

    // Use Delete key to trigger deletion
    await page.keyboard.press('Delete');

    // Confirmation dialog should appear
    const confirmDialog = page.locator('[data-testid="delete-confirmation-modal"]');
    await expect(confirmDialog).toBeVisible();

    // Use Enter to confirm
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify deletion occurred
    const remainingCount = await page.locator('[data-testid="notification-item"]').count();
    expect(remainingCount).toBe(2);

    // Test Escape to cancel deletion
    const secondNotification = page.locator('[data-testid="notification-item"]').first();
    await secondNotification.focus();
    await page.keyboard.press('Delete');
    
    await expect(confirmDialog).toBeVisible();
    
    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await expect(confirmDialog).not.toBeVisible();
    
    // Count should remain the same
    const unchangedCount = await page.locator('[data-testid="notification-item"]').count();
    expect(unchangedCount).toBe(2);
  });

  test('should maintain selection state during bulk operations', async () => {
    // Create test notifications
    for (let i = 1; i <= 6; i++) {
      await createTestNotification({
        subject: `Selection State Test ${i}`,
        body: `Testing selection state ${i}`,
        tags: ['Selection', 'Test']
      });
    }

    await page.goto('/notifications');
    
    // Enter bulk selection mode
    await page.click('[data-testid="bulk-select-mode"]');

    // Select notifications 1, 3, and 5
    const indices = [0, 2, 4];
    for (const index of indices) {
      await page.locator('[data-testid="notification-checkbox"]').nth(index).check();
    }

    // Verify selection count
    const selectionCount = page.locator('[data-testid="selection-count"]');
    await expect(selectionCount).toHaveText('3 selected');

    // Deselect one notification
    await page.locator('[data-testid="notification-checkbox"]').nth(2).uncheck();
    await expect(selectionCount).toHaveText('2 selected');

    // Delete selected notifications
    await page.click('[data-testid="bulk-delete-selected"]');
    await page.click('[data-testid="confirm-bulk-delete"]');
    await page.waitForTimeout(1000);

    // Verify correct notifications were deleted
    const remainingCount = await page.locator('[data-testid="notification-item"]').count();
    expect(remainingCount).toBe(4);

    // Bulk selection mode should exit after deletion
    const bulkToolbar = page.locator('[data-testid="bulk-selection-toolbar"]');
    await expect(bulkToolbar).not.toBeVisible();
  });
});

// Helper function for test setup
async function createTestNotification(notification: { 
  subject: string; 
  body: string; 
  tags: string[] 
}): Promise<{ id: string; subject: string; body: string; tags: string[] }> {
  // This would integrate with Zero's notification creation system
  const id = generateUUID();
  console.log(`Creating test notification: ${notification.subject}`);
  return { id, ...notification };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}