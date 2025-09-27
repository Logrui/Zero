# Research: In-App Notifications System

*Constitutional Compliance: Zero OS Constitution v1.1.0*

## Constitutional Alignment Analysis

### Fork Stewardship Assessment
- **Upstream Compatibility**: Notifications system uses existing Zero mail infrastructure
- **Documented Divergence**: New AI agent hooks and productivity features clearly separated
- **Minimal Drift**: Leverages existing authentication, UI patterns, and database structure
- **Merge Compatibility**: Changes isolated to new modules, existing files minimally modified

### AI-First Integration Points
- **Agent Context**: Notification content available to Zero AI agent for contextual responses  
- **Workflow Triggers**: Internal notifications can trigger AI workflow automations
- **Smart Categorization**: AI can auto-tag and prioritize notifications based on content
- **Extension Ready**: Clear hooks for future AI features (summarization, smart responses)

## Technology Decisions

### API Authentication Strategy
**Decision**: Use bearer token authentication with user-generated API keys stored as hashed values in PostgreSQL

**Rationale**: 
- Bearer tokens are industry standard for API authentication
- User-generated keys provide flexibility while maintaining security
- Hashing keys in storage protects against database compromises
- Integrates well with existing Zero OS authentication system

**Alternatives considered**:
- JWT tokens: More complex for this use case, requires token refresh logic
- Basic Auth: Less secure for API integrations
- OAuth 2.0: Overkill for simple webhook-style integrations

### Queue Processing System
**Decision**: Use a simple database-backed job queue with periodic processing via Next.js API routes

**Rationale**:
- Leverages existing PostgreSQL infrastructure
- Simpler than external queue systems (Redis, RabbitMQ)
- Can be processed via scheduled API calls or background workers
- Meets "generous rate limiting" requirement from clarifications

**Alternatives considered**:
- Redis Queue: Adds another dependency
- In-memory processing: Doesn't handle high volume or system restarts
- External services (AWS SQS): Increases complexity and costs

### Rate Limiting Implementation
**Decision**: Implement sliding window rate limiting using database timestamps

**Rationale**:
- Database-backed approach works with existing infrastructure
- Sliding window provides fair usage enforcement
- Can be tuned per user or globally
- Integrates with queue system for overflow handling

**Alternatives considered**:
- Fixed window: Less fair, allows burst traffic at window boundaries
- Token bucket: More complex to implement and monitor
- External rate limiting service: Adds latency and complexity

### Tag System Architecture
**Decision**: Use a many-to-many relationship between notifications and tags with a separate tags table

**Rationale**:
- Normalized design prevents tag duplication
- Enables tag management and analytics
- Supports efficient filtering via database joins
- Allows future features like tag descriptions or colors

**Alternatives considered**:
- JSON array in notification table: Less queryable, harder to manage
- Comma-separated values: Poor performance for filtering
- No separate tag entity: Limits future extensibility

## Integration Points

### Existing Zero OS Components
- **User Management**: Leverage existing user authentication and session management
- **Database**: Extend existing PostgreSQL schema with new tables
- **Frontend Routing**: Add `/notifications` route to existing Next.js app
- **UI Components**: Use existing TailwindCSS + Shadcn UI component system

### External Integration Requirements
- **N8N Webhooks**: Accept POST requests with JSON payload containing subject, body, and tags
- **Internal Events**: Hook into existing system events (calendar sync, email processing, etc.)
- **API Documentation**: Provide OpenAPI spec for external integrators

## Constitutional Security Implementation

### Security First Principle Compliance
- **Secure by Default**: API keys required, no public endpoints, least-privilege access
- **Lifecycle Security**: Hash generation, secure storage, audit logging, revocation capability  
- **Input Validation**: XSS prevention, schema validation, rate limiting, payload sanitization
- **Zero Trust Access**: User-scoped data, authenticated sessions, no admin backdoors
- **Fork Security**: No upstream security regressions, documented security boundaries

### User-Centric Security Design  
- **Intuitive Key Management**: Clear UI for API key creation/revocation
- **Transparent Security**: Users understand what keys can access
- **Privacy by Design**: Notifications remain user-private, no cross-user leakage
- **Accessible Security**: Security features don't compromise usability

## Performance Considerations

### Database Optimization
- Index notifications by user_id and created_at for dashboard queries
- Index notification_tags by tag_id for filtering
- Consider pagination for users with large notification counts
- Archive or purge very old notifications if needed

### Frontend Performance
- Implement pagination for notification dashboard
- Use optimistic updates for delete operations
- Cache tag list for filtering dropdown
- Consider real-time updates via WebSocket for active sessions

## Monitoring and Observability

### Metrics to Track
- Notification creation rate (internal vs external)
- API key usage patterns
- Tag distribution and usage
- Dashboard page load times
- Queue processing latency

### Logging Strategy
- Log all API requests with timing and response codes
- Log notification creation with source identification
- Log user actions (delete, filter) for analytics
- Log rate limiting violations for security monitoring