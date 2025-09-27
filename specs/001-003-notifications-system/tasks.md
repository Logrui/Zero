# Tasks: In-App Notifications System

**Input**: Design documents from `/specs/001-003-notifications-system/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Technical Context
- **Framework**: Next.js with React, TypeScript, TailwindCSS
- **Database**: PostgreSQL with Drizzle ORM
- **Structure**: Zero OS monorepo integration (apps/mail/)
- **Testing**: Jest (unit), Playwright (integration)
- **Key Features**: API endpoints, overlay UI, UUID routing, async processing

## Phase 3.1: Setup
- [ ] T001 Create database schema migration for notifications system in `apps/server/src/db/migrations/`
- [ ] T002 [P] Add notification-related dependencies to `apps/mail/package.json` (drizzle schema extensions)
- [ ] T003 [P] Configure TypeScript types for notifications in `apps/mail/lib/notifications/types.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T004 [P] Contract test GET /api/v1/notifications in `apps/mail/tests/contract/notifications-get.test.ts`
- [ ] T005 [P] Contract test POST /api/v1/notifications in `apps/mail/tests/contract/notifications-post.test.ts`
- [ ] T006 [P] Contract test GET /api/v1/notifications/{id} in `apps/mail/tests/contract/notifications-get-id.test.ts`
- [ ] T007 [P] Contract test PATCH /api/v1/notifications/{id} in `apps/mail/tests/contract/notifications-patch.test.ts`
- [ ] T008 [P] Contract test DELETE /api/v1/notifications/{id} in `apps/mail/tests/contract/notifications-delete.test.ts`
- [ ] T009 [P] Contract test GET /api/v1/api-keys in `apps/mail/tests/contract/api-keys-get.test.ts`
- [ ] T010 [P] Contract test POST /api/v1/api-keys in `apps/mail/tests/contract/api-keys-post.test.ts`
- [ ] T011 [P] Contract test DELETE /api/v1/api-keys/{id} in `apps/mail/tests/contract/api-keys-delete.test.ts`

### Integration Tests (User Scenarios)
- [ ] T012 [P] Integration test API key management flow in `apps/mail/tests/integration/api-key-management.test.ts`
- [ ] T013 [P] Integration test external notification creation in `apps/mail/tests/integration/external-notifications.test.ts`
- [ ] T014 [P] Integration test notifications dashboard in `apps/mail/tests/integration/notifications-dashboard.test.ts`
- [ ] T015 [P] Integration test notification overlay preview in `apps/mail/tests/integration/notification-overlay.test.ts`
- [ ] T016 [P] Integration test individual notification navigation in `apps/mail/tests/integration/notification-navigation.test.ts`

## Phase 3.3: Database Layer (ONLY after tests are failing)
- [ ] T017 [P] Notification entity model in `apps/mail/lib/db/schema/notifications.ts`
- [ ] T018 [P] Tag entity model in `apps/mail/lib/db/schema/tags.ts`
- [ ] T019 [P] NotificationTag junction table in `apps/mail/lib/db/schema/notification-tags.ts`
- [ ] T020 [P] APIKey entity model in `apps/mail/lib/db/schema/api-keys.ts`
- [ ] T021 Database indexes and constraints in schema files (depends on T017-T020)

## Phase 3.4: Core Services
- [ ] T022 [P] NotificationService CRUD operations in `apps/mail/lib/notifications/notification-service.ts`
- [ ] T023 [P] APIKeyService management in `apps/mail/lib/notifications/api-key-service.ts`
- [ ] T024 [P] TagService operations in `apps/mail/lib/notifications/tag-service.ts`
- [ ] T025 Queue service for async processing in `apps/mail/lib/notifications/queue-service.ts`
- [ ] T026 Rate limiting service in `apps/mail/lib/notifications/rate-limit-service.ts`

## Phase 3.5: API Endpoints
- [ ] T027 GET /api/v1/notifications endpoint in `apps/mail/app/api/v1/notifications/route.ts`
- [ ] T028 POST /api/v1/notifications endpoint (same file as T027)
- [ ] T029 GET /api/v1/notifications/{id} endpoint in `apps/mail/app/api/v1/notifications/[id]/route.ts`
- [ ] T030 PATCH /api/v1/notifications/{id} endpoint (same file as T029)
- [ ] T031 DELETE /api/v1/notifications/{id} endpoint (same file as T029)
- [ ] T032 GET /api/v1/api-keys endpoint in `apps/mail/app/api/v1/api-keys/route.ts`
- [ ] T033 POST /api/v1/api-keys endpoint (same file as T032)
- [ ] T034 DELETE /api/v1/api-keys/{id} endpoint in `apps/mail/app/api/v1/api-keys/[id]/route.ts`
- [ ] T035 GET /api/v1/tags endpoint in `apps/mail/app/api/v1/tags/route.ts`

