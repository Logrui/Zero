
# Implementation Plan: In-App Notifications System

**Branch**: `003-003-notifications-system` | **Date**: 2025-09-26 | **Updated**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-003-notifications-system/spec.md`
**Constitution**: v1.1.0 compliant with Fork Stewardship principles

## 🚀 Latest Progress Update (2025-09-27)
**Phase Completed**: UI Implementation ✅  
**Status**: Core user interface fully implemented and verified  
**Next Phase**: Backend API & Database Integration

### ✅ Completed Components
- **UI Components**: All 4 core components (NotificationOverlay, NotificationItem, NotificationFilters, ApiKeyManager)
- **Pages**: Dashboard page (`/notifications`) with tabbed interface, Individual notification page (`/notifications/[uuid]`)
- **Layout Integration**: Bottom bar notification icon with badge, Notification count badge component
- **Development Quality**: Zero TypeScript compilation errors, Proper accessibility attributes, Mobile-responsive design
- **Design System**: Consistent with Zero OS conventions, Uses shadcn/ui components throughout

### 📋 Task Completion Summary
```
Phase 3.1 (Setup): 4/4 tasks ✅ COMPLETE
Phase 3.2 (Tests): 13/13 tasks ✅ COMPLETE  
Phase 3.5 (UI): 8/8 tasks ✅ COMPLETE
Total Progress: 25/60 tasks (42%) ✅
```

### 🔄 Current Development State
- **Ready for Integration**: UI components await backend API connection
- **Mock Data**: All components use realistic mock data for demonstration
- **Type Safety**: Full TypeScript coverage with proper type definitions
- **Testing**: Integration tests cover all user scenarios from quickstart.md

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Build a comprehensive in-app notifications system that accepts HTTP POST signals from external applications (N8N) with secure API key authentication, displays notifications in a bottom bar overlay (10 visible, scroll to 50), provides UUID-based navigation to detailed views, includes tag-based filtering, and offers a full dashboard at /notifications. Technical approach: Next.js/React frontend with PostgreSQL backend, following Zero OS conventions.

## Technical Context
**Language/Version**: TypeScript/JavaScript (Next.js 14+, React 18+)
**Primary Dependencies**: Next.js, React, TailwindCSS, Drizzle ORM, PostgreSQL, Zod validation
**Storage**: PostgreSQL with Drizzle ORM (constitutional modularity compliance)
**Testing**: Jest (unit), Playwright (integration), constitutional validation gates
**Target Platform**: Web application (Zero OS monorepo integration)
**Project Type**: Web application (frontend + backend within existing Zero OS structure)
**Performance Goals**: <200ms overlay load, <500ms API response, constitutional user-centric targets
**Constraints**: Must maintain upstream compatibility, follow Zero OS conventions, AI-integration ready
**Scale/Scope**: Constitutional modularity for independent scaling, thousands of notifications per user
**Fork Stewardship**: Minimal upstream drift, documented divergence, compatibility preservation

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*
*Based on Constitution v1.1.0*

- **AI-First Development**: ✅ PASS - Notifications system designed with AI agent integration hooks, context-aware features, and extension points for AI workflows and productivity automation
- **Radical Modularity**: ✅ PASS - Independent notifications module with clear boundaries, testable components, deployable separately from core Zero OS, loose coupling via well-defined APIs
- **Convention over Configuration**: ✅ PASS - Follows Zero OS established patterns, standard REST APIs, conventional file structures, sensible defaults for notification behavior and UI
- **User-Centric Design**: ✅ PASS - Overlay provides immediate access, intuitive dashboard navigation, accessible design, measurable user value through productivity enhancement
- **Security First**: ✅ PASS - API key authentication, input validation, rate limiting, least-privilege access, secure UUID generation, user-scoped data access by default
- **Fork Stewardship**: ✅ PASS - Minimal upstream drift by using existing Zero components, documented Zero OS-specific extensions, compatibility preserved for upstream merges, changes clearly gated and tested

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (Zero OS monorepo structure)
```
apps/mail/
├── app/
│   └── (routes)/
│       └── notifications/
│           ├── page.tsx                    # Dashboard page
│           └── [uuid]/
│               └── page.tsx               # Individual notification view
├── components/
│   ├── notifications/
│   │   ├── notification-overlay.tsx      # Bottom bar overlay
│   │   ├── notification-item.tsx         # Individual notification component
│   │   ├── notification-filters.tsx      # Tag-based filtering
│   │   └── api-key-manager.tsx          # API key management
│   └── app-bottombar.tsx                 # Update existing bottom bar
└── api/
    └── notifications/
        ├── route.ts                       # POST endpoint for external apps
        ├── [uuid]/
        │   └── route.ts                  # GET individual notification
        └── keys/
            └── route.ts                   # API key management

apps/server/
├── src/
│   ├── db/
│   │   └── schema/
│   │       └── notifications.ts          # Drizzle schema
│   ├── lib/
│   │   ├── notifications.ts              # Core business logic
│   │   └── api-auth.ts                   # API key validation
│   └── middleware/
│       └── rate-limit.ts                 # Rate limiting middleware
└── tests/
    ├── notifications.test.ts             # Unit tests
    └── api.test.ts                       # Integration tests

packages/testing/
└── e2e/
    └── notifications.spec.ts             # End-to-end tests
```

**Structure Decision**: Zero OS monorepo integration using existing apps/mail and apps/server structure with new notifications module following constitutional modularity principles

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v1.1.0 - See `.specify/memory/constitution.md`*
