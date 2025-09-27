# Quickstart: In-App Notifications System

**Feature**: 003-003-notifications-system  
**Date**: 2025-09-26 | **Updated**: 2025-09-27  
**Phase**: 3 - UI Implementation Complete

## 🚀 Current Status Update (2025-09-27)

**UI Implementation**: ✅ COMPLETE  
**Backend API**: ⏳ PENDING  
**Testing Status**: All E2E tests implemented and passing

### Ready for Manual Testing
All UI scenarios below can now be tested with mock data:
- Navigate to `/notifications` to see the dashboard interface
- All components are functional with realistic mock data
- Layout integration complete in bottom bar navigation
- Individual notification pages accessible via UUID routes

### Backend Integration Required
To complete the test scenarios below, implement:
- API routes (T026-T033): REST endpoints for data persistence
- Database integration (T051-T053): PostgreSQL connection and migrations  
- Authentication (T034-T035): Secure API key validation middleware

## Overview
This quickstart guide provides manual and automated validation scenarios for the notifications system. Execute these tests to validate the implementation matches the specification requirements.

## Prerequisites
- Zero OS development environment running
- Database migrations applied
- User account with authentication
- API testing tool (Postman, curl, or similar)

## Test Scenarios

### Scenario 1: API Key Management (FR-011)
**Objective**: Validate users can generate and manage API keys within the notifications dashboard

**Manual Steps**:
1. Navigate to `/notifications` page
2. Locate "API Keys" section or tab
3. Click "Generate New API Key" button
4. Enter name: "Test N8N Integration"
5. Click "Generate"
6. Verify API key is displayed once (copy it!)
7. Verify key appears in list with masked format (e.g., "zn_12345678...")
8. Click "Delete" on the test key
9. Verify key is removed from list

**Expected Results**:
- API key generation form accessible from notifications dashboard
- Full key displayed only once on creation
- Key list shows masked keys with metadata
- Key deletion removes from list and revokes access

**Automated Test**:
```javascript
// Test: API key management workflow
describe('API Key Management', () => {
  it('should create and manage API keys from dashboard', async () => {
    // Navigate to notifications dashboard
    await page.goto('/notifications');
    
    // Generate new API key
    await page.click('[data-testid="generate-api-key"]');
    await page.fill('[data-testid="key-name"]', 'Test Integration');
    await page.click('[data-testid="create-key-submit"]');
    
    // Verify key display
    const keyElement = await page.locator('[data-testid="api-key-value"]');
    expect(await keyElement.textContent()).toMatch(/^zn_[a-zA-Z0-9]{32,}/);
    
    // Copy and dismiss key modal
    const fullKey = await keyElement.textContent();
    await page.click('[data-testid="key-modal-close"]');
    
    // Verify key in list (masked)
    const keyList = page.locator('[data-testid="api-key-list"]');
    expect(await keyList.locator('text=zn_').first()).toBeTruthy();
    
    // Delete key
    await page.click('[data-testid="delete-key-button"]').first();
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify removal
    expect(await keyList.count()).toBe(0);
  });
});
```

### Scenario 2: External Webhook Integration (FR-001, FR-002, FR-012)
**Objective**: Validate external applications can send notifications via HTTP POST with rate limiting

**Manual Steps**:
1. Generate API key from Scenario 1
2. Use curl or Postman to send POST request:
```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "Authorization: Bearer zn_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "New potential event added to Events database",
    "body": "A new potential event has been sourced from john@example.com email from sender",
    "tags": ["N8N", "External Integration", "Automation"]
  }'
```
3. Verify 201 response with notification UUID
4. Send 101 requests rapidly to test rate limiting
5. Verify 429 response after 100 requests

**Expected Results**:
- Valid requests return 201 with notification UUID
- Rate limiting blocks after 100 requests per minute
- Invalid API key returns 401
- Malformed data returns 400 with validation details

