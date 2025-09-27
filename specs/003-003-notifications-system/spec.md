# Feature Specification: In-App Notifications System

**Feature Branch**: `003-003-notifications-system`  
**Created**: 2025-09-26  
**Status**: Draft  
**Input**: User description: "003-notifications-system the notifications system will be an in app notifications system that will be able to be used to notify the user of internal and accept HTTP signals from external apps such as N8N. It should be built from from the ground up to accept HTTP POST signals w/ a secure API key. Likely will need to set up an API system running off the backend with a user generated unique api key if the backend doesnt already have some sort of API that does this. The notifications system will also likely need some sort of tag like system that defines the type of notification such as 'System' 'N8N' 'Events' and for easy filtering. The notifications system should be minimal and really only contain the following information from a front end perspective: Example: Notification Subject: A new potential event has been added to Events database, Notification Body: A new potential event has been sourced from X email from X sender, Notification Tags: (N8N, External Integration, Automation). The notifications system will need to be accessible from /notifications to display a dashboard of various notifications. The new /notifications page will be a dashboard showing various notifications and categorized based on their source and/or tags. When we click the notifications icon in the bottom bar there should be a preview of the recent 50 notifications - only 10 in the view box with a scrollable container that allows us to view the rest of them if any. This should be some sort of medium sized overlay. When clicking on the notification we should open a new tab and navigate to the /navigation and the specific page of that notification such as /notification/d3d4b6c7-31a8-44e2-8b6b-3a5e8f2c1d9b. Every notification should be assigned a new unique uuid such as d3d4b6c7-31a8-44e2-8b6b-3a5e8f2c1d9b for tracking as well from a database perspective and navigation perspective."

## Execution Flow (main)
```
1. Parse user description from Input
   → Parsed: In-app notification system with internal and external HTTP integration
2. Extract key concepts from description
   → Actors: Users, External apps (N8N), System
   → Actions: Send notifications, View notifications, Filter by tags, Navigate to details
   → Data: Notification content, tags, API keys, UUIDs
   → Constraints: Secure API, tag-based filtering, overlay UI, dashboard view
3. For each unclear aspect:
   → [Marked with NEEDS CLARIFICATION where specified]
4. Fill User Scenarios & Testing section
   → Primary flow: External app sends notification → User views in overlay → Navigates to details
5. Generate Functional Requirements
   → 13 testable requirements covering API, UI, security, and data management
6. Identify Key Entities
   → Notification, Tag, API Key, User entities identified
7. Run Review Checklist
   → Some [NEEDS CLARIFICATION] markers present for rate limiting and data retention
8. Return: SUCCESS (spec ready for planning with clarifications needed)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-26
- Q: What rate limiting approach should be implemented for API requests? → A: Moderate: 100 requests per minute per API key
- Q: What should the notification data retention policy be? → A: 30 days: Auto-delete after 1 month
- Q: Where should API key management be located? → A: Notifications dashboard: Within /notifications page
- Q: What should happen when a user has more than 50 notifications in the overlay? → A: Only display 50 most recent with view all button
- Q: What should the system response be for malformed notification data? → A: Return error: Send 400 Bad Request with validation details

---

## User Scenarios & Testing

### Primary User Story
A Zero OS user receives notifications from both internal system events and external integrations (like N8N automation workflows). They can quickly view recent notifications through a bottom bar overlay, filter by categories, and navigate to detailed views for full context. External applications can securely send notifications via HTTP POST with API key authentication.

### Acceptance Scenarios
1. **Given** a user is working in Zero OS, **When** they click the notifications icon in the bottom bar, **Then** they see an overlay showing the most recent 10 notifications with ability to scroll through up to 50 total
2. **Given** an external app (N8N) needs to send a notification, **When** it makes an HTTP POST to the notifications API with valid API key and notification data, **Then** the notification appears in the user's notification feed
3. **Given** a user views the notifications overlay, **When** they click on a specific notification, **Then** they navigate to `/notifications/[uuid]` in a new tab to view full details
4. **Given** a user is on the `/notifications` dashboard, **When** they filter by tags like "N8N" or "System", **Then** only notifications with those tags are displayed
5. **Given** a user sees a notification with a long subject line in the overlay, **When** they expand it, **Then** they can view the full subject text without navigating away

### Edge Cases
- API returns 400 Bad Request with validation details when receiving malformed notification data
- How does the system handle notifications when the overlay is already open?
- What occurs if a user tries to access a notification UUID that doesn't exist?
- How are notifications displayed when there are more than 50 recent items?

## Requirements

### Functional Requirements
- **FR-001**: System MUST accept HTTP POST requests from external applications to create notifications
- **FR-002**: System MUST authenticate external requests using unique, user-generated API keys
- **FR-003**: System MUST assign a unique UUID to each notification for tracking and navigation purposes
- **FR-004**: System MUST support tagging notifications with categories (e.g., "System", "N8N", "Events") for filtering
- **FR-005**: System MUST store minimal notification data: subject, body, and tags
- **FR-006**: System MUST display notifications in a bottom bar overlay showing recent 10 items with scroll to 50 total, plus a "View All" button to access the full dashboard
- **FR-007**: System MUST provide expandable subject lines in the overlay for longer text
- **FR-008**: System MUST navigate to `/notifications/[uuid]` when a notification is clicked in overlay
- **FR-009**: System MUST provide a `/notifications` dashboard page for viewing all notifications
- **FR-010**: System MUST support filtering notifications by tags on the dashboard
- **FR-011**: System MUST allow users to generate and manage their API keys within the /notifications dashboard page
- **FR-012**: System MUST implement rate limiting of 100 requests per minute per API key
- **FR-013**: System MUST automatically delete notifications after 30 days to manage storage and maintain performance
- **FR-014**: System MUST limit overlay to display only the 50 most recent notifications, with older notifications accessible only via the dashboard
- **FR-015**: System MUST return 400 Bad Request with detailed validation errors when receiving malformed notification data via API
- **FR-016**: System MUST allow users to manually delete one or more notifications from the dashboard

### Key Entities
- **Notification**: Represents a single notification with subject, body, tags, timestamp, UUID, and read status
- **Tag**: Categorization labels for notifications (System, N8N, Events, etc.) used for filtering
- **API Key**: Unique authentication tokens generated by users for external application access
- **User**: Zero OS user who receives notifications and manages API keys

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (5 clarifications resolved)
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