## Phase 3.6: Frontend Components
- [ ] T036 [P] NotificationOverlay component in `apps/mail/components/notifications/notification-overlay.tsx`
- [ ] T037 [P] NotificationItem component in `apps/mail/components/notifications/notification-item.tsx`
- [ ] T038 [P] NotificationDashboard component in `apps/mail/components/notifications/notification-dashboard.tsx`
- [ ] T039 [P] APIKeyManager component in `apps/mail/components/notifications/api-key-manager.tsx`
- [ ] T040 Enhanced AppBottombar with notifications icon in `apps/mail/components/app-bottombar.tsx`

## Phase 3.7: Pages and Routing
- [ ] T041 Main notifications dashboard page in `apps/mail/app/(routes)/notifications/page.tsx`
- [ ] T042 Individual notification page in `apps/mail/app/(routes)/notifications/[id]/page.tsx`
- [ ] T043 Client-side API functions in `apps/mail/lib/notifications/api.ts`
- [ ] T044 Notification utilities and helpers in `apps/mail/lib/notifications/utils.ts`

## Phase 3.8: Integration and Middleware
- [ ] T045 API key authentication middleware in `apps/mail/lib/auth/api-key-auth.ts`
- [ ] T046 Rate limiting middleware integration in API routes (depends on T026-T035)
- [ ] T047 Internal notification generation hooks in `apps/mail/lib/notifications/internal-hooks.ts`
- [ ] T048 Database connection and query optimization (depends on T017-T021)

## Phase 3.9: Polish and Validation
- [ ] T049 [P] Unit tests for NotificationService in `apps/mail/tests/unit/notification-service.test.ts`
- [ ] T050 [P] Unit tests for APIKeyService in `apps/mail/tests/unit/api-key-service.test.ts`
- [ ] T051 [P] Unit tests for overlay component in `apps/mail/tests/unit/notification-overlay.test.ts`
- [ ] T052 Performance optimization for overlay loading (<200ms)
- [ ] T053 Accessibility improvements for notification components
- [ ] T054 Error handling and user feedback improvements
- [ ] T055 Run quickstart.md validation scenarios
- [ ] T056 Documentation updates for API endpoints

## Dependencies
```
Setup (T001-T003) → All other phases
Tests (T004-T016) → Implementation (T017+)
Database (T017-T021) → Services (T022-T026) → API (T027-T035)
Services (T022-T026) → Frontend (T036-T044)
API + Frontend → Integration (T045-T048)
All Implementation → Polish (T049-T056)

Specific blocks:
T017-T020 → T021 (schema dependencies)
T022-T026 → T027-T035 (API depends on services)
T027-T035 → T046 (middleware integration)
T036-T044 → T051 (component tests)
```

## Parallel Execution Examples
```bash
# Phase 3.2 - Contract Tests (all parallel)
Task: "Contract test GET /api/v1/notifications in apps/mail/tests/contract/notifications-get.test.ts"
Task: "Contract test POST /api/v1/notifications in apps/mail/tests/contract/notifications-post.test.ts"
Task: "Contract test GET /api/v1/notifications/{id} in apps/mail/tests/contract/notifications-get-id.test.ts"
# ... (T004-T016 can all run in parallel)

# Phase 3.3 - Database Models (parallel)
Task: "Notification entity model in apps/mail/lib/db/schema/notifications.ts"
Task: "Tag entity model in apps/mail/lib/db/schema/tags.ts" 
Task: "APIKey entity model in apps/mail/lib/db/schema/api-keys.ts"
# ... (T017-T020 can run in parallel)

# Phase 3.4 - Services (parallel)
Task: "NotificationService CRUD operations in apps/mail/lib/notifications/notification-service.ts"
Task: "APIKeyService management in apps/mail/lib/notifications/api-key-service.ts"
Task: "TagService operations in apps/mail/lib/notifications/tag-service.ts"
# ... (T022-T026 can run in parallel)
```

## Validation Checklist
- [x] All API contracts have corresponding tests (T004-T011)
- [x] All entities have model tasks (T017-T020)
- [x] All user scenarios have integration tests (T012-T016)
- [x] Tests come before implementation (Phase 3.2 before 3.3+)
- [x] Parallel tasks use different files
- [x] Each task specifies exact file path
- [x] Dependencies properly ordered
- [x] Zero OS monorepo structure respected

## Notes
- **[P] tasks**: Different files, no dependencies - can run in parallel
- **Sequential tasks**: Same file or dependency chain - must run in order
- **TDD Critical**: All tests (T004-T016) MUST be written and failing before implementation
- **File Structure**: Following Zero OS monorepo conventions under apps/mail/
- **UUID Support**: All notification entities use UUID for routing and tracking
- **Performance**: Overlay must load in <200ms (T052)
- **Integration**: Must work with existing Zero OS authentication and UI patterns