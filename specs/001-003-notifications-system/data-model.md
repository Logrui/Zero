# Data Model: Notifications System

*Constitutional Compliance: Radical Modularity + Fork Stewardship*

## Modular Design Principles
- **Independent Schema**: Notifications tables isolated from core Zero mail schema
- **Loose Coupling**: Foreign keys to existing users table, but notifications module self-contained
- **Upstream Compatible**: Schema additions don't modify existing Zero tables
- **Testable Isolation**: Each entity can be tested independently of Zero core functionality

## Entity Definitions

### Notification
Represents a single notification in the system with UUID-based routing support.

**Table**: `notifications`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier for navigation and tracking |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to user who owns notification |
| subject | VARCHAR(255) | NOT NULL | Notification title/subject line (displayed in overlay) |
| body | TEXT | NOT NULL | Main notification content (one line shown in overlay preview) |
| read_status | BOOLEAN | NOT NULL, DEFAULT false | Whether user has read the notification |
| source | VARCHAR(50) | NOT NULL | Source of notification (internal, api, n8n, etc.) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When notification was created (for overlay sorting) |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When notification was last modified |

**Relationships**:
- Belongs to User (user_id → users.id)
- Has many Tags through NotificationTag

**Indexes**:
- `idx_notifications_user_created` on (user_id, created_at DESC) for dashboard queries
- `idx_notifications_source` on (source) for analytics

### Tag
Represents a categorization label for notifications.

**Table**: `tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Tag name (e.g., "System", "N8N", "Events") |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When tag was first created |

**Relationships**:
- Has many Notifications through NotificationTag

**Indexes**:
- `idx_tags_name` on (name) for quick lookups

### NotificationTag
Junction table for many-to-many relationship between notifications and tags.

**Table**: `notification_tags`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| notification_id | UUID | NOT NULL, FOREIGN KEY | Reference to notification |
| tag_id | UUID | NOT NULL, FOREIGN KEY | Reference to tag |

**Constraints**:
- PRIMARY KEY (notification_id, tag_id)
- FOREIGN KEY notification_id REFERENCES notifications(id) ON DELETE CASCADE
- FOREIGN KEY tag_id REFERENCES tags(id) ON DELETE CASCADE

**Indexes**:
- `idx_notification_tags_notification` on (notification_id)
- `idx_notification_tags_tag` on (tag_id)

### APIKey
Stores user-generated API keys for external integrations.

**Table**: `api_keys`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY | Reference to user who owns the key |
| name | VARCHAR(100) | NOT NULL | User-friendly name for the key |
| key_hash | VARCHAR(255) | NOT NULL, UNIQUE | Hashed version of the API key |
| last_used_at | TIMESTAMP | NULL | When key was last used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When key was created |
| revoked_at | TIMESTAMP | NULL | When key was revoked (NULL if active) |

**Relationships**:
- Belongs to User (user_id → users.id)

**Indexes**:
- `idx_api_keys_user` on (user_id)
- `idx_api_keys_hash` on (key_hash) for authentication lookups
- `idx_api_keys_active` on (user_id) WHERE revoked_at IS NULL

## Database Schema Migration

```sql
-- Create tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    read_status BOOLEAN NOT NULL DEFAULT false,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create notification_tags junction table
CREATE TABLE notification_tags (
    notification_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    PRIMARY KEY (notification_id, tag_id),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Create api_keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_source ON notifications (source);
CREATE INDEX idx_tags_name ON tags (name);
CREATE INDEX idx_notification_tags_notification ON notification_tags (notification_id);
CREATE INDEX idx_notification_tags_tag ON notification_tags (tag_id);
CREATE INDEX idx_api_keys_user ON api_keys (user_id);
CREATE INDEX idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_active ON api_keys (user_id) WHERE revoked_at IS NULL;

-- Insert default tags
INSERT INTO tags (name) VALUES 
    ('System'),
    ('N8N'),
    ('Events'),
    ('External Integration'),
    ('Automation');
```

## Validation Rules

### Notification Validation
- Subject: 1-255 characters, no HTML tags
- Body: 1-10000 characters, allow limited HTML tags (p, br, strong, em)
- Source: Must be one of: internal, api, n8n, system, calendar, email
- Tags: At least 1 tag, maximum 10 tags per notification

### Tag Validation
- Name: 1-50 characters, alphanumeric + spaces + hyphens only
- Must be unique (case insensitive)
- Cannot start or end with whitespace

### API Key Validation
- Name: 1-100 characters, any printable characters
- Generated key: 32 characters, cryptographically secure random
- Hash: SHA-256 with salt
- User can have maximum 10 active API keys

## Business Logic

### Notification Lifecycle
1. **Creation**: Notification created with required fields and tags
2. **Storage**: Persisted to database with timestamps
3. **Display**: Retrieved for dashboard with pagination and filtering
4. **Reading**: read_status updated when user views notification
5. **Deletion**: Hard delete from database (cascade to junction table)

### Tag Management
- Tags are created on-demand when first used
- Unused tags are retained for consistency
- Tag names are case-insensitive for matching, case-preserving for display

### API Key Lifecycle
1. **Generation**: User creates named key, system generates secure random string
2. **Storage**: Only hashed version stored, plain text shown once to user
3. **Authentication**: Incoming requests validated against hash
4. **Usage Tracking**: last_used_at updated on successful authentication
5. **Revocation**: revoked_at set, key becomes invalid