# Feature Specification: Zero OS - Advanced Productivity Features

**Feature Branch**: `001-zero-os-overview`
**Created**: 2025-09-26
**Status**: Draft
**Input**: User description: "Zero OS is a fork of https://github.com/Mail-0/Zero that is focused on implementing advanced features for Zero focused around additional pages and more complex feature such as AI Workflows, advanced feature for AI chat, conversion of the ai agent into a full suite productivity "IDE like" productivity system with context aware Zero Agent system across most pages. The original Zero mail system is a dynamic productivity focused web app built on Next.js, React, Typescript, TypeScript, TailwindCSS, and Shadcn focused on AI integrations with emails w/ integration into gmail and microsoft outlook..."

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications
### Session 2025-09-26
- Q: For contact de-duplication, what should be the primary identifier? → A: Email address only.
- Q: What should be the default behavior for the RAG (Retrieval-Augmented Generation) system when a user's query is too ambiguous to yield a confident result? → A: Ask the user a clarifying question to narrow down the search.
- Q: Regarding the `/events` page (FR-005), what is the primary purpose of "event-related workflows"? → A: Display events that have been processed via n8n or other related workflows into our external Twenty database in a calendar view and/or Overview view that lists events and notifications of events that have been added to our database
- Q: For the Google Drive integration (FR-006), what level of file access is required? → A: Read and write access to create new documents (e.g., meeting notes).
- Q: What is the intended structure for "Agent Workflows"? → A: A visual, node-based editor for users to define custom logic (similar to n8n or Zapier).

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a power user, I want an integrated productivity suite that combines my email, calendar, contacts, and tasks, all enhanced with context-aware AI, so that I can manage my work more efficiently from a single application.

### Acceptance Scenarios
1.  **Given** I have connected my Google account, **When** I navigate to the `/calendar` page, **Then** I should see my Google Calendar events displayed.
2.  **Given** I am viewing an email thread, **When** I activate the Zero Agent and type `/calendar create event "Team Meeting" tomorrow at 10am`, **Then** a new event is created in my Google Calendar and I receive a confirmation.
3.  **Given** I have received an email from a new contact, **When** I navigate to the `/people` page, **Then** the new contact is automatically listed with their name and email address.
4.  **Given** I am composing a response to an email, **When** I use the Zero Agent with a prompt like "draft a polite refusal to this invitation", **Then** the agent generates a context-aware draft using the Gemini model.
5.  **Given** I receive a system alert, **When** I check the new notifications center, **Then** I see the alert and can mark it as read.

### Edge Cases
-   What happens if Google API access is revoked? The system should gracefully handle the disconnection and notify the user.
-   How does the system handle conflicting calendar events during creation? It should warn the user of the conflict.
-   What is the behavior when an email is received from a person with the same name as an existing contact? The system will use the email address as the unique identifier, so contacts with the same name but different emails will be treated as distinct.
-   How does the RAG system handle ambiguous queries? It will ask the user a clarifying question to narrow down the search.

## Requirements *(mandatory)*

### Functional Requirements
-   **FR-001**: The system MUST provide a `/calendar` page that displays events from a connected Google Calendar account.
-   **FR-002**: The calendar MUST support bidirectional synchronization with Google Calendar.
-   **FR-003**: The Zero Agent MUST be able to create and manage calendar events via chat commands.
-   **FR-004**: The system MUST include a notification management system for both internal and external (HTTP) notifications.
-   **FR-005**: The system MUST provide an `/events` page to display events and notifications that have been processed via external workflows (e.g., n8n) and stored in the Twenty CRM database. This page should offer a calendar and/or list overview.
-   **FR-006**: The system MUST integrate with Google Drive, allowing for read and write access to create and manage documents like meeting notes.
-   **FR-007**: The Zero Agent chat MUST be context-aware of user files and support commands like `/workflows` and `/calendar`.
-   **FR-008**: The system MUST implement a RAG (Retrieval-Augmented Generation) system to find specific emails or calendar events based on natural language queries.
-   **FR-009**: The system MUST integrate with a CRM. A self-hosted Twenty CRM instance is the likely choice.
-   **FR-010**: The system MUST automatically generate a list of contacts on a `/people` page from incoming and outgoing emails.
-   **FR-011**: The system MUST automatically generate a list of companies on a `/companies` page based on email domains.
-   **FR-012**: The Zero Agent MUST use a Gemini model for its generative AI capabilities.
-   **FR-013**: The system SHOULD allow for the potential use of local Ollama models as an alternative to cloud-based AI.
-   **FR-014**: The UI/UX design MUST remain consistent with the existing Zero mail application.
-   **FR-015**: Core files from the upstream repository MUST NOT be modified unless absolutely necessary.
-   **FR-016**: All billing-related code (e.g., Autumn) MUST be removed or disabled in the development environment.

### Key Entities *(include if feature involves data)*
-   **Calendar Event**: Represents an event with properties like title, start/end times, attendees, and description. Linked to a user account.
-   **Notification**: Represents a system or external alert with a message, timestamp, and read status.
-   **Person**: Represents a contact with at least a name and email. Uniquely identified by email address. Can be linked to a Company.
-   **Company**: Represents an organization, identified primarily by its email domain.
-   **Agent Workflow**: Represents a user-defined, multi-step process created via a visual, node-based editor.
-   **Workspace**: A TBD entity for task and file management.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
