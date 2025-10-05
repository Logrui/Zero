# TRPC Implementation in ZeroOS

## What is TRPC?

**tRPC** (TypeScript Remote Procedure Call) is a framework that provides **end-to-end type safety** between your frontend and backend without code generation. It's like having a direct function call from your frontend to your backend, but over HTTP.

## Core Concepts

### 1. **Type-Safe API Calls**
Instead of writing REST endpoints and manually typing responses, TRPC lets you call backend functions directly:

```typescript
// ❌ Traditional REST API
const response = await fetch('/api/tasks');
const tasks = await response.json(); // No type safety!

// ✅ TRPC
const tasks = await trpcClient.tasks.getTasks.query(); // Fully typed!
```

### 2. **Automatic Serialization**
TRPC automatically handles:
- Converting TypeScript objects to JSON
- Date serialization/deserialization
- Error handling
- Request/response validation

### 3. **Real-time Type Safety**
If you change a backend function signature, your frontend will immediately show TypeScript errors - no more API mismatches!

## How ZeroOS Uses TRPC

### **Backend Pattern: Router + Manager**

#### 1. **TRPC Router** (`apps/server/src/trpc/routes/`)
```typescript
// apps/server/src/trpc/routes/calendar.ts
export const calendarRouter = router({
  getEvents: privateProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const calendarManager = new CalendarManager();
      return await calendarManager.getEvents(ctx.sessionUser.id, input);
    }),
    
  createEvent: privateProcedure
    .input(z.object({ title: z.string(), start: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const calendarManager = new CalendarManager();
      return await calendarManager.createEvent(ctx.sessionUser.id, input);
    })
});
```

#### 2. **Manager Class** (`apps/server/src/lib/`)
```typescript
// apps/server/src/lib/calendar-manager.ts
export class CalendarManager {
  async getEvents(userId: string, filters: EventFilters): Promise<Event[]> {
    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
    try {
      const events = await db.select().from(events).where(eq(events.userId, userId));
      return events;
    } finally {
      await conn.end(); // Always close connections!
    }
  }
}
```

#### 3. **Router Registration** (`apps/server/src/trpc/index.ts`)
```typescript
export const appRouter = router({
  calendar: calendarRouter,
  tasks: tasksRouter,
  // ... other routers
});
```

### **Frontend Pattern: Module + Hooks**

#### 1. **TRPC Client Module** (`apps/mail/modules/`)
```typescript
// apps/mail/modules/calendar/lib/calendar.ts
export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  const data = await trpcClient.calendar.getEvents.query(filters);
  return data as Event[];
}

export async function createEvent(eventData: CreateEventData): Promise<Event> {
  const data = await trpcClient.calendar.createEvent.mutate(eventData);
  return data as Event;
}
```

#### 2. **React Hooks** (`apps/mail/app/`)
```typescript
// apps/mail/app/calendar/hooks/useCalendar.ts
export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  
  const fetchEvents = useCallback(async () => {
    const fetchedEvents = await getEvents();
    setEvents(fetchedEvents);
  }, []);
  
  return { events, fetchEvents };
}
```

## Key ZeroOS Patterns

### **1. Authentication: `privateProcedure`**
```typescript
// Automatic authentication - no manual auth checks needed!
export const tasksRouter = router({
  getTasks: privateProcedure  // ← Automatically gets ctx.sessionUser.id
    .query(async ({ ctx }) => {
      // ctx.sessionUser.id is automatically available
      return await tasksManager.getTasks(ctx.sessionUser.id);
    })
});
```

### **2. Database Access: `createDb()` Pattern**
```typescript
// Always use this pattern for database access
const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
try {
  const results = await db.select().from(table).where(conditions);
  return results;
} finally {
  await conn.end(); // Critical: Always close connections!
}
```

### **3. Input Validation: Zod Schemas**
```typescript
.input(z.object({
  title: z.string().min(1).max(200),
  due: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal')
}))
```

### **4. Error Handling: Automatic**
```typescript
// TRPC automatically handles:
// - Network errors
// - Validation errors  
// - Server errors
// - Type mismatches

try {
  const task = await trpcClient.tasks.createTask.mutate(data);
} catch (error) {
  // Error is automatically typed and includes helpful messages
  console.error('Failed to create task:', error.message);
}
```

## Benefits in ZeroOS

### **1. No More 401/500 Errors**
- `privateProcedure` handles authentication automatically
- No manual session checks needed
- Consistent auth across all endpoints

### **2. Type Safety End-to-End**
```typescript
// If you change the backend:
// Before: { title: string, due: Date }
// After:  { title: string, due: string }

// Frontend immediately shows TypeScript errors!
const task = await trpcClient.tasks.createTask.mutate({
  title: "New Task",
  due: new Date() // ❌ Error: Expected string, got Date
});
```

