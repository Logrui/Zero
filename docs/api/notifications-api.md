# Zero OS Notifications System - API Documentation

## Overview

The Zero OS Notifications System provides a comprehensive solution for managing notifications across multiple channels including system notifications, email, push notifications, and SMS. This API allows you to create, retrieve, update, and delete notifications programmatically.

## Base URL

```
Production: https://api.zero-os.com
Development: http://localhost:3000
```

## Authentication

All API requests require authentication using API keys. Include your API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Creating API Keys

API keys can be created through the notifications management interface or via the API keys endpoint.

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Standard Tier**: 1000 requests per hour per API key
- **Premium Tier**: 10000 requests per hour per API key
- **Enterprise Tier**: Custom limits

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when window resets

## Endpoints

### Notifications

#### Create Notification

Create a new notification.

**Endpoint**: `POST /api/notifications`

**Request Body**:
```json
{
  "title": "Notification Title",
  "message": "Notification message content",
  "type": "info|success|warning|error",
  "priority": "low|medium|high|urgent",
  "channel": "system|email|push|sms",
  "tags": ["tag1", "tag2"],
  "metadata": {
    "customField": "value"
  },
  "scheduledAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-31T23:59:59Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "notif_1234567890",
    "title": "Notification Title",
    "message": "Notification message content",
    "type": "info",
    "priority": "medium",
    "channel": "system",
    "status": "pending",
    "tags": ["tag1", "tag2"],
    "metadata": {
      "customField": "value"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "scheduledAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-01-31T23:59:59Z"
  }
}
```

#### Get Notifications

Retrieve a paginated list of notifications.

**Endpoint**: `GET /api/notifications`

