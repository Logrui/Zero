# Troubleshooting Mail Layout

This document explains how the `/mail/inbox` page is composed, shows a visual DOM breakdown, and provides a troubleshooting checklist for common layout issues (including the AI popup/sidebar visibility).

## Route and Provider Layers

- `apps/mail/app/(routes)/layout.tsx`
  - Wraps all mail routes with:
    - `CommandPaletteProvider`
    - `HotkeyProviderWrapper`
    - Renders `AppTopbar` (fixed header height tracked via `--app-topbar-height`)
    - `<Outlet />` for children

- `apps/mail/app/(routes)/mail/layout.tsx`
  - Wraps the `/mail/*` section with another `HotkeyProviderWrapper`
  - Renders `AppSidebar` on the left and `<Outlet />` in the main area
  - Includes `OnboardingWrapper`

- `apps/mail/app/(routes)/mail/page.tsx`
  - Redirects to `/mail/inbox`

- `apps/mail/app/(routes)/mail/[folder]/page.tsx`
  - Validates folder/label access and renders `components/mail/mail.tsx -> <MailLayout />`

## Visual DOM Breakdown (high-level)

```mermaid
flowchart TD
  A[/(routes)/layout] --> B[AppTopbar]
  A --> C[Content Wrapper]
  C --> D[/(routes)/mail/layout]
  D --> E[AppSidebar]
  D --> F[Mail Outlet]
  F --> G[[/mail/[folder]/page.tsx]]
  G --> H[components/mail/MailLayout]

  subgraph MailLayout Panels
    H --> H1[ResizablePanelGroup (desktop)]
    H1 --> H2[Panel 1: MailList + Toolbar]
    H1 --> H3[Handle]
    H1 --> H4[Panel 2: ThreadDisplay]
    H1 --> H5[Conditional Handle]
    H1 --> H6[Panel 3: AISidebar asPanelContent (only when AI sidebar mode)]
    H --> H7[AISidebar Overlay (popup/fullscreen instance)]
    H --> H8[AIToggleButton (bottom-right)]
    H --> H9[Mobile Thread Overlay (when threadId exists)]
  end
```

## Key Components and Responsibilities

- `components/app-topbar.tsx`
  - Sets CSS var `--app-topbar-height` based on measured header height
  - Mail body is offset via `style={{ marginTop: 'calc(var(--app-topbar-height))' }}` in `MailLayout`

- `components/ui/app-sidebar.tsx`
  - Left navigation and Compose button, hidden when AI fullscreen (`useAIFullScreen`) is true

- `components/mail/mail.tsx` (`MailLayout`)
  - Desktop: `ResizablePanelGroup` with three columns when AI sidebar is open in sidebar mode
    - Panel 1: Mail toolbar + `MailList`
    - Panel 2: `ThreadDisplay`
    - Panel 3: `AISidebar asPanelContent` (only when AI is open AND view mode = sidebar AND not fullscreen)
  - Always renders another `AISidebar` instance for popup/fullscreen overlay modes
  - Renders `AIToggleButton` (bottom-right) if `activeConnection?.id` exists
  - Mobile `ThreadDisplay` overlays when `threadId` is present

- `components/ui/ai-sidebar.tsx` (AI state and rendering)
  - `useAISidebar()` manages:
    - `open` via `aiSidebar` query param and `localStorage` (key: `ai-sidebar-open`)
    - `viewMode` via `viewMode` query param (`'sidebar' | 'popup'`) and `localStorage` (key: `ai-viewmode`)
    - `isFullScreen` via `isFullScreen` query param and `localStorage` (key: `ai-fullscreen`)
  - Rendering logic:
    - Sidebar panel content when: `open && isSidebar && !isFullScreen`
    - Overlay content when: `open && ((isPopup && !isFullScreen) || isFullScreen)`

## Conditional Visibility Summary

