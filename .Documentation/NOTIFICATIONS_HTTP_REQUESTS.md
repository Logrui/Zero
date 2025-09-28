# Notifications System HTTP API Guide

**Document Version**: 1.0  
**Last Updated**: September 27, 2025  
**Feature**: 003-003-notifications-system  
**Status**: Production Ready

## Overview

This document provides comprehensive guidance for integrating external systems (N8N, Zapier, custom webhooks) with Zero OS's notification system via HTTP API requests.

## Quick Reference

| Aspect | Value |
|--------|-------|
| **Endpoint** | `POST /api/notifications` |
| **Authentication** | API Key (Header: `X-API-Key` or `Authorization: Bearer`) |
| **Rate Limit** | 100 requests/minute per API key |
| **Content-Type** | `application/json` |
| **API Key Format** | `zro_` prefix + alphanumeric characters |

## API Endpoint Configuration

### Base URL
```
Production:  https://api.zero.dev/api/notifications
Development: http://localhost:3501/api/notifications
```

### HTTP Method
```
POST
```

### Required Headers

**Option 1: X-API-Key Header (Recommended)**
```http
X-API-Key: zro_your_api_key_here_abcdef123456
Content-Type: application/json
```

**Option 2: Authorization Header**
```http
Authorization: Bearer zro_your_api_key_here_abcdef123456
Content-Type: application/json
```

## Request Body Schema

### JSON Structure
```json
{
  "subject": "string (1-200 chars, required)",
  "body": "string (1-2000 chars, required)", 
  "tags": ["array", "of", "strings", "1-10 items"],
  "priority": "low|medium|high (optional, defaults to medium)"
}
```

### Field Validation Rules

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `subject` | string | ✅ | 1-200 characters | Notification title/summary |
| `body` | string | ✅ | 1-2000 characters | Detailed notification content |
| `tags` | array | ✅ | 1-10 strings, max 30 chars each | Categorization labels |
| `priority` | string | ❌ | "low", "medium", "high" | Urgency level (default: "medium") |

## Example HTTP Requests

### 1. Basic N8N Workflow Notification
```http
POST /api/notifications HTTP/1.1
Host: localhost:3501
X-API-Key: zro_your_api_key_here_abcdef123456
Content-Type: application/json

{
  "subject": "N8N Workflow Completed Successfully",
  "body": "Your email processing workflow has finished processing 15 new emails from the inbox. All emails were categorized and forwarded to the appropriate departments.",
  "tags": ["N8N", "Email Processing", "Automation", "Success"]
}
```

### 2. Error Alert Notification (High Priority)
```http
POST /api/notifications HTTP/1.1
Host: localhost:3501
X-API-Key: zro_your_api_key_here_abcdef123456
Content-Type: application/json

{
  "subject": "N8N Workflow Error - Data Sync Failed", 
  "body": "The daily data synchronization workflow encountered an error: API rate limit exceeded on the CRM integration. Please check the logs and retry the sync process.",
  "tags": ["N8N", "Error", "Data Sync", "CRM", "API"],
  "priority": "high"
}
```

### 3. Lead Generation Notification
```http
POST /api/notifications HTTP/1.1
Host: localhost:3501
X-API-Key: zro_your_api_key_here_abcdef123456
Content-Type: application/json

{
  "subject": "New Lead Generated from Website Form",
  "body": "A new potential customer john.doe@example.com has submitted the contact form on the website. Lead score: 85/100. Company: Tech Solutions Inc. Interest: Enterprise package.",
  "tags": ["N8N", "Lead Generation", "Website", "Sales", "High Value"],
  "priority": "medium"
}
```

### 4. System Monitoring Alert
```http
POST /api/notifications HTTP/1.1
Host: localhost:3501
X-API-Key: zro_your_api_key_here_abcdef123456
Content-Type: application/json

{
  "subject": "Server CPU Usage Alert",
  "body": "Server monitoring detected CPU usage above 85% for the past 10 minutes. Current usage: 92%. Consider scaling resources or investigating high-load processes.",
  "tags": ["Monitoring", "System", "Performance", "CPU"],
  "priority": "high"
}
```

## N8N Integration Configuration

### HTTP Request Node Setup

```yaml
HTTP Request Node Settings:
  Method: POST
  URL: http://localhost:3501/api/notifications
  Authentication: None (use custom headers)
  
Headers:
  - Name: X-API-Key
    Value: zro_your_api_key_here
  - Name: Content-Type  
    Value: application/json
    
Body Configuration:
  Content Type: JSON
  Body Content: |
    {
      "subject": "{{ $json.workflowName }} - {{ $json.status }}",
      "body": "{{ $json.description || 'Workflow executed successfully' }}",
      "tags": ["N8N", "{{ $json.category }}", "{{ $json.environment }}"],
      "priority": "{{ $json.priority || 'medium' }}"
    }
```

### Dynamic N8N Variables
```javascript
// In N8N expressions:
{
  "subject": "{{ $('Trigger').item.json.eventType }} - {{ new Date().toISOString() }}",
  "body": "Event processed: {{ $('Process Data').item.json.result }}. Items affected: {{ $('Process Data').item.json.count }}",
  "tags": ["N8N", "{{ $('Trigger').item.json.source }}", "Automated"],
  "priority": "{{ $('Trigger').item.json.urgent ? 'high' : 'medium' }}"
}
```

## API Responses

### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "d3d4b6c7-31a8-44e2-8b6b-3a5e8f2c1d9b",
    "subject": "N8N Workflow Completed Successfully",
    "createdAt": "2025-09-27T10:30:00Z",
    "priority": "medium"
  }
}
```

### Validation Error (400 Bad Request)
```json
{
  "error": "Validation error",
  "details": [
    "subject: Subject is required",
    "tags: At least one tag required",
    "body: Body cannot exceed 2000 characters"
  ]
}
```

### Authentication Error (401 Unauthorized)
```json
{
  "error": "Invalid or missing API key"
}
```

### Rate Limit Error (429 Too Many Requests)
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### Server Error (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## API Key Management

### Key Format
All API keys must follow this format:
```
zro_[alphanumeric_string]
```

**Examples:**
- Development: `zro_mock_development_key_12345`
- Production: `zro_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Obtaining API Keys
1. Navigate to `/notifications/settings` in Zero OS
2. Click "Create API Key" 
3. Provide a descriptive name (e.g., "N8N Production Workflows")
4. Copy the generated key immediately (it won't be shown again)
5. Store securely in your N8N environment variables

### Security Best Practices
- ✅ Store API keys in environment variables, not in workflow code
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly (recommended: every 90 days)
- ✅ Revoke unused or compromised keys immediately
- ❌ Never commit API keys to version control
- ❌ Don't share keys between different services

## Rate Limiting

### Limits
- **Rate**: 100 requests per minute per API key
- **Window**: Rolling 60-second window
- **Scope**: Per API key (not per IP)

### Handling Rate Limits
```javascript
// N8N retry logic example
if (response.status === 429) {
  const retryAfter = response.headers['retry-after'] || 60;
  // Wait and retry
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry the request
}
```

## Error Handling & Troubleshooting

### Common Issues

#### 1. "Invalid or missing API key"
**Cause**: API key not provided or incorrect format
**Solution**: 
- Verify API key starts with `zro_`
- Check header name is exactly `X-API-Key`
- Ensure no extra spaces or characters

#### 2. "Validation error" 
**Cause**: Request body doesn't match schema
**Solution**:
- Verify all required fields are present
- Check character limits (subject: 200, body: 2000)
- Ensure tags array has 1-10 items

#### 3. "Rate limit exceeded"
**Cause**: Too many requests in 60-second window
**Solution**:
- Implement exponential backoff
- Reduce request frequency
- Use multiple API keys if needed

### Testing Your Integration

#### cURL Test Command
```bash
curl -X POST http://localhost:3501/api/notifications \
  -H "X-API-Key: zro_mock_development_key_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Notification",
    "body": "This is a test from cURL",
    "tags": ["Test", "API", "Integration"]
  }'
```

#### Postman Collection
```json
{
  "name": "Zero Notifications API",
  "requests": [{
    "name": "Create Notification",
    "method": "POST",
    "url": "{{base_url}}/api/notifications",
    "headers": {
      "X-API-Key": "{{api_key}}",
      "Content-Type": "application/json"
    },
    "body": {
      "subject": "{{subject}}",
      "body": "{{body}}",
      "tags": ["{{tag1}}", "{{tag2}}"],
      "priority": "{{priority}}"
    }
  }]
}
```

## Integration Patterns

### Pattern 1: Workflow Status Updates
```json
{
  "subject": "{{ workflow_name }} - {{ status }}",
  "body": "Workflow {{ workflow_name }} {{ status }} at {{ timestamp }}. Duration: {{ duration }}ms. {{ error_message }}",
  "tags": ["N8N", "Workflow", "{{ environment }}", "{{ status }}"],
  "priority": "{{ status === 'failed' ? 'high' : 'medium' }}"
}
```

### Pattern 2: Data Processing Events
```json
{
  "subject": "{{ data_type }} Processing Complete",
  "body": "Processed {{ count }} {{ data_type }} records. Success: {{ success_count }}, Errors: {{ error_count }}. Next run: {{ next_run }}",
  "tags": ["Data Processing", "{{ data_type }}", "Batch", "{{ source_system }}"],
  "priority": "{{ error_count > 0 ? 'high' : 'low' }}"
}
```

### Pattern 3: External System Alerts
```json
{
  "subject": "{{ system_name }} Alert - {{ alert_type }}",
  "body": "{{ system_name }} reported {{ alert_type }}: {{ message }}. Severity: {{ severity }}. Action required: {{ action_required }}",
  "tags": ["Alert", "{{ system_name }}", "{{ alert_type }}", "External"],
  "priority": "{{ severity === 'critical' ? 'high' : 'medium' }}"
}
```

## Related Documentation

- **API Specification**: `specs/003-003-notifications-system/contracts/api-spec.yaml`
- **Implementation Guide**: `specs/003-003-notifications-system/plan.md`
- **Integration Strategy**: `.Documentation/NOTIFICATIONS_INTEGRATION_PLAN.md`
- **Authentication System**: `apps/mail/lib/api-auth.ts`

## Support & Maintenance

### Monitoring
- API key usage statistics available in `/notifications/settings`
- Rate limit monitoring via API response headers
- Error tracking through application logs

### Updates
- This document follows the notification system versioning
- Check git commits for `003-003-notifications-system` branch for updates
- Breaking changes will be documented with migration guides

---

**Note**: This API is designed for server-to-server communication. For browser-based integrations, use the session-based endpoints with proper CORS configuration.