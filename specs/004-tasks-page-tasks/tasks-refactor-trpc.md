# Tasks: Refactor Tasks to TRPC Pattern (Align with Calendar)

**Goal**: Refactor the tasks implementation to use TRPC like the calendar module, eliminating REST API issues and aligning with ZeroOS architecture patterns.

**Input**: Existing calendar implementation as reference pattern
**Prerequisites**: Existing tasks database schema, calendar TRPC router pattern

## Execution Strategy

This refactoring will:
1. Keep existing database schema (already defined)
2. Create TRPC router similar to calendar
3. Create TasksManager class similar to CalendarManager
4. Update frontend to use TRPC instead of REST
5. Preserve existing UI components

## Phase 1: Backend - TRPC Router & Manager

### Setup
- [ ] **T001** Study calendar TRPC pattern in `apps/server/src/trpc/routes/calendar.ts` and `apps/server/src/lib/calendar-manager.ts`

### TRPC Router
- [ ] **T002** Create TRPC tasks router in `apps/server/src/trpc/routes/tasks.ts`
  - Use `privateProcedure` for automatic authentication
  - Implement: getTasks, getTask, createTask, updateTask, deleteTask, toggleTask
  - Use Zod schemas for input validation
  - Follow calendar router pattern exactly

### Tasks Manager
- [ ] **T003** Create TasksManager class in `apps/server/src/lib/tasks-manager.ts`
  - Use `createDb(env.HYPERDRIVE.connectionString)` pattern like CalendarManager
  - Implement getTasks(userId, filters?)
  - Implement getTask(userId, taskId)
  - Implement createTask(userId, data)
  - Implement updateTask(userId, taskId, data)
  - Implement deleteTask(userId, taskId)
  - Implement toggleTask(userId, taskId)
  - Always close database connection with `conn.end()`

### Google Tasks Integration
- [ ] **T004** Add Google Tasks sync methods to TasksManager
  - Implement syncWithGoogleTasks(userId)
  - Implement getSyncStatus(userId)
  - Use existing GoogleTasksService for API calls
  - Follow calendar's Google Calendar sync pattern

### Register Router
- [ ] **T005** Register tasks router in `apps/server/src/trpc/index.ts`
  - Add `import { tasksRouter } from './routes/tasks'`
  - Add `tasks: tasksRouter` to appRouter

## Phase 2: Frontend - Update to TRPC

### Remove Old API Client
- [ ] **T006** Comment out REST API calls in `apps/mail/app/tasks/services/googleTasksApi.ts`
  - Keep file for reference but mark as deprecated
  - Add comment explaining migration to TRPC

### Update Hooks to Use TRPC
- [ ] **T007** Refactor `apps/mail/app/tasks/hooks/useTasks.ts`
  - Replace REST calls with `trpcClient.tasks.*`
  - Use TRPC queries: `trpcClient.tasks.getTasks.query()`
  - Use TRPC mutations: `trpcClient.tasks.createTask.mutate(data)`
  - Follow calendar hooks pattern

- [ ] **T008** Refactor `apps/mail/app/tasks/hooks/useGoogleTasks.ts`
  - Replace permission check REST calls with TRPC
  - Simplify authentication flow
  - Remove custom auth state management if possible

- [ ] **T009** Refactor `apps/mail/app/tasks/hooks/useSync.ts`
  - Use TRPC for sync operations
  - Simplify sync status tracking
  - Follow calendar sync pattern

### Update Components (if needed)
- [ ] **T010** Update `apps/mail/app/(routes)/tasks/page.tsx`
  - Verify it works with updated hooks
  - Remove any direct REST API calls
  - Test authentication flow

- [ ] **T011** Update `apps/mail/app/tasks/components/SyncStatus.tsx`
  - Ensure sync status works with TRPC
  - Simplify if possible

## Phase 3: Cleanup & Testing

### Remove Old Backend Files
- [ ] **T012** Clean up or deprecate old REST API files
  - Keep for reference: `apps/server/src/api/tasks/` directory
  - Add deprecation comments
  - Update `apps/server/src/main.ts` to remove REST route mounting (or comment out)

### Remove Old Models (Optional)
- [ ] **T013** Decide on old model files
  - Option A: Keep them and integrate with TasksManager
  - Option B: Deprecate and use simple database queries
  - Document decision in this file

### Testing
- [ ] **T014** Test basic task operations
  - Create task
  - List tasks
  - Update task
  - Delete task
  - Toggle task completion

- [ ] **T015** Test Google Tasks sync
  - Verify sync to Google Tasks works
  - Verify sync from Google Tasks works
  - Test offline queue

- [ ] **T016** Test authentication
  - Verify TRPC auth works automatically
  - No more 401 errors
  - Permission checks work correctly

- [ ] **T017** Test UI components
  - All stats cards show correct data
  - Task list renders correctly
  - Task creation/editing works
  - Sync button functions properly

## Phase 4: Polish

- [ ] **T018** Update API documentation
  - Document TRPC procedures
  - Add examples
  - Note deprecation of REST API

- [ ] **T019** Performance optimization
  - Add database indexes if needed
  - Optimize query patterns
  - Test with large task lists

- [ ] **T020** Error handling
  - Ensure proper error messages
  - Handle offline scenarios
  - Add retry logic where appropriate

## Dependencies

**Sequential Dependencies:**
- T001 must complete before T002-T003
- T002-T005 must complete before T006-T011
- T006-T011 must complete before T012-T017
- T012-T017 must complete before T018-T020

**Parallel Opportunities:**
- T002, T003, T004 can run in parallel (different files)
- T007, T008, T009 can run in parallel (different files)
- T010, T011 can run in parallel (different files)
- T014, T015, T016, T017 can run in parallel (different test scenarios)

## Success Criteria

✅ Tasks page loads without 401 errors
✅ Tasks page loads without 500 errors
✅ All CRUD operations work through TRPC
✅ Google Tasks sync works correctly
✅ Authentication handled automatically by TRPC
✅ No TRPC routing errors
✅ UI matches design from backup page
✅ Performance is good (no db leaks)

## Key Differences from Old Implementation

### Old (REST API):
```typescript
// Manual auth check
const response = await fetch('/api/tasks/list', {
  credentials: 'include' // Hope auth works
});
```

### New (TRPC):
```typescript
// Automatic auth via privateProcedure
const tasks = await trpcClient.tasks.getTasks.query();
// ctx.sessionUser.id automatically available
```

### Old (Complex Models):
```typescript
// getZeroDB returns stub, need type assertions
const db = await getZeroDB(userId) as any;
```

### New (Simple Queries):
```typescript
// Direct database access like CalendarManager
const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
const tasks = await db.select().from(tasks).where(...);
await conn.end();
```

## Reference Files

Study these calendar files as examples:
- `apps/server/src/trpc/routes/calendar.ts` - TRPC router pattern
- `apps/server/src/lib/calendar-manager.ts` - Manager class pattern
- `apps/mail/modules/calendar/lib/calendar.ts` - Frontend TRPC usage
- `apps/mail/modules/calendar/components/multi-calendar-view.tsx` - Component usage

## Notes

- This is a **refactoring**, not a rewrite from scratch
- We keep the good parts (UI, database schema, components)
- We replace the problematic parts (REST API, auth, complex models)
- Goal is to align with existing ZeroOS patterns
- Calendar implementation is our blueprint

