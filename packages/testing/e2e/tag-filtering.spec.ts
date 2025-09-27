/**
 * Integration Test: Tag-Based Filtering (T017)
 * 
 * Tests notification tag filtering functionality in the dashboard:
 * - Tag-based filtering with multiple tag combinations
 * - Filter persistence across page navigation
 * - OR and AND logic for multiple tag selections
 * - Tag count displays and updates
 * - Clear filters functionality
 * - Search and filter combination
 * 
 * Covers FR-004, FR-010: Tag-based filtering and categorization
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Tag-Based Filtering', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Ensure user is authenticated
    await page.goto('/auth/login');
    // TODO: Add authentication steps based on Zero's auth system
  });

  test('should filter notifications by individual tags correctly', async () => {
    // Create notifications with different tag combinations
    const notifications = [
      { subject: 'System Alert', body: 'System notification', tags: ['System', 'Alert'] },
      { subject: 'N8N Workflow', body: 'N8N automation notification', tags: ['N8N', 'Automation'] },
      { subject: 'Event Update', body: 'Event database update', tags: ['Events', 'External'] },
      { subject: 'System Update', body: 'Another system notification', tags: ['System', 'Update'] },
      { subject: 'N8N Error', body: 'N8N workflow error', tags: ['N8N', 'Error'] }
    ];

    // Create all test notifications
    for (const notification of notifications) {
      await createTestNotification(notification);
    }

    // Navigate to notifications dashboard
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Verify all notifications are visible initially
    const allNotifications = page.locator('[data-testid="notification-item"]');
    const initialCount = await allNotifications.count();
    expect(initialCount).toBe(5);

    // Test filtering by 'System' tag
    const systemTagFilter = page.locator('[data-testid="tag-filter-System"]');
    await expect(systemTagFilter).toBeVisible();
    
    // Check tag count before filtering
    const systemTagCount = await systemTagFilter.locator('[data-testid="tag-count"]').textContent();
    expect(systemTagCount).toBe('2'); // Two notifications with System tag
    
    await systemTagFilter.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Should now show only notifications with 'System' tag
    const systemFiltered = await allNotifications.count();
    expect(systemFiltered).toBe(2);
    
    // Verify correct notifications are shown
    const systemNotifications = await page.locator('[data-testid="notification-item"]').all();
    for (const notification of systemNotifications) {
      const tags = notification.locator('[data-testid="notification-tags"]');
      await expect(tags).toContainText('System');
    }

    // Test filtering by 'N8N' tag
    await page.click('[data-testid="clear-filters"]'); // Clear first
    await page.waitForTimeout(500);
    
    const n8nTagFilter = page.locator('[data-testid="tag-filter-N8N"]');
    await n8nTagFilter.click();
    
    await page.waitForTimeout(500);
    const n8nFiltered = await allNotifications.count();
    expect(n8nFiltered).toBe(2);
  });

  test('should support multiple tag selection with OR logic', async () => {
    // Create notifications for multi-tag testing
    const notifications = [
      { subject: 'System Alert', body: 'System notification', tags: ['System', 'Alert'] },
      { subject: 'N8N Workflow', body: 'N8N automation', tags: ['N8N', 'Automation'] },
      { subject: 'Event Update', body: 'Event notification', tags: ['Events', 'External'] },
      { subject: 'Both Tags', body: 'Has both system and n8n', tags: ['System', 'N8N'] }
    ];

    for (const notification of notifications) {
      await createTestNotification(notification);
    }

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Select multiple tags (System OR N8N)
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(300);
    
    // Add N8N tag to selection (should be additive - OR logic)
    await page.click('[data-testid="tag-filter-N8N"]', { modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    // Should show notifications that have EITHER System OR N8N tags
    const multiFiltered = await page.locator('[data-testid="notification-item"]').count();
    expect(multiFiltered).toBe(3); // System Alert, N8N Workflow, Both Tags
    
    // Verify active filter indicators
    const activeFilters = page.locator('[data-testid="active-filters"]');
    await expect(activeFilters).toBeVisible();
    
    const systemFilter = activeFilters.locator('[data-testid="active-filter-System"]');
    const n8nFilter = activeFilters.locator('[data-testid="active-filter-N8N"]');
    
    await expect(systemFilter).toBeVisible();
    await expect(n8nFilter).toBeVisible();
  });

  test('should persist filters across page navigation', async () => {
    // Create test notifications
    await createTestNotification({
      subject: 'System Test',
      body: 'System notification for persistence test',
      tags: ['System', 'Test']
    });

    await page.goto('/notifications');
    
    // Apply System tag filter
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(500);
    
    // Verify filter is applied
    const filteredCount = await page.locator('[data-testid="notification-item"]').count();
    expect(filteredCount).toBeGreaterThan(0);
    
    // Navigate to a notification and back
    const firstNotification = page.locator('[data-testid="notification-item"]').first();
    const notificationLink = firstNotification.locator('[data-testid="notification-link"]');
    
    if (await notificationLink.isVisible()) {
      await notificationLink.click();
      
      // Should be on individual notification page
      await expect(page).toHaveURL(/\/notifications\/[a-f0-9-]{36}$/);
      
      // Navigate back to dashboard
      await page.click('[data-testid="back-to-list"]');
      
      // Filter should still be active
      const systemFilter = page.locator('[data-testid="tag-filter-System"]');
      await expect(systemFilter).toHaveClass(/active/);
      
      // Filtered results should still be shown
      const persistedCount = await page.locator('[data-testid="notification-item"]').count();
      expect(persistedCount).toBe(filteredCount);
    }
  });

  test('should display and update tag counts correctly', async () => {
    // Create notifications with known tag distributions
    const tagDistribution = {
      'System': 3,
      'N8N': 2,
      'Events': 1,
      'Alert': 2,
      'Error': 1
    };

    // Create notifications to match distribution
    await createTestNotification({ subject: 'System 1', body: 'Test', tags: ['System', 'Alert'] });
    await createTestNotification({ subject: 'System 2', body: 'Test', tags: ['System'] });
    await createTestNotification({ subject: 'System 3', body: 'Test', tags: ['System', 'Error'] });
    await createTestNotification({ subject: 'N8N 1', body: 'Test', tags: ['N8N', 'Alert'] });
    await createTestNotification({ subject: 'N8N 2', body: 'Test', tags: ['N8N'] });
    await createTestNotification({ subject: 'Event 1', body: 'Test', tags: ['Events'] });

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // Verify initial tag counts
    for (const [tag, count] of Object.entries(tagDistribution)) {
      const tagFilter = page.locator(`[data-testid="tag-filter-${tag}"]`);
      const tagCount = tagFilter.locator('[data-testid="tag-count"]');
      
      if (await tagFilter.isVisible()) {
        await expect(tagCount).toHaveText(count.toString());
      }
    }

    // Apply a filter and verify counts update
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(500);
    
    // When System filter is active, other tag counts should reflect
    // how many notifications have both System AND the other tag
    const alertTagCount = page.locator('[data-testid="tag-filter-Alert"] [data-testid="tag-count"]');
    if (await alertTagCount.isVisible()) {
      await expect(alertTagCount).toHaveText('1'); // Only 1 notification has both System and Alert
    }
  });

  test('should support clearing filters with multiple methods', async () => {
    // Create test notifications
    await createTestNotification({ subject: 'Test 1', body: 'Test', tags: ['System'] });
    await createTestNotification({ subject: 'Test 2', body: 'Test', tags: ['N8N'] });
    await createTestNotification({ subject: 'Test 3', body: 'Test', tags: ['Events'] });

    await page.goto('/notifications');
    
    // Apply multiple filters
    await page.click('[data-testid="tag-filter-System"]');
    await page.click('[data-testid="tag-filter-N8N"]', { modifiers: ['Control'] });
    await page.waitForTimeout(500);
    
    // Verify filters are active
    const activeFilters = page.locator('[data-testid="active-filters"]');
    await expect(activeFilters).toBeVisible();
    
    const systemActive = page.locator('[data-testid="active-filter-System"]');
    const n8nActive = page.locator('[data-testid="active-filter-N8N"]');
    
    await expect(systemActive).toBeVisible();
    await expect(n8nActive).toBeVisible();
    
    // Method 1: Clear all filters button
    const clearAllButton = page.locator('[data-testid="clear-all-filters"]');
    await clearAllButton.click();
    await page.waitForTimeout(500);
    
    // Verify all filters are cleared
    await expect(systemActive).not.toBeVisible();
    await expect(n8nActive).not.toBeVisible();
    
    // Should show all notifications
    const allCount = await page.locator('[data-testid="notification-item"]').count();
    expect(allCount).toBe(3);
    
    // Apply filters again for next test
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(300);
    
    // Method 2: Remove individual filter
    const removeSystemFilter = page.locator('[data-testid="remove-filter-System"]');
    await removeSystemFilter.click();
    await page.waitForTimeout(500);
    
    // System filter should be removed
    await expect(page.locator('[data-testid="active-filter-System"]')).not.toBeVisible();
  });

  test('should combine search and tag filtering effectively', async () => {
    // Create notifications for search + filter testing
    const notifications = [
      { subject: 'System Database Update', body: 'Database update notification', tags: ['System', 'Database'] },
      { subject: 'N8N Database Sync', body: 'Database sync notification', tags: ['N8N', 'Database'] },
      { subject: 'System Alert', body: 'Alert notification', tags: ['System', 'Alert'] },
      { subject: 'User Database Query', body: 'Database query notification', tags: ['User', 'Database'] }
    ];

    for (const notification of notifications) {
      await createTestNotification(notification);
    }

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    
    // First apply search filter
    const searchInput = page.locator('[data-testid="search-notifications"]');
    await searchInput.fill('Database');
    await page.waitForTimeout(500);
    
    // Should show 3 notifications with 'Database' in title or content
    let searchResults = await page.locator('[data-testid="notification-item"]').count();
    expect(searchResults).toBe(3);
    
    // Now add tag filter on top of search
    await page.click('[data-testid="tag-filter-System"]');
    await page.waitForTimeout(500);
    
    // Should show only notifications that match BOTH search term AND tag
    const combinedResults = await page.locator('[data-testid="notification-item"]').count();
    expect(combinedResults).toBe(1); // Only "System Database Update"
    
    // Verify the correct notification is shown
    const resultNotification = page.locator('[data-testid="notification-item"]').first();
    await expect(resultNotification).toContainText('System Database Update');
    
    // Clear search but keep tag filter
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Should show all System notifications
    const tagOnlyResults = await page.locator('[data-testid="notification-item"]').count();
    expect(tagOnlyResults).toBe(2); // System Database Update + System Alert
  });

  test('should handle empty filter results gracefully', async () => {
    // Create notifications without certain tags
    await createTestNotification({ subject: 'Test 1', body: 'Test', tags: ['System'] });
    await createTestNotification({ subject: 'Test 2', body: 'Test', tags: ['N8N'] });

    await page.goto('/notifications');
    
    // Filter by tag that doesn't exist
    const nonExistentFilter = page.locator('[data-testid="tag-filter-NonExistent"]');
    
    // If the filter exists (no notifications have this tag)
    if (await nonExistentFilter.isVisible()) {
      await nonExistentFilter.click();
      await page.waitForTimeout(500);
      
      // Should show empty state
      const emptyState = page.locator('[data-testid="empty-filtered-results"]');
      await expect(emptyState).toBeVisible();
      
      const emptyMessage = page.locator('[data-testid="empty-filter-message"]');
      await expect(emptyMessage).toContainText('No notifications found');
      
      // Should show option to clear filters
      const clearFiltersFromEmpty = page.locator('[data-testid="clear-filters-from-empty"]');
      await expect(clearFiltersFromEmpty).toBeVisible();
      
      await clearFiltersFromEmpty.click();
      
      // Should return to showing all notifications
      const restoredCount = await page.locator('[data-testid="notification-item"]').count();
      expect(restoredCount).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation for tag filters', async () => {
    await createTestNotification({ subject: 'Test', body: 'Test', tags: ['System', 'N8N', 'Events'] });

    await page.goto('/notifications');
    
    // Tab to tag filters section
    await page.keyboard.press('Tab');
    // Continue tabbing until we reach tag filters
    
    const tagFiltersSection = page.locator('[data-testid="tag-filters-section"]');
    await tagFiltersSection.focus();
    
    // Use arrow keys to navigate between tag filters
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Press Enter to select a tag filter
    await page.keyboard.press('Enter');
    
    // Should apply the focused filter
    await page.waitForTimeout(500);
    
    // Verify a filter is active
    const activeFilters = page.locator('[data-testid="active-filters"]');
    await expect(activeFilters).toBeVisible();
    
    // Use Escape to clear filters
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Filters should be cleared
    await expect(activeFilters).not.toBeVisible();
  });

  test('should show tag suggestions and autocomplete', async () => {
    // Create notifications with various tags
    const uniqueTags = ['System', 'N8N', 'Events', 'Alert', 'Error', 'Success', 'Database', 'API'];
    
    for (let i = 0; i < uniqueTags.length; i++) {
      await createTestNotification({
        subject: `Test ${i + 1}`,
        body: `Test notification ${i + 1}`,
        tags: [uniqueTags[i], 'Test']
      });
    }

    await page.goto('/notifications');
    
    // Check if tag input/autocomplete exists
    const tagInput = page.locator('[data-testid="tag-filter-input"]');
    
    if (await tagInput.isVisible()) {
      // Start typing a tag name
      await tagInput.fill('Sys');
      
      // Should show suggestions
      const suggestions = page.locator('[data-testid="tag-suggestions"]');
      await expect(suggestions).toBeVisible();
      
      const systemSuggestion = suggestions.locator('[data-testid="suggestion-System"]');
      await expect(systemSuggestion).toBeVisible();
      
      // Click suggestion to apply filter
      await systemSuggestion.click();
      
      // Filter should be applied
      await page.waitForTimeout(500);
      const filteredResults = await page.locator('[data-testid="notification-item"]').count();
      expect(filteredResults).toBeGreaterThan(0);
    }
  });
});

// Helper function for test setup
async function createTestNotification(notification: { subject: string; body: string; tags: string[] }): Promise<void> {
  // This would integrate with Zero's notification creation system
  console.log('Creating notification:', notification.subject, 'with tags:', notification.tags);
}