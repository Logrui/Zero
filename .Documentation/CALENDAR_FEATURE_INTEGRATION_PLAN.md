# Calendar Feature Integration Plan

This document outlines the detailed, stage-by-stage plan for integrating the standalone `zero-calendar` project into the main ZeroOS application as a self-contained feature module. The goal is to achieve a clean, maintainable, and scalable integration following the "Monolithic with Feature Modules" architecture.

---

## Phase 1: Establish the Module Foundation

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

## Phase 2: Port the Calendar Feature

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

## Phase 3: Wire up the Module System

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

### Stage 3.3: Update Backend and API Hooks

1.  **Edit Existing File:**
    *   **File:** `apps/server/src/trpc/routes/...`
    *   **Action:** The tRPC backend needs to be updated with the calendar-related procedures. The calendar logic from `zero-calendar`'s backend will need to be merged here.

2.  **Edit Existing File(s):**
    *   **Files:** `apps/mail/modules/calendar/pages/calendar-page.tsx` and any related hooks.
    *   **Action:** Update all `useTRPC` calls to use the main application's tRPC client and point to the newly added backend procedures.

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
