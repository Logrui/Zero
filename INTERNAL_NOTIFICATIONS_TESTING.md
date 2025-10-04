# How to Test Internal Notifications

## Important: Security by Design

**Internal notifications should ONLY be created from within your application code** - never via external API endpoints. This is why we don't have a PowerShell test script for them.

---

## How Internal Notifications Work

```
Application Event (workflow, job, error)
        ↓
Your Code calls NotificationService
        ↓
D1 Database (internal only)
        ↓
User sees notification
```

**NOT via HTTP** ❌  
**Only from your application logic** ✅

---

## How to Test Internal Notifications

### Option 1: Add to Existing Workflows (RECOMMENDED)

Find a workflow or background job in your app and add notification creation:

**Example: In `workflows/sync-threads-workflow.ts`**

```typescript
import { createNotificationService } from '../lib/notification-service';

// After workflow completes
async function onSyncComplete(userId: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  await notificationService.createWorkflowNotification({
    subject: 'Email Sync Complete',
    body: 'Your emails have been synchronized successfully.',
    userId: userId,
    workflowId: 'sync-' + Date.now(),
    workflowName: 'Email Sync',
    status: 'completed',
    priority: 'medium'
  });
}
```

Then trigger the workflow normally through your app!

---

### Option 2: Add to Error Handlers

**Example: In your error handling middleware**

```typescript
import { createNotificationService } from '../lib/notification-service';

async function handleCriticalError(error: Error, userId: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  await notificationService.createSystemAlert({
    subject: 'System Error Occurred',
    body: `An error was detected: ${error.message}`,
    userId: userId,
    alertType: 'error'
  });
}
```

---

### Option 3: Add Temporary Test Code (DEV ONLY)

Add this to an existing endpoint you already use, then remove it after testing:

**Example: Add to your TRPC router or an existing route**

```typescript
// In your existing TRPC procedure or route handler
import { createNotificationService } from '../lib/notification-service';

// Temporarily add this to test
const notificationService = createNotificationService(ctx.env.DB);

// Test workflow notification
await notificationService.createWorkflowNotification({
  subject: 'TEST: Workflow Complete',
  body: 'This is a test workflow notification',
  userId: ctx.userId, // Use actual authenticated user
  workflowId: 'test-' + Date.now(),
  workflowName: 'Test Workflow',
  status: 'completed',
  priority: 'high'
});

// Test system alert
await notificationService.createSystemAlert({
  subject: 'TEST: System Alert',
  body: 'This is a test system alert notification',
  userId: ctx.userId,
  alertType: 'warning'
});

// Test custom notification
await notificationService.createNotification({
  subject: 'TEST: Custom Notification',
  body: 'This is a test custom notification',
  userId: ctx.userId,
  priority: 'medium',
  tags: ['test', 'custom'],
  metadata: {
    testId: 'test-123',
    timestamp: new Date().toISOString()
  }
});
```

Then call that endpoint from your frontend/Postman to trigger the test!

---

### Option 4: Direct Database Script (ADVANCED)

If you really need to test without code changes, insert directly via SQL:

```sql
-- insert-internal-notification-test.sql
INSERT INTO notifications (
  id, subject, body, userId, priority, tags, metadata,
  createdAt, updatedAt, isRead, readStatus
) VALUES (
  lower(hex(randomblob(16))),
  'Internal Test Notification',
  'This notification was created directly in the database for testing',
  'test-user-123',
  'high',
  '["internal", "test", "workflow"]',
  '{"source": "direct-sql", "type": "test"}',
  datetime('now'),
  datetime('now'),
  0,
  0
);
```

Run with wrangler:
```bash
wrangler d1 execute DB --local --file=insert-internal-notification-test.sql
```

---

## Recommended Testing Flow

1. **Choose an integration point** (workflow, job, error handler)
2. **Add notification service call** with proper error handling
3. **Trigger the event** through normal app usage
4. **Verify in `/notifications`** that it appears
5. **Verify special features** (workflow notifications have thumbs up/down, re-run)

---

## Real-World Integration Examples

### Example 1: Email Workflow Completion

```typescript
// workflows/sync-threads-workflow.ts
import { createNotificationService } from '../lib/notification-service';

export class SyncThreadsWorkflow {
  async execute(userId: string, db: D1Database) {
    try {
      // ... your workflow logic ...
      
      // On success
      const notificationService = createNotificationService(db);
      await notificationService.createWorkflowNotification({
        subject: 'Email Sync Complete',
        body: `Synced ${emailCount} emails successfully`,
        userId: userId,
        workflowId: this.workflowId,
        workflowName: 'Email Sync',
        status: 'completed',
        priority: 'medium'
      });
    } catch (error) {
      // On error
      const notificationService = createNotificationService(db);
      await notificationService.createWorkflowNotification({
        subject: 'Email Sync Failed',
        body: `Failed to sync emails: ${error.message}`,
        userId: userId,
        workflowId: this.workflowId,
        workflowName: 'Email Sync',
        status: 'failed',
        priority: 'high'
      });
    }
  }
}
```

### Example 2: Background Job

```typescript
// Some background job handler
import { createNotificationService } from '../lib/notification-service';

async function processDataExport(userId: string, db: D1Database) {
  // ... process export ...
  
  const notificationService = createNotificationService(db);
  await notificationService.createNotification({
    subject: 'Data Export Ready',
    body: 'Your requested data export has completed',
    userId: userId,
    priority: 'medium',
    tags: ['export', 'data'],
    metadata: {
      downloadUrl: '/exports/data.csv',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
}
```

---

## Why No External API?

**Security**: Internal notifications represent system events. Exposing them via API would allow:
- External parties to spam users with fake system notifications
- Impersonation of system workflows
- Confusion between real system events and fake ones

**Proper Architecture**:
- **External API** (`/notifications/api`) → For external tools (N8N, Zapier) with API key auth
- **Internal Service** (`NotificationService`) → For your app code only

---

## Summary

✅ **Test by integrating** into existing workflows/jobs  
✅ **Test via SQL** for quick database verification  
✅ **Add temporarily** to existing authenticated endpoints  

❌ **Don't expose** via public API endpoints  
❌ **Don't create** test endpoints for internal features  

The notifications system is complete and production-ready! 🎉
