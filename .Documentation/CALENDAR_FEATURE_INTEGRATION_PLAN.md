# Calendar Feature Integration Plan

**Last Updated:** 2025-09-21T23:08:44-04:00

This document outlines the detailed, stage-by-stage plan for integrating the standalone `zero-calendar` project into the main ZeroOS application as a self-contained feature module. The goal is to achieve a clean, maintainable, and scalable integration following the "Monolithic with Feature Modules" architecture.

---

## Current Status

*   [x] **Phase 1: Establish the Module Foundation** - Completed
*   [x] **Phase 2: Port the Calendar Feature** - Completed
*   [x] **Phase 3: Wire up the Module System** - Completed. Calendar route is working and accessible.
*   [x] **Phase 3.5: Routing Integration** - Completed. Fixed React Router configuration.
*   [ ] **Phase 4: Integrate AI Capabilities** - Pending

---

This document outlines the detailed, stage-by-stage plan for integrating the standalone `zero-calendar` project into the main ZeroOS application as a self-contained feature module. The goal is to achieve a clean, maintainable, and scalable integration following the "Monolithic with Feature Modules" architecture.

---

## Phase 1: Establish the Module Foundation (Completed)

**Goal:** Create the basic directory structure for the module system and the new calendar module without modifying any existing application logic.

### Stage 1.1: Create Module Directories

1.  **Create New Directory:**
    *   **File:** `apps/mail/modules/`
    *   **Purpose:** This directory will house all feature modules, starting with the calendar.

2.  **Create New Directory:**
    *   **File:** `apps/mail/modules/calendar/`
    *   **Purpose:** This will be the root directory for the entire calendar feature module.

### Stage 1.2: Define the Module Contract

1.  **Create New File:**
    *   **File:** `apps/mail/modules/calendar/module.ts`
    *   **Purpose:** This file will define the public interface for the calendar module.
    *   **Initial Content:**
        ```typescript
        import { IFeatureModule } from '@/modules/types';

        export const CalendarModule: IFeatureModule = {
          name: 'Calendar',
          routes: [
            { path: '/calendar', component: () => import('./pages/calendar-page') },
          ],
          getNavigation: () => ({
            path: '/calendar',
            name: 'Calendar',
          }),
          getAITools: () => [],
        };
        ```

2.  **Create New File:**
    *   **File:** `apps/mail/modules/types.ts`
    *   **Purpose:** To define the shared `IFeatureModule` interface that all modules will implement.
    *   **Content:**
        ```typescript
        import { ComponentType } from 'react';

        export interface IRoute {
          path: string;
          component: () => Promise<{ default: ComponentType<any> }>;
        }

        export interface INavigationLink {
          path: string;
          name: string;
        }

        export interface IAITool {
          name: string;
          description: string;
          execute: (args: any) => Promise<any>;
        }

        export interface IFeatureModule {
          name: string;
          routes: IRoute[];
          getNavigation: () => INavigationLink | null;
          getAITools: () => IAITool[];
        }
        ```

---

## Phase 2: Port the Calendar Feature (Completed)

**Goal:** Move the code from the `zero-calendar` project into the new module and adapt it to the new structure.

### Stage 2.1: Migrate UI Components

1.  **Create New Directory:**
    *   **File:** `apps/mail/modules/calendar/components/`
    *   **Purpose:** To house all React components specific to the calendar feature.