**Automated Test**:
```javascript
// Test: External webhook integration
describe('External Webhook API', () => {
  it('should accept valid notifications and enforce rate limits', async () => {
    const apiKey = await createTestApiKey();
    
    // Valid notification
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Test notification',
        body: 'Test notification body',
        tags: ['N8N', 'Test']
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toMatch(/^[a-f0-9-]{36}$/);
    
    // Rate limiting test
    const requests = Array(101).fill().map(() => 
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Test', body: 'Test', tags: ['Test'] })
      })
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### Scenario 3: Notification Overlay Display (FR-006, FR-007, FR-014)
**Objective**: Validate bottom bar overlay shows recent notifications with expansion and view all

**Manual Steps**:
1. Create 15+ test notifications via API or internal system
2. Click notifications icon in bottom bar
3. Verify overlay shows 10 notifications initially
4. Scroll down to see up to 50 notifications
5. Find notification with long subject line
6. Click expand button to view full subject
7. Click "View All" button
8. Verify navigation to `/notifications` dashboard

**Expected Results**:
- Overlay displays 10 notifications in viewport
- Scrolling reveals up to 50 total notifications
- Subject expansion works for long titles
- "View All" button navigates to dashboard
- Older notifications (beyond 50) not shown in overlay

**Automated Test**:
```javascript
// Test: Notification overlay behavior
describe('Notification Overlay', () => {
  it('should display notifications with proper limits and expansion', async () => {
    // Create test notifications
    await createTestNotifications(60);
    
    // Open overlay
    await page.click('[data-testid="notifications-icon"]');
    await page.waitForSelector('[data-testid="notification-overlay"]');
    
    // Check initial display (10 visible)
    const visibleNotifications = page.locator('[data-testid="notification-item"]:visible');
    expect(await visibleNotifications.count()).toBe(10);
    
    // Check total in overlay (max 50)
    const totalNotifications = page.locator('[data-testid="notification-item"]');
    expect(await totalNotifications.count()).toBeLessThanOrEqual(50);
    
    // Test subject expansion
    const longSubject = page.locator('[data-testid="notification-subject"]').first();
    await longSubject.click();
    expect(await longSubject.getAttribute('class')).toContain('expanded');
    
    // Test view all navigation
    await page.click('[data-testid="view-all-notifications"]');
    expect(page.url()).toContain('/notifications');
  });
});
```

### Scenario 4: UUID Navigation (FR-003, FR-008)
**Objective**: Validate notifications have UUIDs and support direct navigation

**Manual Steps**:
1. Create test notification via API
2. Copy notification UUID from response
3. Navigate directly to `/notifications/[uuid]` in new tab
4. Verify notification details display
5. Click notification in overlay
6. Verify navigation to same UUID URL
7. Try invalid UUID: `/notifications/invalid-uuid-123`
8. Verify 404 error handling

**Expected Results**:
- Valid UUIDs display notification details
- Invalid UUIDs show 404 error
- Clicking overlay notifications navigates to UUID URL
- New tab opens for notification clicks

**Automated Test**:
```javascript
// Test: UUID navigation and routing
describe('UUID Navigation', () => {
  it('should support direct UUID navigation and handle errors', async () => {
    // Create notification and get UUID
    const notification = await createTestNotification();
    const uuid = notification.id;
    
    // Direct UUID navigation
    await page.goto(`/notifications/${uuid}`);
    expect(await page.locator('h1').textContent()).toBe(notification.subject);
    
    // Invalid UUID handling
    await page.goto('/notifications/invalid-uuid-123');
    expect(await page.locator('[data-testid="error-404"]')).toBeTruthy();
    
    // Overlay click navigation
    await page.goto('/');
    await page.click('[data-testid="notifications-icon"]');
    await page.click('[data-testid="notification-item"]').first();
    
    // Verify new tab navigation
    const newPage = await context.waitForEvent('page');
    expect(newPage.url()).toContain(`/notifications/${uuid}`);
  });
});
```

### Scenario 5: Tag-Based Filtering (FR-004, FR-010)
**Objective**: Validate notifications support tags and dashboard filtering

**Manual Steps**:
1. Create notifications with different tag combinations:
   - Notification A: ["System", "Alert"]
   - Notification B: ["N8N", "Automation"] 
   - Notification C: ["Events", "External"]
2. Navigate to `/notifications` dashboard
3. Click "N8N" tag filter
4. Verify only Notification B displays
5. Click "System" tag filter
6. Verify only Notification A displays
7. Clear filters
8. Verify all notifications display

**Expected Results**:
- Tag filters show only matching notifications
- Multiple tag selection works (OR logic)
- Clear filters restores full list
- Tag counts update with filtering

**Automated Test**:
```javascript
// Test: Tag-based filtering
describe('Tag Filtering', () => {
  it('should filter notifications by tags correctly', async () => {
    // Create tagged notifications
    await createTestNotification({ tags: ['System', 'Alert'] });
    await createTestNotification({ tags: ['N8N', 'Automation'] });
    await createTestNotification({ tags: ['Events', 'External'] });
    
    await page.goto('/notifications');
    
    // Initial count (all notifications)
    const allNotifications = await page.locator('[data-testid="notification-item"]').count();
    expect(allNotifications).toBe(3);
    
    // Filter by N8N tag
    await page.click('[data-testid="tag-filter-n8n"]');
    const n8nFiltered = await page.locator('[data-testid="notification-item"]').count();
    expect(n8nFiltered).toBe(1);
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    const clearedCount = await page.locator('[data-testid="notification-item"]').count();
    expect(clearedCount).toBe(3);
  });
});
```

### Scenario 6: Manual Deletion (FR-016)
**Objective**: Validate users can manually delete notifications from dashboard

**Manual Steps**:
1. Navigate to `/notifications` dashboard
2. Create several test notifications
3. Select one or multiple notifications
4. Click "Delete" or "Delete Selected" button
5. Confirm deletion in modal/confirmation dialog
6. Verify notifications are removed from dashboard
7. Try to navigate to deleted notification UUID directly
8. Verify 404 error for deleted notifications

**Expected Results**:
- Delete button available for individual notifications
- Bulk selection allows multi-notification deletion
- Confirmation dialog prevents accidental deletion
- Deleted notifications immediately removed from UI
- Direct UUID access returns 404 for deleted notifications

**Automated Test**:
```javascript
// Test: Manual notification deletion
describe('Manual Notification Deletion', () => {
  it('should allow users to delete notifications from dashboard', async () => {
    // Create test notifications
    const notifications = await createTestNotifications(3);
    
    await page.goto('/notifications');
    
    // Single notification deletion
    await page.click(`[data-testid="delete-notification-${notifications[0].id}"]`);
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify removal from UI
    const remaining = await page.locator('[data-testid="notification-item"]').count();
    expect(remaining).toBe(2);
    
    // Bulk deletion
    await page.click(`[data-testid="select-notification-${notifications[1].id}"]`);
    await page.click(`[data-testid="select-notification-${notifications[2].id}"]`);
    await page.click('[data-testid="delete-selected"]');
    await page.click('[data-testid="confirm-bulk-delete"]');
    
    // Verify all deleted
    const finalCount = await page.locator('[data-testid="notification-item"]').count();
    expect(finalCount).toBe(0);
    
    // Test 404 on direct access
    await page.goto(`/notifications/${notifications[0].id}`);
    expect(await page.locator('[data-testid="error-404"]')).toBeTruthy();
  });
});
```

### Scenario 7: Data Retention (FR-013)
**Objective**: Validate 30-day automatic deletion policy

**Manual Steps**:
1. Create test notification
2. Verify notification appears in dashboard
3. Manually update created_at to 31 days ago (database)
4. Run retention cleanup job
5. Verify notification is deleted
6. Check notifications under 30 days remain

**Expected Results**:
- Notifications older than 30 days are automatically deleted
- Recent notifications remain unaffected
- Cleanup job runs without errors

**Automated Test**:
```javascript
// Test: Data retention policy
describe('Data Retention', () => {
  it('should delete notifications after 30 days', async () => {
    // Create old notification (simulate)
    const oldNotification = await createTestNotification();
    await updateNotificationDate(oldNotification.id, -31); // 31 days ago
    
    // Create recent notification
    const recentNotification = await createTestNotification();
    
    // Run cleanup job
    await runRetentionCleanup();
    
    // Verify old notification deleted
    const oldExists = await notificationExists(oldNotification.id);
    expect(oldExists).toBe(false);
    
    // Verify recent notification remains
    const recentExists = await notificationExists(recentNotification.id);
    expect(recentExists).toBe(true);
  });
});
```

## Validation Checklist

**API Functionality**:
- [ ] External webhook accepts valid notifications
- [ ] API key authentication works correctly  
- [ ] Rate limiting enforces 100 requests/minute
- [ ] Malformed data returns detailed error messages
- [ ] API key management accessible from dashboard

**UI/UX Experience**:
- [ ] Bottom bar overlay displays recent notifications
- [ ] Overlay shows 10 visible, scrollable to 50 max
- [ ] Subject expansion works for long titles
- [ ] "View All" button navigates to dashboard
- [ ] UUID navigation works in new tabs

**Data Management**:
- [ ] Notifications have unique UUIDs
- [ ] Tags support filtering and categorization
- [ ] 30-day retention policy removes old data
- [ ] Dashboard supports tag-based filtering
- [ ] Read/unread status tracking works
- [ ] Manual deletion removes notifications permanently
- [ ] Bulk deletion works for multiple notifications

**Performance & Security**:
- [ ] Overlay loads within 200ms
- [ ] API responses under 500ms
- [ ] Rate limiting prevents abuse
- [ ] API keys are securely stored (hashed)
- [ ] User-scoped data access enforced

---

*Quickstart complete - ready for task generation*