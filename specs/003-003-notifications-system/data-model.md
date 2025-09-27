# Data Model: In-App Notifications System

**Feature**: 003-003-notifications-system  
**Date**: 2025-09-26 | **Updated**: 2025-09-27  
**Phase**: 1 - Design & Contracts | **Implementation**: Schema Complete ✅

## 🚀 Implementation Status (2025-09-27)

**Database Schema**: ✅ COMPLETE (`apps/server/src/db/schema/notifications.ts`)  
**TypeScript Types**: ✅ COMPLETE (`apps/mail/types/notifications.ts`)  
**UI Data Structures**: ✅ COMPLETE (All components use matching interfaces)  
**Backend Models**: ⏳ PENDING (T021-T023)  

The data model has been fully implemented in the UI layer with mock data that matches the schema specification. All components are ready for backend API integration.

## Entity Definitions

### Notification
**Purpose**: Core entity representing a single notification message

**Attributes**:
- `id` (string, PRIMARY KEY): UUID v4 for unique identification and URL routing
- `user_id` (string, FOREIGN KEY): References the user who receives this notification
- `subject` (string, required): Brief notification title (max 200 characters)
- `body` (string, required): Detailed notification content (max 2000 characters)  
- `tags` (string[], required): Array of categorization tags (e.g., ["System", "N8N", "Events"])
- `source` (string, required): Origin of notification ("internal" | "api")
- `api_key_id` (string, nullable): Reference to API key used for external notifications
- `read_status` (boolean, default false): Whether user has viewed the notification
- `created_at` (timestamp, default now()): When notification was created
- `updated_at` (timestamp, default now()): Last modification timestamp

**Relationships**:
- Belongs to User (many-to-one)
- Belongs to ApiKey (many-to-one, nullable for internal notifications)

**Validation Rules**:
- Subject must not be empty, max 200 characters
- Body must not be empty, max 2000 characters  
- Tags array must contain at least one valid tag
- UUID must be valid v4 format
- Created_at cannot be in the future

**State Transitions**:
- Created → Read (when user views notification)
- Read → Updated (when user re-reads or marks unread)
- Any → Deleted (after 30-day retention period)

### ApiKey
**Purpose**: Secure authentication tokens for external applications

**Attributes**:
- `id` (string, PRIMARY KEY): UUID v4 for internal reference
- `user_id` (string, FOREIGN KEY): Owner of this API key
- `name` (string, required): User-friendly name for the key (e.g., "N8N Integration")
- `key_hash` (string, required): SHA-256 hash of the actual API key
- `key_prefix` (string, required): First 8 characters for identification (e.g., "zn_12345678")
- `permissions` (string[], default ["notifications:create"]): Scoped permissions
- `last_used_at` (timestamp, nullable): When key was last used
- `created_at` (timestamp, default now()): When key was generated
- `expires_at` (timestamp, nullable): Optional expiration date
- `is_active` (boolean, default true): Whether key is enabled

**Relationships**:
- Belongs to User (many-to-one)
- Has many Notifications (one-to-many)

**Validation Rules**:
- Name must be unique per user, max 50 characters
- Key_hash must be 64 characters (SHA-256)
- Key_prefix must be 8 characters starting with "zn_"
- Permissions must be from allowed set
- Expires_at must be in the future if set

**State Transitions**:
- Created → Active (default state)
- Active → Disabled (user deactivation)
- Active/Disabled → Expired (automatic expiration)
- Any → Deleted (user deletion, cascade to notifications)

### Tag
**Purpose**: Predefined categorization system for notifications

**Attributes**:
- `id` (string, PRIMARY KEY): UUID v4 for reference
- `name` (string, unique): Tag name (e.g., "System", "N8N", "Events")
- `color` (string): Hex color code for UI display
- `description` (string): Human-readable description
- `is_system` (boolean, default false): Whether tag is system-defined
- `created_at` (timestamp, default now()): When tag was created

**Predefined System Tags**:
- System (#6B7280): Internal Zero OS notifications
- N8N (#FF6B35): Notifications from N8N workflows  
- Events (#10B981): Event-related notifications
- External (#8B5CF6): Other external integrations
- Alert (#EF4444): High-priority notifications

**Validation Rules**:
- Name must be unique, 1-30 characters, alphanumeric + spaces
- Color must be valid hex code
- System tags cannot be modified by users
- Description max 100 characters

### User (Reference Only)
**Purpose**: Existing Zero OS user entity - notifications extend this

**Extended Relationships**:
- Has many Notifications (one-to-many)
- Has many ApiKeys (one-to-many)

**No schema changes required** - leverages existing user system

## Database Schema (Drizzle ORM)

```typescript
// schema/notifications.ts
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(), 
  tags: text('tags').array().notNull(),
  source: text('source').notNull(), // 'internal' | 'api'
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id),
  readStatus: boolean('read_status').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userCreatedIdx: index('notifications_user_created_idx').on(table.userId, table.createdAt.desc()),
  uuidIdx: uniqueIndex('notifications_uuid_idx').on(table.id),
}));

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  permissions: text('permissions').array().default(['notifications:create']),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
}, (table) => ({
  userNameIdx: uniqueIndex('api_keys_user_name_idx').on(table.userId, table.name),
  keyPrefixIdx: index('api_keys_prefix_idx').on(table.keyPrefix),
}));

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  color: text('color').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Data Access Patterns

### Query Optimization
- **Recent notifications**: Composite index on (user_id, created_at DESC) for overlay queries
- **UUID lookup**: Unique index on notification id for direct access
- **API key validation**: Index on key_prefix for fast authentication
- **Tag filtering**: Array operations on tags field with GIN index

### Retention Management  
- **Auto-cleanup**: Database trigger to delete notifications older than 30 days
- **Soft deletion**: Mark as deleted first, hard delete after 7 days for recovery
- **Batch processing**: Cleanup runs daily at low-traffic hours

### Performance Considerations
- **Pagination**: Cursor-based using created_at timestamp
- **Caching**: Redis cache for frequently accessed notifications
- **Bulk operations**: Batch inserts for high-volume external sources

---

*Data model complete - ready for contract generation*