2.  **Migrate Files:**
    *   **From:** `d:\DevelopmentFiles\zero-calendar\components\ui\`
    *   **To:** `apps/mail/modules/calendar/components/`
    *   **Action:** Copy all relevant calendar UI components (e.g., `calendar-view`, `calendar-header`, etc.). Some components may already exist in the main app's `ui` library and should be reused instead of copied.

### Stage 2.2: Create the Main Calendar Page

1.  **Create New File:**
    *   **File:** `apps/mail/modules/calendar/pages/calendar-page.tsx`
    *   **Purpose:** This will be the main entry point component for the `/calendar` route.
    *   **Action:** Adapt the content of `d:\DevelopmentFiles\zero-calendar\app\calendar\page.tsx` into this new file, updating imports to reflect the new module structure.

---

## Phase 3: Wire up the Module System (In Progress)

**Goal:** Modify the main application to discover, load, and render the new calendar module dynamically.

### Stage 3.1: Implement the Dynamic Route Loader

1.  **Create New File:**
    *   **File:** `apps/mail/app/(routes)/[...slug]/page.tsx`
    *   **Purpose:** This dynamic route will be the engine that loads and displays modules.
    *   **Action:** This component will need to contain logic to:
        1.  Scan the `apps/mail/modules` directory to find all `module.ts` files.
        2.  Match the current URL slug against the `routes` defined in each module.
        3.  Dynamically `import()` and render the component for the matching route.
        4.  Handle 404s if no module matches the route.

### Stage 3.2: Update the App Topbar

1.  **Edit Existing File:**
    *   **File:** `apps/mail/components/app-topbar.tsx`
    *   **Action:**
        1.  Remove the hardcoded "Calendar" button.
        2.  Add logic to scan the `apps/mail/modules` directory.
        3.  For each module, call its `getNavigation()` function.
        4.  Dynamically render a navigation `Button` and `Link` for each module that returns a navigation link.

### Stage 3.3: Update Backend and API Hooks (Read operations complete)

1.  **Edit Existing File:**
    *   **File:** `apps/server/src/trpc/routes/...`
    *   **Action:** The tRPC backend needs to be updated with the calendar-related procedures. The calendar logic from `zero-calendar`'s backend will need to be merged here.

2.  **Edit Existing File(s):**
    *   **Files:** `apps/mail/modules/calendar/pages/calendar-page.tsx` and any related hooks.
    *   **Action:** Update all `useTRPC` calls to use the main application's tRPC client and point to the newly added backend procedures.

---

## Progress Log

### Session: 2025-09-21

*   **Backend Event Management:**
    *   Successfully implemented the `createEvent` and `updateEvent` mutations for the calendar.
    *   This involved adding the necessary logic to the tRPC router, the `CalendarManager`, and the `ZeroDB` durable object.
    *   Overcame several challenges to correct the structure and syntax in `apps/server/src/main.ts`, resolving all related build errors.

*   **Frontend Type-Safety & Bug Fixes:**
    *   Systematically eliminated recurring `implicit 'any' type` errors by creating and applying a new, strongly-typed `Connection` type to `nav-user.tsx` and `settings/connections/page.tsx`.
    *   Refactored the `useConnections` hook to provide a more stable return type, resolving a `Property 'connections' does not exist` error.
    *   Updated the `Connection` type to include the missing `providerId`, fixing the final related bug.

*   **Calendar Page Creation:**
    *   Created a new page component at `apps/mail/app/(routes)/calendar/page.tsx`.
    *   Added a "Calendar" link to the main sidebar navigation in `config/navigation.ts`, making the page accessible within the application.

*   **Routing Architecture Discovery & Fix:**
    *   **Problem Identified:** Initially attempted to use Next.js-style dynamic routing (`[...slug]/page.tsx`) in what is actually a React Router v7 application.
    *   **Root Cause:** The application uses explicit route registration in `apps/mail/app/routes.ts`, not file-based routing.
    *   **Solution Implemented:**
        1. **Created Dedicated Route File:** `apps/mail/app/(routes)/calendar/page.tsx` - a direct route handler that imports and renders the calendar module component.
        2. **Updated Route Registration:** Modified `apps/mail/app/routes.ts` to explicitly register the `/calendar` route pointing to the dedicated page file.
        3. **Verified Functionality:** Calendar is now accessible at `http://localhost:3500/calendar` with proper console logging and component rendering.
    *   **Key Insight:** React Router requires explicit route registration in `routes.ts`. File-based routing patterns from Next.js don't apply here.
    *   **Architecture Decision:** Chose direct route registration over dynamic module loading for simplicity and consistency with existing application patterns.

*   **Auth Integration (Mail App System):**
    *   Replaced NextAuth assumptions with the mail app's existing connection-based auth.
    *   Updated `apps/mail/modules/calendar/components/multi-calendar-view.tsx` to use `useActiveConnection()` from `@/hooks/use-connections` and derive `activeUserId`.
    *   Data fetching (`getEvents`, `getSharedEvents`, `getUserCategories`) now gates on `activeUserId`.
    *   Added `apps/mail/modules/calendar/components/google-calendar-sync.tsx` that uses `useActiveConnection()` and a module-local `hasGoogleCalendarConnected()` stub.
    *   Introduced a module-local client shim at `apps/mail/modules/calendar/lib/calendar.ts` with typed stubs for events, categories, import/export, and Google connection until tRPC endpoints are wired.

*   **tRPC Wiring (Client and Server):**
    *   Verified calendar router exists server-side at `apps/server/src/trpc/routes/calendar.ts` with `getEvents`, `getUserCategories`, `createEvent`, and `updateEvent` procedures.
    *   Wired module client functions in `apps/mail/modules/calendar/lib/calendar.ts` to call:
        - `trpcClient.calendar.getEvents.query({ start, end })`
        - `trpcClient.calendar.getUserCategories.query()`
        - `trpcClient.calendar.createEvent.mutate(payload)`
        - `trpcClient.calendar.updateEvent.mutate({ id, data })`
    *   Updated `EventDialog` to call the module client’s `createEvent/updateEvent/deleteEvent` (delete currently soft-deletes via `updateEvent` placeholder until a dedicated endpoint is added).
    *   `getSharedEvents` remains a no-op for now; will add when backend support is available.

