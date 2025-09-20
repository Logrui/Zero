# Email Synchronization Architecture

This document outlines the end-to-end email synchronization process in the Zero email application, including the refresh functionality.

## Overview
The email synchronization system is built on a robust, distributed architecture using Cloudflare Workers and Durable Objects. It's designed to be scalable, fault-tolerant, and efficient in handling large volumes of email data. The system provides both automatic and manual refresh capabilities to ensure email data is up-to-date.

## Key Components

### 1. Sync Initiation

#### Triggers
- **User Login**: Automatically checks for sync needs on session initialization
- **Manual Refresh**: User clicks the refresh button in the UI
- **Scheduled**: Periodic background syncs, which are triggered by Cloudflare's cron triggers.
- **Real-Time Push Notifications**: The system uses Google Pub/Sub to receive real-time updates. When a change occurs in a user's mailbox, Google sends a push notification to the `/a8n/notify/:providerId` endpoint in `apps/server/src/main.ts` (lines 749-818). This triggers a sync for the specific changes, rather than a full mailbox scan.
#### Entry Points
- `apps/server/src/trpc/routes/auth.ts` - Handles initial sync triggers
- `apps/server/src/lib/auth.ts` - The `onSignIn` and `onSignUp` callbacks (lines 244-253) trigger the initial sync for new accounts.
- `apps/server/src/main.ts` - Processes sync jobs from the queue
- `apps/mail/components/mail/mail.tsx` - Contains the refresh button UI and handler

### 2. Workflow Architecture

#### SyncThreadsCoordinatorWorkflow
Location: `apps/server/src/workflows/sync-threads-coordinator-workflow.ts`
- Manages the high-level sync process for a single folder
- Handles pagination of email threads
- Coordinates multiple SyncThreadsWorkflow instances

#### SyncThreadsWorkflow
Location: `apps/server/src/workflows/sync-threads-workflow.ts`
- Processes individual pages of email threads
- Manages thread retrieval and processing
- Handles error conditions and retries

### 3. Data Flow

1. **Initialization**
   - User action triggers sync
   - System creates sync job in BullMQ queue
   - Main process picks up job and initiates coordinator workflow

2. **Pagination**
   - Coordinator fetches pages of thread metadata
   - Each page is processed by a separate workflow instance
   - Next page tokens manage pagination state

3. **Thread Processing**
   - Individual threads are fetched by THREAD_SYNC_WORKER
   - Full message data, labels, and attachments are retrieved
   - Data is normalized and stored in the database

4. **Completion**
   - Frontend is notified of updates
   - Sync status is updated
   - Error conditions are logged and reported

### 4. Database Integration

- Uses Drizzle ORM for database interactions
- Threads and messages are stored in normalized tables
- Labels and metadata are associated with threads

### 5. Error Handling

- Individual thread processing failures don't block entire sync
- Failed syncs are logged and can be retried
- System maintains state to avoid reprocessing successful operations

## Performance Considerations

- Batch processing of threads for efficiency
- Parallel processing of independent operations
- Caching of frequently accessed data
- Incremental syncs using history tokens

## Monitoring and Logging

- Detailed logging at each workflow step
- Performance metrics collection
- Error tracking and alerting

## Refresh Button Implementation

The refresh button is located in the main mail interface and provides users with manual control over email synchronization.

### Location
- **Component**: `apps/mail/components/mail/mail.tsx` (MailLayout component)
- **UI Position**: Top-right corner of the mail list header
- **Visibility**: Always visible when viewing the mail list

### Behavior
1. When clicked, it triggers a refetch of the current thread list
2. The button shows a loading state while the refresh is in progress
3. It uses the same underlying refresh mechanism as automatic syncs

### Technical Details
- **Button Component**: Uses the `RefreshCcw` icon from Lucide
- **State Management**: Integrates with the `useThreads` hook's `refetch` function
- **Loading State**: Shows a loading spinner during the refresh operation

## Detailed Sync Mechanisms

### Real-Time Sync via Google Pub/Sub

The primary mechanism for keeping email data up-to-date is a real-time push notification system powered by Google Pub/Sub. This is far more efficient than traditional cron-based polling, as it only triggers a sync when there's an actual change in the user's mailbox.

1.  **Endpoint**: The process starts at the `/a8n/notify/:providerId` endpoint in `apps/server/src/main.ts` (lines 749-818). This endpoint is specifically designed to receive push notifications from Google.

    ```typescript
    // apps/server/src/main.ts:749-799
    .post('/a8n/notify/:providerId', async (c) => {
      // ... (verification logic)
      if (providerId === EProviders.google) {
        const body = await c.req.json<{ historyId: string }>();
        // ...
        await env.thread_queue.send({
          providerId,
          historyId: body.historyId,
          subscriptionName: subHeader,
        });
      }
    });
    ```

