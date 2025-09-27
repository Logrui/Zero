# Research: In-App Notifications System

**Feature**: 003-003-### Performance Considerations

### Async Processing
- **Decision**: Background job queue for notification processing
- **Rationale**: Ensures API responsiveness for external webhooks, handles high-volume scenarios
- **Implementation**: Redis-based queue with retry logic for failed notifications

### Database Indexing
- **Decision**: Composite index on (user_id, created_at) for efficient queries
- **Rationale**: Supports user-scoped queries with timestamp ordering for recent notifications
- **Additional indexes**: user_id for count queries, uuid for direct lookup

### Caching Strategy
- **Decision**: SWR client-side caching with 30-second stale time
- **Rationale**: Balances real-time updates with performance, reduces server load
- **Implementation**: Invalidate cache on new notification creation

### Lazy Loading
- **Decision**: Virtual scrolling for dashboard, pagination for API
- **Rationale**: Handles large notification volumes efficiently, constitutional performance targets
- **Implementation**: React-window for overlay scroll, cursor-based pagination for APIstem  
**Date**: 2025-09-26  
**Phase**: 0 - Outline & Research

## Research Summary

All technical unknowns were resolved during the clarification phase. The following research consolidates the technical decisions for the notifications system implementation.

## Technology Decisions

### Database & ORM
- **Decision**: Drizzle ORM with PostgreSQL
- **Rationale**: Already established in Zero OS monorepo, provides type-safe database access, constitutional modularity compliance, excellent TypeScript integration
- **Alternatives considered**: Prisma (rejected for consistency), raw SQL (rejected for type safety)

### API Framework
- **Decision**: Next.js App Router API routes
- **Rationale**: Integrated with existing Zero OS frontend, serverless deployment ready, built-in middleware support for authentication and rate limiting
- **Alternatives considered**: Express.js (rejected for consistency), tRPC (rejected for external HTTP POST requirements)

### Authentication Strategy
- **Decision**: API key-based authentication with secure token generation
- **Rationale**: Simple for external integrations like N8N, secure when properly implemented, fits HTTP POST webhook patterns
- **Alternatives considered**: OAuth (too complex for webhooks), JWT (unnecessary overhead for API keys)

### Rate Limiting Implementation
- **Decision**: In-memory rate limiting with Redis backup for production
- **Rationale**: 100 requests/minute requirement, supports horizontal scaling, integrates with existing Zero OS infrastructure
- **Alternatives considered**: Database-based (too slow), external service (unnecessary complexity)

### UI Framework Integration
- **Decision**: React components with TailwindCSS, integrated with existing Zero OS component library
- **Rationale**: Consistency with Zero OS design system, reuse existing bottom bar component, constitutional user-centric design
- **Alternatives considered**: Separate UI library (violates modularity), custom CSS (rejected for consistency)

### UUID Generation
- **Decision**: Crypto.randomUUID() for client-side generation, validated server-side
- **Rationale**: Secure, collision-resistant, browser-native support, good for URL routing
- **Alternatives considered**: Database auto-increment (not URL-friendly), nanoid (unnecessary dependency)

### Data Retention Strategy
- **Decision**: Automated cleanup with database trigger after 30 days
- **Rationale**: Balances storage efficiency with user accessibility, aligns with clarification decisions
- **Alternatives considered**: Manual cleanup (maintenance burden), indefinite storage (storage costs)

## Integration Patterns

### Zero OS Component Integration
- **Decision**: Extend existing app-bottombar.tsx component with notification icon
- **Rationale**: Minimal upstream drift, leverages existing UI patterns, constitutional fork stewardship
- **Implementation**: Add notification count badge, overlay trigger, preserve existing functionality

### External API Integration
- **Decision**: Standard REST endpoints with JSON payloads
- **Rationale**: Universal compatibility with N8N and other automation tools, simple debugging
- **Schema**: Zod validation for type safety and clear error messages

### State Management
- **Decision**: React state with SWR for data fetching
- **Rationale**: Already used in Zero OS, provides caching and revalidation, simple for notification data
- **Alternatives considered**: Redux (overkill), Zustand (unnecessary additional state library)

## Performance Considerations

### Database Indexing
- **Decision**: Composite index on (user_id, created_at) for efficient queries
- **Rationale**: Supports user-scoped queries with timestamp ordering for recent notifications
- **Additional indexes**: user_id for count queries, uuid for direct lookup

### Caching Strategy
- **Decision**: SWR client-side caching with 30-second stale time
- **Rationale**: Balances real-time updates with performance, reduces server load
- **Implementation**: Invalidate cache on new notification creation

### Lazy Loading
- **Decision**: Virtual scrolling for dashboard, pagination for API
- **Rationale**: Handles large notification volumes efficiently, constitutional performance targets
- **Implementation**: React-window for overlay scroll, cursor-based pagination for API

## Security Implementation

### API Key Security
- **Decision**: SHA-256 hashed storage, rate limiting per key, scope validation
- **Rationale**: Prevents key exposure, limits abuse, constitutional security-first approach
- **Key format**: High-entropy tokens with prefix for easy identification

### Input Validation
- **Decision**: Zod schemas for all API inputs with sanitization
- **Rationale**: Type safety, clear error messages, prevents injection attacks
- **Validation**: Subject/body length limits, tag whitelist, required fields

### Authorization
- **Decision**: User-scoped data access, API keys tied to specific users
- **Rationale**: Least-privilege access, prevents cross-user data exposure
- **Implementation**: Middleware validation on all endpoints

## Testing Strategy

### Unit Testing
- **Decision**: Jest with React Testing Library for components, Vitest for utilities
- **Rationale**: Existing Zero OS testing infrastructure, comprehensive component testing
- **Coverage**: Business logic, validation functions, React components

### Integration Testing
- **Decision**: Playwright for end-to-end flows, Supertest for API endpoints
- **Rationale**: Full user flow validation, API contract testing
- **Scenarios**: External webhook → notification display → user interaction

### Contract Testing
- **Decision**: OpenAPI schema validation with Jest
- **Rationale**: Ensures API compatibility, validates request/response formats
- **Implementation**: Schema-driven tests that fail until implementation complete

## Constitutional Compliance Validation

### AI-First Development
- **Implementation**: Extension points for AI-powered notification summarization, categorization hooks
- **Validation**: Clear interfaces for future AI integrations

### Radical Modularity  
- **Implementation**: Independent notification module, clean API boundaries, testable components
- **Validation**: Module can be disabled/enabled without affecting core Zero OS functionality

### Fork Stewardship
- **Implementation**: Minimal changes to existing Zero OS components, documented extensions
- **Validation**: Clear separation of notification-specific code, upstream compatibility preserved

---

*Research complete - ready for Phase 1 design*