### **3. Simplified Code**
```typescript
// ❌ Old REST pattern
const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
if (!response.ok) throw new Error('Request failed');
const task = await response.json();

// ✅ New TRPC pattern  
const task = await trpcClient.tasks.createTask.mutate(data);
```

### **4. Automatic Serialization**
```typescript
// Dates, complex objects, etc. are handled automatically
const task = await trpcClient.tasks.createTask.mutate({
  title: "Task",
  due: new Date(), // Automatically serialized to ISO string
  labels: ["urgent", "work"] // Arrays handled automatically
});
```

## File Structure in ZeroOS

```
apps/server/src/
├── trpc/
│   ├── index.ts              # Router registration
│   └── routes/
│       ├── calendar.ts       # Calendar TRPC router
│       └── tasks.ts          # Tasks TRPC router
└── lib/
    ├── calendar-manager.ts   # Calendar business logic
    └── tasks-manager.ts      # Tasks business logic

apps/mail/
├── modules/
│   └── calendar/
│       └── lib/
│           └── calendar.ts   # Frontend TRPC client
└── app/
    └── calendar/
        └── hooks/
            └── useCalendar.ts # React hooks
```

## Why This Pattern Works

1. **Separation of Concerns**: Routers handle HTTP, Managers handle business logic
2. **Reusability**: Manager classes can be used by CLI, tests, etc.
3. **Type Safety**: Full TypeScript support from database to UI
4. **Consistency**: Same pattern across all modules (calendar, tasks, etc.)
5. **Maintainability**: Changes to backend immediately reflect in frontend

## Migration from REST to TRPC

The tasks implementation shows this migration:

**Before (REST):**
- Manual auth checks
- Manual error handling  
- Manual serialization
- Type mismatches
- 401/500 errors

**After (TRPC):**
- Automatic auth via `privateProcedure`
- Automatic error handling
- Automatic serialization
- Full type safety
- No more auth errors

## Implementation Checklist

### Backend Implementation
- [ ] Create TRPC router in `apps/server/src/trpc/routes/[module].ts`
- [ ] Create Manager class in `apps/server/src/lib/[module]-manager.ts`
- [ ] Register router in `apps/server/src/trpc/index.ts`
- [ ] Use `privateProcedure` for authentication
- [ ] Use `createDb()` pattern for database access
- [ ] Add Zod validation schemas
- [ ] Always close database connections with `conn.end()`

### Frontend Implementation
- [ ] Create TRPC client module in `apps/mail/modules/[module]/lib/[module].ts`
- [ ] Update React hooks to use TRPC client
- [ ] Remove old REST API calls
- [ ] Update TypeScript types to match backend
- [ ] Test all CRUD operations

### Testing
- [ ] Verify no 401/500 errors
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Verify type safety
- [ ] Test error handling

## Common Patterns

### Query vs Mutation
```typescript
// Queries: Read operations (GET)
getTasks: privateProcedure.query(async ({ ctx }) => {
  return await tasksManager.getTasks(ctx.sessionUser.id);
});

// Mutations: Write operations (POST, PUT, DELETE)
createTask: privateProcedure.mutation(async ({ ctx, input }) => {
  return await tasksManager.createTask(ctx.sessionUser.id, input);
});
```

### Input Validation
```typescript
.input(z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  due: z.string().optional(), // ISO 8601 date string
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  labels: z.array(z.string()).default([])
}))
```

### Error Handling
```typescript
try {
  const result = await trpcClient.tasks.createTask.mutate(data);
  // Success handling
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // Handle auth error
  } else if (error.data?.code === 'BAD_REQUEST') {
    // Handle validation error
  } else {
    // Handle other errors
  }
}
```

## Best Practices

1. **Always use `privateProcedure`** for authenticated endpoints
2. **Always close database connections** with `conn.end()`
3. **Use Zod schemas** for input validation
4. **Keep Manager classes simple** - just database operations
5. **Use descriptive function names** in routers
6. **Handle errors gracefully** in frontend
7. **Test thoroughly** after migration from REST

## Troubleshooting

### Common Issues
- **401 Unauthorized**: Check if using `privateProcedure`
- **500 Server Error**: Check database connection handling
- **Type Errors**: Ensure frontend types match backend
- **Connection Leaks**: Verify `conn.end()` is called

### Debug Tips
- Check server logs for TRPC errors
- Use browser dev tools to inspect TRPC calls
- Verify authentication state
- Test with simple queries first

This documentation should help developers understand and implement TRPC patterns consistently across ZeroOS.
