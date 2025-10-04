# Internal Notifications Usage Guide

## Overview

Internal notifications are system-generated notifications created by your application code (not external APIs). Use them to notify users about:

- ✅ Workflow completions
- ✅ Background job results
- ✅ System alerts and warnings
- ✅ Automated task outcomes
- ✅ Error notifications
- ✅ Status updates

---

## Quick Start

### 1. Import the Service

```typescript
import { createNotificationService } from './lib/notification-service';
```

### 2. Create a Notification

```typescript
// In any route handler or service
const notificationService = createNotificationService(c.env.DB);

await notificationService.createNotification({
  subject: 'Task Complete',
  body: 'Your background task finished successfully!',
  userId: 'user-123',
  priority: 'medium',
  tags: ['task', 'completed']
});
```

---

## Usage Examples

### Example 1: Workflow Completion

```typescript
// After a workflow finishes
import { createNotificationService } from './lib/notification-service';

async function onWorkflowComplete(workflowId: string, userId: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  await notificationService.createWorkflowNotification({
    subject: 'Email Automation Complete',
    body: 'Your email workflow has processed 150 emails successfully.',
    userId: userId,
    workflowId: workflowId,
    workflowName: 'Daily Email Sync',
    status: 'completed',
    priority: 'high'
  });
}
```

### Example 2: System Alert

```typescript
// When detecting a system issue
import { createNotificationService } from './lib/notification-service';

async function notifySystemError(userId: string, errorMessage: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  await notificationService.createSystemAlert({
    subject: 'System Error Detected',
    body: `An error occurred: ${errorMessage}. Our team has been notified.`,
    userId: userId,
    alertType: 'error'
  });
}
```

### Example 3: Custom Notification with Metadata

```typescript
// Custom notification with rich metadata
import { createNotificationService } from './lib/notification-service';

async function notifyDataExport(userId: string, exportId: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  await notificationService.createNotification({
    subject: 'Data Export Ready',
    body: 'Your requested data export is ready for download.',
    userId: userId,
    priority: 'medium',
    tags: ['export', 'data'],
    metadata: {
      exportId: exportId,
      format: 'CSV',
      size: '2.5MB',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
}
```

### Example 4: Bulk Notifications (Multiple Users)

```typescript
// Notify multiple users at once
import { createNotificationService } from './lib/notification-service';

async function notifyAllUsers(userIds: string[], message: string, db: D1Database) {
  const notificationService = createNotificationService(db);
  
  const notifications = userIds.map(userId => ({
    subject: 'System Maintenance',
    body: message,
    userId: userId,
    priority: 'medium' as const,
    tags: ['system', 'announcement']
  }));
  
  await notificationService.createBulkNotifications(notifications);
}
```

---

## Notification Types

### 1. **Standard Notification**
```typescript
createNotification({
  subject: string,
  body: string,
  userId: string,
  priority?: 'low' | 'medium' | 'high',
  tags?: string[],
  metadata?: Record<string, any>
})
```

### 2. **Workflow Notification** (Has special UI features)
```typescript
createWorkflowNotification({
  subject: string,
  body: string,
  userId: string,
  workflowId: string,
  workflowName: string,
  status: 'completed' | 'failed' | 'running',
  priority?: 'low' | 'medium' | 'high'
})
```
✨ **Special Features:**
- Shows thumbs up/down buttons
- Has "Re-run" action
- Displays run history

### 3. **System Alert**
```typescript
createSystemAlert({
  subject: string,
  body: string,
  userId: string,
  alertType: 'error' | 'warning' | 'info'
})
```

---

## Integration Points

### Where to Add Internal Notifications:

1. **After Workflow Execution** (`workflows/*.ts`)
   ```typescript
   // After workflow completes
   await notificationService.createWorkflowNotification({...});
   ```

2. **In Background Jobs** (`routes/*.ts`)
   ```typescript
   // When job finishes
   await notificationService.createNotification({...});
   ```

3. **Error Handlers** (`lib/*.ts`)
   ```typescript
   // When catching critical errors
   await notificationService.createSystemAlert({
     alertType: 'error',
     ...
   });
   ```

4. **TRPC Procedures** (`trpc.ts`)
   ```typescript
   // After completing long-running operations
   const notificationService = createNotificationService(ctx.env.DB);
   await notificationService.createNotification({...});
   ```

5. **Durable Objects** (`routes/agent/*.ts`)
   ```typescript
   // From ZeroDB or ZeroAgent
   const notificationService = createNotificationService(this.db);
   await notificationService.createNotification({...});
   ```

---

## Testing

### Test Internal Notifications

Run the test script:
```powershell
.\test-internal-notifications.ps1
```

Or manually test endpoints:

**Workflow Notification:**
```bash
curl -X POST http://localhost:8787/test-internal-notifications/workflow
```

**System Alert:**
```bash
curl -X POST http://localhost:8787/test-internal-notifications/system-alert
```

**Custom Notification:**
```bash
curl -X POST http://localhost:8787/test-internal-notifications/custom \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test",
    "body": "Test notification",
    "userId": "test-user-123",
    "priority": "high"
  }'
```

---

## Best Practices

### ✅ DO:
- Use descriptive subjects and bodies
- Set appropriate priority levels
- Add relevant tags for filtering
- Include useful metadata
- Notify on important user-facing events
- Batch notifications when possible

### ❌ DON'T:
- Spam users with trivial notifications
- Create notifications for every minor event
- Use high priority for routine updates
- Forget to handle errors when creating notifications
- Block critical operations waiting for notification creation

---

## Production Considerations

1. **Remove Test Endpoints**
   ```typescript
   // Remove this line from main.ts in production:
   .route('/test-internal-notifications', testInternalNotificationsRouter)
   ```

2. **Error Handling**
   ```typescript
   try {
     await notificationService.createNotification({...});
   } catch (error) {
     // Log but don't block operation
     console.error('Failed to create notification:', error);
   }
   ```

3. **Performance**
   - Don't await notification creation if it's not critical
   - Use bulk operations for multiple notifications
   - Consider queueing for large batches

4. **User Preferences**
   - Eventually add user notification preferences
   - Allow users to mute certain notification types
   - Respect user-defined quiet hours

---

## Architecture

```
Application Event
       ↓
NotificationService.createNotification()
       ↓
D1 Database (notifications table)
       ↓
UI Auto-Refresh (30 seconds)
       ↓
User sees notification in:
  - /notifications page
  - Bottom bar overlay
  - Badge count
```

---

## Next Steps

1. ✅ Test internal notifications with `test-internal-notifications.ps1`
2. ✅ Add notification calls to your workflows
3. ✅ Add notifications to background jobs
4. ✅ Set up error notifications
5. ✅ Remove test endpoints in production
6. ⏳ Add user notification preferences (future)
7. ⏳ Add email digest for notifications (future)
