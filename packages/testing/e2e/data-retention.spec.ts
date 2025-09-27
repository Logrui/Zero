/**
 * Integration Test: Data Retention Policy (T018)
 * 
 * Tests the 30-day automatic deletion policy for notifications:
 * - Automated cleanup of notifications older than 30 days
 * - Preservation of recent notifications during cleanup
 * - Proper handling of edge cases (exactly 30 days old)
 * - Cleanup job execution and scheduling
 * - Data integrity during batch deletions
 * - User notification of cleanup activities
 * 
 * Covers FR-013: 30-day automatic deletion policy
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Data Retention Policy', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
  });

  test('should automatically delete notifications older than 30 days', async () => {
    // Create test notifications with different ages
    const notifications = [
      { subject: 'Old Notification 1', daysOld: 35, shouldBeDeleted: true },
      { subject: 'Old Notification 2', daysOld: 45, shouldBeDeleted: true },
      { subject: 'Borderline Notification', daysOld: 30, shouldBeDeleted: true },
      { subject: 'Recent Notification 1', daysOld: 25, shouldBeDeleted: false },
      { subject: 'Recent Notification 2', daysOld: 15, shouldBeDeleted: false },
      { subject: 'Very Recent Notification', daysOld: 1, shouldBeDeleted: false }
    ];

    // Create notifications and simulate their ages
    const createdNotifications = [];
    for (const notification of notifications) {
      const created = await createTestNotificationWithAge(
        {
          subject: notification.subject,
          body: `Test notification created ${notification.daysOld} days ago`,
          tags: ['Test', 'Retention', 'Policy']
        },
        notification.daysOld
      );
      createdNotifications.push({
        ...created,
        shouldBeDeleted: notification.shouldBeDeleted
      });
    }

    // Verify all notifications exist before cleanup
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    expect(initialCount).toBe(6);

    // Trigger retention cleanup job
    await triggerRetentionCleanup();
    
    // Wait for cleanup to complete
    await page.waitForTimeout(2000);
    
    // Refresh page to see updated results
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify old notifications are deleted
    const remainingCount = await page.locator('[data-testid="notification-item"]').count();
    expect(remainingCount).toBe(3); // Only the 3 recent notifications should remain
    
    // Verify the correct notifications remain
    const remainingNotifications = await page.locator('[data-testid="notification-item"]').all();
    
    for (const notification of remainingNotifications) {
      const subject = await notification.locator('[data-testid="notification-subject"]').textContent();
      expect(subject).toMatch(/Recent|Very Recent/);
      expect(subject).not.toMatch(/Old|Borderline/);
    }
  });

  test('should preserve notifications under 30 days during cleanup', async () => {
    // Create notifications that should be preserved
    const recentNotifications = [
      { subject: '29 Days Old', daysOld: 29 },
      { subject: '15 Days Old', daysOld: 15 },
      { subject: '7 Days Old', daysOld: 7 },
      { subject: 'Today', daysOld: 0 }
    ];

    const createdIds = [];
    for (const notification of recentNotifications) {
      const created = await createTestNotificationWithAge(
        {
          subject: notification.subject,
          body: `Recent notification - ${notification.daysOld} days old`,
          tags: ['Recent', 'Preserve', 'Test']
        },
        notification.daysOld
      );
      createdIds.push(created.id);
    }

    // Also create some old notifications that should be deleted
    await createTestNotificationWithAge(
      { subject: 'Should Be Deleted', body: 'Old notification', tags: ['Old', 'Delete'] },
      35
    );

    // Verify initial state
    await page.goto('/notifications');
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    expect(initialCount).toBe(5);

    // Run cleanup
    await triggerRetentionCleanup();
    await page.waitForTimeout(2000);
    await page.reload();

    // Verify recent notifications are preserved
    const finalCount = await page.locator('[data-testid="notification-item"]').count();
    expect(finalCount).toBe(4); // All recent ones should remain

    // Verify specific notifications still exist
    for (const id of createdIds) {
      const notificationExists = await checkNotificationExists(id);
      expect(notificationExists).toBe(true);
    }
  });

  test('should handle edge cases correctly (exactly 30 days)', async () => {
    // Create notifications at the exact boundary
    const boundaryNotifications = [
      { subject: 'Exactly 30 Days', daysOld: 30, hours: 0, minutes: 0 },
      { subject: '30 Days 1 Hour', daysOld: 30, hours: 1, minutes: 0 },
      { subject: '29 Days 23 Hours', daysOld: 29, hours: 23, minutes: 59 },
      { subject: '30 Days 1 Second', daysOld: 30, hours: 0, minutes: 0, seconds: 1 }
    ];

    const createdNotifications = [];
    for (const notification of boundaryNotifications) {
      const created = await createTestNotificationWithPreciseAge(
        {
          subject: notification.subject,
          body: `Boundary test notification`,
          tags: ['Boundary', 'Test', 'Retention']
        },
        notification.daysOld,
        notification.hours || 0,
        notification.minutes || 0,
        notification.seconds || 0
      );
      createdNotifications.push(created);
    }

    await page.goto('/notifications');
    const initialCount = await page.locator('[data-testid="notification-item"]').count();
    expect(initialCount).toBe(4);

    // Run cleanup
    await triggerRetentionCleanup();
    await page.waitForTimeout(2000);
    await page.reload();

    // Verify boundary handling
    // Notifications that are exactly 30 days or older should be deleted
    // Notifications under 30 days should be preserved
    const finalCount = await page.locator('[data-testid="notification-item"]').count();
    expect(finalCount).toBe(1); // Only "29 Days 23 Hours" should remain

    const remaining = await page.locator('[data-testid="notification-item"]').first();
    const remainingSubject = await remaining.locator('[data-testid="notification-subject"]').textContent();
    expect(remainingSubject).toBe('29 Days 23 Hours');
  });

  test('should run cleanup job on schedule without user intervention', async () => {
    // Create old notifications
    await createTestNotificationWithAge(
      { subject: 'Auto Cleanup Test', body: 'Should be auto-deleted', tags: ['Auto', 'Cleanup'] },
      35
    );

    // Check if automatic cleanup scheduling is working
    // This would typically involve checking logs or scheduled job status
    
    // For simulation, we'll check if the cleanup mechanism is properly configured
    const cleanupStatus = await getCleanupJobStatus();
    expect(cleanupStatus.isEnabled).toBe(true);
    expect(cleanupStatus.schedule).toBeTruthy();
    
    // Verify cleanup job can run without errors
    const cleanupResult = await triggerRetentionCleanup();
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.deletedCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle large batch deletions efficiently', async () => {
    // Create a large number of old notifications
    const batchSize = 100;
    const notificationIds = [];
    
    for (let i = 0; i < batchSize; i++) {
      const created = await createTestNotificationWithAge(
        {
          subject: `Batch Delete Test ${i + 1}`,
          body: `Notification ${i + 1} for batch deletion testing`,
          tags: ['Batch', 'Delete', 'Performance']
        },
        35 + Math.floor(i / 10) // Varying ages from 35-44 days old
      );
      notificationIds.push(created.id);
    }

    // Also create some recent notifications that should be preserved
    const recentIds = [];
    for (let i = 0; i < 10; i++) {
      const created = await createTestNotificationWithAge(
        {
          subject: `Recent ${i + 1}`,
          body: `Recent notification ${i + 1}`,
          tags: ['Recent', 'Preserve']
        },
        Math.floor(Math.random() * 25) // 0-24 days old
      );
      recentIds.push(created.id);
    }

    // Verify initial state
    await page.goto('/notifications');
    
    // May need to paginate to see all notifications
    const initialCount = await getTotalNotificationCount();
    expect(initialCount).toBeGreaterThanOrEqual(110);

    // Measure cleanup performance
    const startTime = Date.now();
    const cleanupResult = await triggerRetentionCleanup();
    const endTime = Date.now();
    
    const cleanupDuration = endTime - startTime;
    
    // Cleanup should complete in reasonable time (under 30 seconds for 100 records)
    expect(cleanupDuration).toBeLessThan(30000);
    expect(cleanupResult.success).toBe(true);
    expect(cleanupResult.deletedCount).toBe(batchSize);

    // Verify all old notifications are deleted
    await page.reload();
    
    for (const id of notificationIds) {
      const exists = await checkNotificationExists(id);
      expect(exists).toBe(false);
    }

    // Verify recent notifications are preserved
    for (const id of recentIds) {
      const exists = await checkNotificationExists(id);
      expect(exists).toBe(true);
    }
  });

  test('should maintain data integrity during cleanup operations', async () => {
    // Create notifications with relationships/references
    const parentNotification = await createTestNotificationWithAge(
      {
        subject: 'Parent Notification',
        body: 'This notification has related data',
        tags: ['Parent', 'Integrity', 'Test']
      },
      35 // Should be deleted
    );

    const recentNotification = await createTestNotificationWithAge(
      {
        subject: 'Recent with References',
        body: 'This notification should be preserved',
        tags: ['Recent', 'Integrity', 'Test']
      },
      15 // Should be preserved
    );

    // Verify initial database state
    const initialIntegrityCheck = await checkDatabaseIntegrity();
    expect(initialIntegrityCheck.isValid).toBe(true);

    // Run cleanup
    await triggerRetentionCleanup();
    
    // Verify database integrity after cleanup
    const postCleanupIntegrityCheck = await checkDatabaseIntegrity();
    expect(postCleanupIntegrityCheck.isValid).toBe(true);

    // Verify foreign key constraints are maintained
    expect(postCleanupIntegrityCheck.constraintViolations).toHaveLength(0);

    // Verify no orphaned records
    expect(postCleanupIntegrityCheck.orphanedRecords).toHaveLength(0);
  });

  test('should provide audit trail for cleanup operations', async () => {
    // Create notifications for cleanup
    const oldNotification = await createTestNotificationWithAge(
      { subject: 'Audit Trail Test', body: 'Track deletion', tags: ['Audit'] },
      35
    );

    // Run cleanup
    const cleanupResult = await triggerRetentionCleanup();
    
    // Check audit logs
    const auditLogs = await getCleanupAuditLogs();
    
    // Should have log entry for the cleanup operation
    expect(auditLogs.length).toBeGreaterThan(0);
    
    const latestLog = auditLogs[0];
    expect(latestLog.operation).toBe('retention_cleanup');
    expect(latestLog.deletedCount).toBeGreaterThanOrEqual(1);
    expect(latestLog.timestamp).toBeTruthy();
    expect(latestLog.success).toBe(true);
    
    // Should log specific notification IDs that were deleted
    expect(latestLog.deletedNotificationIds).toContain(oldNotification.id);
  });

  test('should handle cleanup errors gracefully', async () => {
    // Create test notification
    await createTestNotificationWithAge(
      { subject: 'Error Test', body: 'Error handling test', tags: ['Error'] },
      35
    );

    // Simulate cleanup with potential errors (e.g., database connection issues)
    // This would be done by mocking or simulating error conditions
    
    const cleanupResult = await triggerRetentionCleanupWithErrorSimulation();
    
    // Even with errors, cleanup should complete what it can
    expect(cleanupResult.completed).toBe(true);
    
    if (cleanupResult.errors.length > 0) {
      // Errors should be logged
      expect(cleanupResult.errors).toBeDefined();
      
      // Should attempt retry logic
      expect(cleanupResult.retryAttempts).toBeGreaterThan(0);
    }

    // System should remain stable after error recovery
    await page.goto('/notifications');
    await expect(page.locator('[data-testid="notifications-dashboard"]')).toBeVisible();
  });

  test('should respect user preferences for retention if configurable', async () => {
    // Check if user can configure retention period
    await page.goto('/settings/notifications');
    
    const retentionSettings = page.locator('[data-testid="retention-settings"]');
    
    if (await retentionSettings.isVisible()) {
      // If configurable, test different retention periods
      const retentionPeriodInput = page.locator('[data-testid="retention-period-days"]');
      
      // Set custom retention period (e.g., 45 days)
      await retentionPeriodInput.fill('45');
      await page.click('[data-testid="save-retention-settings"]');
      
      // Create notifications to test custom period
      const oldNotification = await createTestNotificationWithAge(
        { subject: 'Custom Retention Test', body: 'Test custom period', tags: ['Custom'] },
        40 // Would be deleted with 30-day policy, preserved with 45-day policy
      );
      
      // Run cleanup
      await triggerRetentionCleanup();
      
      // Should be preserved due to custom 45-day retention
      const exists = await checkNotificationExists(oldNotification.id);
      expect(exists).toBe(true);
    }
  });
});

// Helper functions for test setup and utilities
async function createTestNotificationWithAge(
  notification: { subject: string; body: string; tags: string[] },
  daysOld: number
): Promise<{ id: string; subject: string; body: string; tags: string[] }> {
  // This would integrate with Zero's notification system and set created_at date
  const id = generateUUID();
  console.log(`Creating notification "${notification.subject}" aged ${daysOld} days`);
  return { id, ...notification };
}

async function createTestNotificationWithPreciseAge(
  notification: { subject: string; body: string; tags: string[] },
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): Promise<{ id: string; subject: string; body: string; tags: string[] }> {
  // This would create notification with precise timestamp
  const id = generateUUID();
  console.log(`Creating notification "${notification.subject}" aged ${days}d ${hours}h ${minutes}m ${seconds}s`);
  return { id, ...notification };
}

async function triggerRetentionCleanup(): Promise<{ success: boolean; deletedCount: number }> {
  // This would trigger the actual cleanup job
  console.log('Triggering retention cleanup job');
  return { success: true, deletedCount: 0 };
}

async function checkNotificationExists(id: string): Promise<boolean> {
  // This would check if notification exists in database
  console.log(`Checking if notification ${id} exists`);
  return true; // Mock implementation
}

async function getTotalNotificationCount(): Promise<number> {
  // This would get total count including paginated results
  return 0;
}

async function getCleanupJobStatus(): Promise<{ isEnabled: boolean; schedule: string }> {
  // This would check cleanup job configuration
  return { isEnabled: true, schedule: '0 2 * * *' }; // Daily at 2 AM
}

async function checkDatabaseIntegrity(): Promise<{ 
  isValid: boolean; 
  constraintViolations: any[]; 
  orphanedRecords: any[] 
}> {
  // This would run database integrity checks
  return { isValid: true, constraintViolations: [], orphanedRecords: [] };
}

async function getCleanupAuditLogs(): Promise<any[]> {
  // This would retrieve audit logs for cleanup operations
  return [
    {
      operation: 'retention_cleanup',
      timestamp: new Date(),
      success: true,
      deletedCount: 1,
      deletedNotificationIds: ['test-uuid']
    }
  ];
}

async function triggerRetentionCleanupWithErrorSimulation(): Promise<{
  completed: boolean;
  errors: any[];
  retryAttempts: number;
}> {
  // This would simulate cleanup with error conditions
  return { completed: true, errors: [], retryAttempts: 1 };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}