2.  **Queueing**: Once a valid notification is received, the `historyId` (a marker for the set of changes) is sent to a Cloudflare Queue named `thread_queue`.

3.  **Worker**: The `queue` method in `apps/server/src/main.ts` (lines 941-958) processes messages from this queue. This, in turn, triggers the `SyncThreadsCoordinatorWorkflow`, which performs the actual sync based on the `historyId`.

### Initial Sync on Login

When a new user signs up or connects a new email account, an initial sync is required to populate their mailbox.

1.  **Auth Hooks**: In `apps/server/src/lib/auth.ts`, the `betterAuth` configuration includes `databaseHooks` (lines 244-253). These hooks call the `connectionHandlerHook` function whenever a new account is created or an existing one is updated.

2.  **Connection Handler**: The `connectionHandlerHook` (lines 90-157) is responsible for creating a new connection in the database.

3.  **Queueing the Sync**: After creating the connection, it sends a message to the `subscribe_queue` (lines 151-156).

    ```typescript
    // apps/server/src/lib/auth.ts:151-156
    if (env.GOOGLE_S_ACCOUNT && env.GOOGLE_S_ACCOUNT !== '{}') {
      await env.subscribe_queue.send({
        connectionId: result.id,
        providerId: account.providerId,
      });
    }
    ```

4.  **Enabling the "Brain"**: The `queue` worker in `main.ts` (lines 853-871) processes this message and calls `enableBrainFunction` from `apps/server/src/lib/brain.ts`. This function is responsible for setting up the Google Pub/Sub subscription for the new account and triggering the very first sync.

    ```typescript
    // apps/server/src/lib/brain.ts:9-17
    export const enableBrainFunction = async (connection: { id: string; providerId: EProviders }) => {
      try {
        const subscriptionFactory = getSubscriptionFactory(connection.providerId);
        await subscriptionFactory.subscribe({ body: { connectionId: connection.id } });
      } catch (error) {
        console.error(`Failed to enable brain function: ${error}`);
        await resetConnection(connection.id);
      }
    };
    ```

## Configuration

The email synchronization process is highly configurable through environment variables. These variables allow you to tailor the sync behavior for different environments, such as development and production.

- `THREAD_SYNC_LOOP`: This is a boolean flag (`'true'` or `'false'`) that controls the depth of the sync. 
  - When set to `'true'`, the system will paginate through all available email threads in a folder, performing a complete and thorough sync. 
  - When `'false'` or not set, the sync will only process the first page of threads. This is useful for quick updates or in development environments to reduce processing time and API usage.

- `THREAD_SYNC_MAX_COUNT`: This integer value determines the number of threads to fetch per page during the sync process. The default value is `20`. Adjusting this can help manage API rate limits and control the amount of data processed in a single batch.

### Environment-Specific Behavior

The sync process behaves differently depending on the environment, which is controlled by the `NODE_ENV` environment variable.

- **Production (`NODE_ENV='production'`)**:
  - `THREAD_SYNC_LOOP` is set to `'true'`, ensuring a full and complete sync of the user's mailbox.
  - The welcome email campaign is scheduled, as seen in `apps/server/src/lib/auth.ts` (line 145).

- **Development (`NODE_ENV='development'`)**:
  - `THREAD_SYNC_LOOP` is set to `'false'`, so only the first page of threads is synced. This speeds up local development and reduces API usage.
  - The welcome email campaign is not scheduled.

While not explicitly enforced in the code, the intended configuration for different environments is as follows:

- **Production**: 
  - `THREAD_SYNC_LOOP` should be set to `'true'` to ensure a comprehensive sync of the user's mailbox.
  - `THREAD_SYNC_MAX_COUNT` can be tuned based on performance and API limits, but the default of `20` is a sensible starting point.

- **Development**:
  - `THREAD_SYNC_LOOP` should be set to `'false'` to speed up local development and testing.
  - `THREAD_SYNC_MAX_COUNT` can be kept at the default or a lower value.

## Future Improvements

- Enhanced conflict resolution
- Better handling of rate limits
- Improved progress reporting
- More granular sync controls
- Visual feedback for last sync time

## Related Documentation

- [API Documentation](./API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Authentication Flow](./AUTHENTICATION.md)