*   **UI Porting Audit (excluding old app top bar):**
    *   Present & Wired:
        - Main views Month/Week/Day/Year/Agenda with navigation (Today/prev/next), search box, tabs, and filters drawer (`apps/mail/modules/calendar/components/multi-calendar-view.tsx`).
        - Event creation/edit dialog (`apps/mail/modules/calendar/components/event-dialog.tsx`) using module client and tRPC.
        - Category and calendar visibility filters in the drawer.
    *   Partially Integrated / Stubbed:
        - Chat Panel: app-level shim at `apps/mail/components/chat-panel.tsx`; imported by calendar. Needs prop-shape alignment with usage in `MultiCalendarView`.
        - Natural Language Event Dialog: placeholder `apps/mail/modules/calendar/components/natural-language-event-dialog.tsx` to satisfy imports without UI.
    *   TypeScript Polishing:
        - Tabs `onValueChange` handlers adjusted to typed casts.
        - Week view end-time guard added when `event.end` is missing. Similar guards should be reviewed for Day/Agenda/Year computations.
        - Implemented right-side Calendars panel (toggle via Layers button) with checkboxes for default calendars and categories. Initial UI-only wiring; filtering will be hooked next.
        - Fixed compile errors from drawer integration (removed duplicate `Checkbox` import, restored Week view body grid).
        - Ported AI sidebar behavior: introduced `apps/mail/components/ai-sidebar.tsx` and integrated it in `apps/mail/modules/calendar/components/multi-calendar-view.tsx` so the AI ChatPanel opens as a right-side drawer matching the mail app style.
        - Replaced blocking full-page loader with a small non-blocking spinner in the calendar card header. Added non-blocking error and no-connection banners.
        - Sidebar made visible by default; added a floating open button when closed.
        - Sidebar structure refactored to closely match zero-calendar (header, collapsible "My Calendars" and "Shared Calendars", styled rows, categories section, disabled nav placeholders).
        - Header updated to match zero-calendar: search input, View `Select` (Day/Week/Month), Filter icon, Event button style, and Layers toggle; kept AI button per ZeroOS design.
        - Month grid refined to match zero-calendar (mono palette for Today badge and cell highlight, tighter event pill spacing, min height and borders).
        - Mounted visible AI ChatPanel in `apps/mail/components/chat-panel.tsx` and integrated in `AISidebar`; fixed `DialogContent` positioning to render as a right-side drawer (override default centered modal transforms) and added a11y `DialogTitle`/`DialogDescription`.
        - Fixed JSX/lint issues in `apps/mail/modules/calendar/components/multi-calendar-view.tsx` (cleaned stray fragments, ensured proper tag closure, simplified month event rendering). Build should now parse TSX cleanly.
        - Added calendar mock mode to avoid TRPC/DB errors locally: `apps/mail/modules/calendar/lib/calendar.ts` now serves synthetic data when `NEXT_PUBLIC_CALENDAR_MOCK=true`.

### How to enable Mock Mode (Local Only)
1. Set an environment variable before dev start:
   - Windows PowerShell: `$env:NEXT_PUBLIC_CALENDAR_MOCK="true"; pnpm dev`
   - Or add `NEXT_PUBLIC_CALENDAR_MOCK=true` to your local `.env` and restart dev server.
2. The UI will render with sample events, shared event(s), and categories; server-side TRPC calls are skipped.

*   **Component Porting Decisions:**
    *   Use the mail app Chat Panel. Exposed a temporary shim at `apps/mail/components/chat-panel.tsx` so feature modules can import `@/components/chat-panel` consistently. This should be replaced by the real app-level chat panel when available.
    *   Do NOT port Natural Language dialog and Chat Panel from `zero-calendar` now (per decision). A placeholder `natural-language-event-dialog.tsx` exists to satisfy imports without UI.
    *   Remaining components to port (from `d:\DevelopmentFiles\zero-calendar\components\`):
        - `import-export-dialog.tsx`
        - `keyboard-shortcuts-dialog.tsx`
        - (Optional) any minor component helpers these depend on

*   **Next Implementation Steps:**
    1. Wire Import/Export dialog into the calendar action bar (button/command) and plumb open/close state in `multi-calendar-view.tsx`.
    2. Wire Keyboard Shortcuts dialog (add a trigger with the current shortcuts list).
    3. Render Google Calendar Sync control in the action bar (disabled state when not connected) and wire server endpoint when available.
    4. Align Chat Panel shim prop types with `MultiCalendarView` usage to remove TS errors; keep as no-op until the real panel is available.
    5. Add remaining date-fns guards in Day/Agenda/Year computations to avoid undefined inputs.
    6. Add a real `calendar.deleteEvent` endpoint server-side and update the client to call it (replacing the soft-delete placeholder).
    7. Add a `getSharedEvents` endpoint and wire `getSharedEvents` client call.

---

## Phase 4: Integrate AI Capabilities

**Goal:** Expose calendar-specific tools to the unified AI copilot.

### Stage 4.1: Expose AI Tools

1.  **Edit Existing File:**
    *   **File:** `apps/mail/modules/calendar/module.ts`
    *   **Action:** Implement the `getAITools` function to return an array of calendar-specific tools, such as `createEvent`, `findNextAvailableSlot`, etc. Each tool will be an object containing its name, description, and an `execute` function.

### Stage 4.2: Update the AI Copilot

1.  **Edit Existing File:**
    *   **File:** `apps/mail/components/ui/ai-sidebar.tsx` (or wherever the core AI logic resides).
    *   **Action:** Modify the AI system to discover all modules, call `getAITools()` on each, and aggregate the results into its master list of available tools. This will make the calendar's AI tools available globally.
