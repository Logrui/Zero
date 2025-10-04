# Data Model: Tasks Page with Google Tasks Integration

## Core Entities

### Task
**Purpose**: Represents a single task item with full Google Tasks compatibility plus ZeroOS extensions

**Fields**:
- `id: string` - Unique identifier (UUID)
- `googleTaskId: string | null` - Google Tasks API ID (null for local-only tasks)
- `title: string` - Task title (required)
- `description: string | null` - Task description
- `status: 'needsAction' | 'completed'` - Completion status
- `due: string | null` - ISO 8601 due date
- `priority: 'low' | 'normal' | 'high'` - Task priority
- `notes: string | null` - Additional notes
- `subtasks: Subtask[]` - Array of subtasks
- `labels: string[]` - Array of label strings
- `created: string` - ISO 8601 creation timestamp
- `updated: string` - ISO 8601 last modification timestamp
- `syncStatus: SyncStatus` - Current synchronization state

**Validation Rules**:
- Title must be non-empty string (1-200 characters)
- Due date must be valid ISO 8601 format if provided
- Priority must be one of the defined enum values
- Created and updated timestamps must be valid ISO 8601

**State Transitions**:
- `draft` → `synced` (when successfully synced to Google Tasks)
- `synced` → `modified` (when local changes made)
- `modified` → `synced` (when changes synced to Google Tasks)
- `modified` → `conflict` (when sync conflict detected)
- `conflict` → `synced` (when conflict resolved)

### Subtask
**Purpose**: Represents a subtask within a parent task

**Fields**:
- `id: string` - Unique identifier
- `title: string` - Subtask title
- `status: 'needsAction' | 'completed'` - Completion status
- `position: number` - Display order

### ZeroOS Task Extension
**Purpose**: Contains ZeroOS-specific fields that are not synced with Google Tasks

**Fields**:
- `taskId: string` - Reference to parent task
- `workspace: string | null` - Associated workspace
- `associatedPeople: string[]` - Array of person IDs
- `associatedCompanies: string[]` - Array of company IDs
- `linkedGmailThreads: string[]` - Array of Gmail thread IDs
- `internalNotes: string | null` - Internal-only notes
- `tags: string[]` - ZeroOS-specific tags

### SyncState
**Purpose**: Tracks synchronization status between local and Google Tasks versions

**Fields**:
- `taskId: string` - Reference to task
- `lastSyncTimestamp: string | null` - Last successful sync time
- `pendingChanges: Change[]` - Queued changes for sync
- `conflictResolution: 'local' | 'remote' | 'pending'` - Conflict resolution strategy
- `retryCount: number` - Number of sync retry attempts
- `lastError: string | null` - Last sync error message

### Change
**Purpose**: Represents a queued change for offline sync

**Fields**:
- `id: string` - Unique change identifier
- `taskId: string` - Reference to task
- `operation: 'create' | 'update' | 'delete'` - Type of change
- `data: Partial<Task>` - Change data
- `timestamp: string` - When change was made
- `retryCount: number` - Number of retry attempts

### UserPermissions
**Purpose**: Manages Google Tasks API permissions and authorization state

**Fields**:
- `userId: string` - User identifier
- `googleAccessToken: string | null` - OAuth access token
- `googleRefreshToken: string | null` - OAuth refresh token
- `tokenExpiry: string | null` - Token expiration time
- `permissions: string[]` - Granted permission scopes
- `lastAuthCheck: string | null` - Last authorization verification

## Relationships

### Task Relationships
- `Task` → `ZeroOS Task Extension` (1:1)
- `Task` → `SyncState` (1:1)
- `Task` → `Subtask[]` (1:many)
- `Task` → `Change[]` (1:many, through SyncState)

### User Relationships
- `User` → `UserPermissions` (1:1)
- `User` → `Task[]` (1:many)

## Data Integrity Rules

1. **Referential Integrity**: All foreign key references must be valid
2. **Temporal Consistency**: Updated timestamp must be >= created timestamp
3. **Sync Consistency**: Local and remote versions must have matching core fields when synced
4. **Conflict Resolution**: Only one version of a task can be authoritative at a time
5. **Offline Integrity**: Queued changes must be valid and complete

## Indexing Strategy

### Primary Indexes
- `tasks.id` (primary key)
- `tasks.googleTaskId` (unique, nullable)
- `tasks.userId` (foreign key)

### Performance Indexes
- `tasks.status` (for filtering completed tasks)
- `tasks.due` (for sorting by due date)
- `tasks.priority` (for sorting by priority)
- `sync_states.lastSyncTimestamp` (for sync operations)
- `changes.timestamp` (for offline queue processing)

## Data Migration Strategy

### Initial Schema
- Create `tasks` table with all core fields
- Create `zeroos_task_extensions` table with extension fields
- Create `sync_states` table for synchronization tracking
- Create `changes` table for offline queue
- Create `user_permissions` table for OAuth state

### Google Tasks Migration
- Fetch existing Google Tasks for each user
- Create local task records with `googleTaskId` populated
- Initialize sync states as `synced`
- Preserve all Google Tasks metadata

### ZeroOS Integration
- Link tasks to existing workspaces
- Associate with people and companies from existing data
- Connect to Gmail threads where applicable
- Maintain backward compatibility with existing systems