- Desktop 3-column layout (with AI sidebar panel):
  - `isDesktop` true
  - `activeConnection?.id` truthy
  - `open` true (from `useAISidebar`)
  - `viewMode === 'sidebar'`
  - `!isFullScreen`

- Popup overlay (AI window floating on desktop/mobile):
  - `open` true AND `viewMode === 'popup'` AND `!isFullScreen`
  - Tailwind classes gate popup overlay visibility by breakpoint:
    - Base: `md:hidden`
    - When popup: `isPopup && !isFullScreen && 'md:flex'`
    - When fullscreen: `'block! max-w-none! rounded-none! border-none!'` and container `'inset-0! flex! p-0!'`

- Fullscreen overlay:
  - `open` true AND `isFullScreen` true
  - `AppSidebar` is hidden while fullscreen (via `useAIFullScreen`)

- Mobile Thread overlay:
  - `isMobile` and `threadId` present renders a full-screen overlay containing `ThreadDisplay`

## Common Issues and Fixes

- AI button click throws `onOpenChange is not a function`
  - Cause: `AIToggleButton` requires `open` and `onOpenChange` props but was rendered without them
  - Fix: In `components/mail/mail.tsx`, wire it as:
    - `const { open: aiOpen, setOpen } = useAISidebar();`
    - `<AIToggleButton open={aiOpen} onOpenChange={setOpen} />`

- AI popup not showing on desktop
  - Verify `activeConnection?.id` is truthy; `AIToggleButton` is only rendered when connected
  - Ensure `useAISidebar().viewMode` is `'popup'` when you expect popup
  - Force open via URL query params: `?aiSidebar=true&viewMode=popup`

- AI sidebar panel not appearing as right column
  - Confirm conditions: `isDesktop`, `aiOpen`, `isSidebar`, `!isFullScreen`, and `activeConnection?.id`
  - If in popup mode, toggle view mode from the chat header button, or set `viewMode=sidebar`

- Fullscreen AI obscures sidebar
  - Intended: `AppSidebar` hides when `isFullScreen` is true
  - Exit fullscreen via the chat header button; also clears `isFullScreen` query/localStorage

- Content hidden behind topbar
  - Ensure `AppTopbar` mounted and `--app-topbar-height` CSS var is set
  - `MailLayout` applies `marginTop: calc(var(--app-topbar-height))`

- Stale query/localStorage state
  - Clear related keys: `ai-sidebar-open`, `ai-viewmode`, `ai-fullscreen`
  - Or toggle via buttons to re-sync query params

## Quick Debug Checklist

- Is there an active connection? (`activeConnection?.id`)
- What is `isDesktop` / `isMobile` state?
- `useAISidebar()` values:
  - `open`?
  - `viewMode` (`sidebar` or `popup`)?
  - `isFullScreen`?
- Does the URL include `aiSidebar`, `viewMode`, `isFullScreen` query params?
- On mobile with a selected thread, is the mobile thread overlay covering the list?
- Is the topbar CSS height var applied (no content hiding)?

## Relevant Files

- `apps/mail/app/(routes)/layout.tsx` – top-level providers and `AppTopbar`
- `apps/mail/app/(routes)/mail/layout.tsx` – section layout with `AppSidebar` and `Outlet`
- `apps/mail/app/(routes)/mail/page.tsx` – redirects to `/mail/inbox`
- `apps/mail/app/(routes)/mail/[folder]/page.tsx` – validates folder and renders `MailLayout`
- `apps/mail/components/mail/mail.tsx` – main mail UI composition
- `apps/mail/components/ui/ai-sidebar.tsx` – AI view state and rendering (sidebar/popup/fullscreen)
- `apps/mail/components/ai-toggle-button.tsx` – bottom-right AI toggle button
- `apps/mail/components/app-topbar.tsx` – sets `--app-topbar-height` and renders the top bar
- `apps/mail/components/ui/app-sidebar.tsx` – left navigation and compose controls

## Tips