**Query Parameters**:
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `type` (string): Filter by notification type
- `status` (string): Filter by status (`pending`, `sent`, `delivered`, `failed`)
- `priority` (string): Filter by priority level
- `channel` (string): Filter by delivery channel
- `tags` (string): Comma-separated list of tags to filter by
- `search` (string): Search in title and message
- `sortBy` (string): Sort field (`createdAt`, `updatedAt`, `priority`)
- `sortOrder` (string): Sort order (`asc`, `desc`)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_1234567890",
      "title": "Notification Title",
      "message": "Notification message content",
      "type": "info",
      "priority": "medium",
      "channel": "system",
      "status": "sent",
      "tags": ["tag1", "tag2"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Notification by ID

Retrieve a specific notification by its ID.

**Endpoint**: `GET /api/notifications/{id}`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "notif_1234567890",
    "title": "Notification Title",
    "message": "Notification message content",
    "type": "info",
    "priority": "medium",
    "channel": "system",
    "status": "sent",
    "tags": ["tag1", "tag2"],
    "metadata": {
      "customField": "value"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "deliveryDetails": {
      "attempts": 1,
      "lastAttempt": "2024-01-01T00:01:00Z",
      "deliveredAt": "2024-01-01T00:01:30Z"
    }
  }
}
```

#### Update Notification

Update an existing notification.

**Endpoint**: `PATCH /api/notifications/{id}`

**Request Body**:
```json
{
  "title": "Updated Title",
  "priority": "high",
  "tags": ["updated", "tag"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "notif_1234567890",
    "title": "Updated Title",
    "message": "Original message content",
    "type": "info",
    "priority": "high",
    "channel": "system",
    "status": "pending",
    "tags": ["updated", "tag"],
    "updatedAt": "2024-01-01T01:00:00Z"
  }
}
```

#### Delete Notification

Delete a notification.

**Endpoint**: `DELETE /api/notifications/{id}`

**Response**:
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### API Key Management

#### Create API Key

Create a new API key for authentication.

**Endpoint**: `POST /api/notifications/keys`

**Request Body**:
```json
{
  "name": "API Key Name",
  "permissions": ["notifications:create", "notifications:read", "notifications:update"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "key_1234567890",
    "key": "zr_live_1234567890abcdef...",
    "name": "API Key Name",
    "permissions": ["notifications:create", "notifications:read", "notifications:update"],
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### List API Keys

Retrieve all API keys for the authenticated account.

**Endpoint**: `GET /api/notifications/keys`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "key_1234567890",
      "name": "API Key Name",
      "permissions": ["notifications:create", "notifications:read"],
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "lastUsed": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Delete API Key

Revoke an API key.

**Endpoint**: `DELETE /api/notifications/keys/{id}`

**Response**:
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

### Batch Operations

#### Bulk Create Notifications

Create multiple notifications in a single request.

**Endpoint**: `POST /api/notifications/batch`

**Request Body**:
```json
{
  "notifications": [
    {
      "title": "Notification 1",
      "message": "Message 1",
      "type": "info"
    },
    {
      "title": "Notification 2", 
      "message": "Message 2",
      "type": "success"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "id": "notif_1234567890",
        "title": "Notification 1",
        "status": "created"
      },
      {
        "id": "notif_1234567891",
        "title": "Notification 2",
        "status": "created"
      }
    ],
    "failed": []
  }
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": {
      "title": ["Title is required"],
      "message": ["Message must be at least 10 characters"]
    }
  },
  "requestId": "req_1234567890"
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` (401): Missing or invalid API key
- `AUTHORIZATION_FAILED` (403): Insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request data
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Data Types

### Notification Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique notification identifier |
| `title` | string | Notification title (required, max 255 chars) |
| `message` | string | Notification content (required, max 2000 chars) |
| `type` | enum | Type: `info`, `success`, `warning`, `error` |
| `priority` | enum | Priority: `low`, `medium`, `high`, `urgent` |
| `channel` | enum | Delivery channel: `system`, `email`, `push`, `sms` |
| `status` | enum | Status: `pending`, `processing`, `sent`, `delivered`, `failed` |
| `tags` | array | Array of strings for categorization |
| `metadata` | object | Custom key-value pairs |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |
| `scheduledAt` | string | Optional scheduled delivery time |
| `expiresAt` | string | Optional expiration time |

### API Key Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique API key identifier |
| `key` | string | The actual API key (only shown on creation) |
| `name` | string | Human-readable name |
| `permissions` | array | Array of permission strings |
| `createdAt` | string | ISO 8601 timestamp |
| `expiresAt` | string | Optional expiration time |
| `lastUsed` | string | Last usage timestamp |

## Webhook Integration

Configure webhooks to receive real-time notifications about delivery events.

### Webhook Events

- `notification.created`: New notification created
- `notification.sent`: Notification sent to delivery channel
- `notification.delivered`: Notification successfully delivered
- `notification.failed`: Notification delivery failed
- `notification.expired`: Notification expired before delivery

### Webhook Payload

```json
{
  "event": "notification.delivered",
  "data": {
    "notification": {
      "id": "notif_1234567890",
      "title": "Test Notification",
      "status": "delivered"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "webhook": {
    "id": "webhook_1234567890",
    "url": "https://your-app.com/webhooks"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```javascript
const ZeroNotifications = require('@zero-os/notifications');

const client = new ZeroNotifications({
  apiKey: 'your_api_key_here',
  baseUrl: 'https://api.zero-os.com'
});

// Create notification
const notification = await client.notifications.create({
  title: 'Welcome!',
  message: 'Thanks for signing up',
  type: 'success',
  channel: 'email'
});

// List notifications
const notifications = await client.notifications.list({
  page: 1,
  limit: 20,
  type: 'success'
});
```

### Python

```python
from zero_notifications import ZeroNotificationsClient

client = ZeroNotificationsClient(
    api_key='your_api_key_here',
    base_url='https://api.zero-os.com'
)

# Create notification
notification = client.notifications.create({
    'title': 'Welcome!',
    'message': 'Thanks for signing up',
    'type': 'success',
    'channel': 'email'
})

# List notifications
notifications = client.notifications.list(
    page=1,
    limit=20,
    type='success'
)
```

### cURL Examples

```bash
# Create notification
curl -X POST https://api.zero-os.com/api/notifications \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test message",
    "type": "info"
  }'

# Get notifications
curl -X GET "https://api.zero-os.com/api/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Performance Considerations

- Use pagination for large result sets
- Implement proper caching for frequently accessed data
- Use batch operations for multiple notifications
- Configure appropriate rate limits for your use case
- Monitor API usage through the dashboard

## Security

- Store API keys securely and never expose them in client-side code
- Use HTTPS for all API requests
- Implement proper input validation and sanitization
- Regularly rotate API keys
- Monitor API usage for unusual patterns

## Support

For technical support and questions:
- Documentation: https://docs.zero-os.com/notifications
- Support Email: support@zero-os.com
- Community Forum: https://community.zero-os.com
- Status Page: https://status.zero-os.com