- To force the AI popup open in popup mode:
  - Append `?aiSidebar=true&viewMode=popup` to the URL
- To switch modes quickly, use the chat header buttons (toggle popup/sidebar, toggle fullscreen)
- When testing layout, resize across the `md` breakpoint to verify both mobile and desktop behavior

## Latest Architecture Fix (Flex vs Resizable Conflicts)

**Root Cause**: Conflicts between Flexbox automatic space calculation and ResizablePanelGroup's manual dimension setting created layout instability and "floating up" behavior.

**Key Issues Fixed**:

1. **Flex vs Resizable Conflict**: 
   - **Before**: Mixed flex and resizable systems fought for control
   - **After**: CSS Grid for layout structure, ResizablePanelGroup isolated from flex calculations

2. **Layout System Separation**: 
   - **Root Layout**: CSS Grid (`grid-rows-[auto_1fr]`) for predictable topbar/content split
   - **Mail Layout**: CSS Grid (`grid-cols-[auto_1fr]`) for sidebar/content split  
   - **Resizable Area**: Isolated container with `minWidth: 0` on all panels

3. **Panel Shrinking Issues**:
   - Added `style={{ minWidth: 0 }}` to all ResizablePanel components
   - This allows panels to shrink below content size without layout conflicts

**Why This Fixes the "Floating Up" Issue**:
- CSS Grid provides predictable, explicit space allocation
- ResizablePanelGroup operates in isolation from parent layout calculations
- No flex-basis vs width conflicts during user resizing
- Panels respect their allocated space without fighting parent containers

**Architecture Benefits**:
- ✅ **Predictable Layout**: CSS Grid eliminates flex calculation conflicts
- ✅ **Proper Isolation**: ResizablePanelGroup doesn't interfere with topbar positioning  
- ✅ **Smooth Resizing**: `minWidth: 0` prevents content-size blocking
- ✅ **Stable Sizing**: Works consistently in both 2-panel and 3-panel configurations

## UI Visualization (Desktop)

This section provides a simplified visual representation of the mail layout in different states.

### Default State: `/mail/inbox`

This is the standard two-panel view for mail content.

```text
+--------------------------------------------------------------------------------------+
| AppTopbar (fixed)                                                                    |
+--------------------------------------------------------------------------------------+
| AppSidebar | MailList Panel (Resizable)     | ThreadDisplay Panel (Resizable)        |
| (fixed)    |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
+--------------------------------------------------------------------------------------+
|                                                                    [AI Toggle Btn]   |
+--------------------------------------------------------------------------------------+
```

### AI Popup State: `/mail/inbox?aiSidebar=true&viewMode=popup`

When the AI is opened in popup mode, it renders as an overlay, typically in the bottom-right corner of the screen.

```text
+--------------------------------------------------------------------------------------+
| AppTopbar (fixed)                                                                    |
+--------------------------------------------------------------------------------------+
| AppSidebar | MailList Panel (Resizable)     | ThreadDisplay Panel (Resizable)        |
| (fixed)    |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |                                        |
|            |                                |      +-----------------------------+   |
|            |                                |      | AISidebar (Popup Overlay)   |   |
|            |                                |      |                             |   |
|            |                                |      +-----------------------------+   |
|            |                                |                                        |
+--------------------------------------------------------------------------------------+
```

### AI Sidebar State: `/mail/inbox?aiSidebar=true` (with `viewMode='sidebar'`)

When the AI is opened and the view mode is set to 'sidebar', it appears as a third, resizable column on the right.

```text
+----------------------------------------------------------------------------------------------------------+
| AppTopbar (fixed)                                                                                        |
+----------------------------------------------------------------------------------------------------------+
| AppSidebar | MailList Panel (Resizable)     | ThreadDisplay Panel (Resizable)    | AISidebar Panel (Resizable) |
| (fixed)    |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
|            |                                |                                    |                             |
+----------------------------------------------------------------------------------------------------------+
```
