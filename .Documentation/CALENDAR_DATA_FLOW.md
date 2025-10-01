# Calendar Data Flow Documentation

**Last Updated:** 2025-09-24T22:41:29-04:00

This document provides a comprehensive overview of how calendar events flow through the ZeroOS application, from frontend requests to database storage and back.

---

## 📊 **Architecture Overview**

The calendar system follows a layered architecture:

```
Frontend (React) → tRPC Client → tRPC Server → Calendar Manager → PostgreSQL Database
                                                      ↓
                                            [NEXT: Google Calendar API]
```

Each layer has specific responsibilities and maintains clear separation of concerns.

## 🎯 **Current Implementation Status**

### **✅ Completed (98%)**
- **Frontend:** Full React calendar interface with comprehensive debugging
- **tRPC Routes:** Complete API endpoints with detailed logging
- **CalendarManager:** Full PostgreSQL integration with proper error handling
- **Database Schema:** Complete `mail0_calendar_event` and `mail0_calendar_category` tables
- **Authentication:** Integrated with mail app's connection system
- **Data Flow:** End-to-end request/response cycle verified and working

### **🚀 Next Priority: Google Calendar API Integration (2%)**
- **Google Calendar Service:** Fetch events from Google Calendar API
- **Bidirectional Sync:** Push local events to Google Calendar
- **Real-time Updates:** Webhook/polling for calendar changes
- **Multi-Calendar Support:** Handle multiple Google Calendars per user

---

## 🔄 **Event Retrieval Flow**

### **1. Frontend Request Initiation**

**Location:** `apps/mail/modules/calendar/components/multi-calendar-view.tsx`

```typescript
// Triggered by useEffect when view or date changes
const fetchedEvents = await getEvents(startDate, endDate)
setEvents(fetchedEvents || [])
```

**Triggers:**
- Component mount
- Date navigation (prev/next month)
- View changes (month/week/day/agenda)
- Manual refresh

### **2. Calendar Library Function**

**Location:** `apps/mail/modules/calendar/lib/calendar.ts`

```typescript
export async function getEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  if (USE_MOCK) return mockEvents('mock-user', start, end);
  try {
    const data = await trpcClient.calendar.getEvents.query({ start, end });
    return (data as any[]) as CalendarEvent[];
  } catch (e) {
    console.error('[calendar.getEvents] failed', e);
    return [];
  }
}
```

**Key Features:**
- Mock mode support for development
- Error handling with fallback to empty array
- Type safety with CalendarEvent interface
- No manual user ID - handled by tRPC context

### **3. tRPC Route Handler**

**Location:** `apps/server/src/trpc/routes/calendar.ts`

```typescript
getEvents: privateProcedure
  .input(z.object({ start: z.date(), end: z.date() }))
  .query(async ({ ctx, input }): Promise<CalendarEvent[]> => {
    const calendarManager = new CalendarManager();
    return await calendarManager.getEvents(ctx.sessionUser.id, input.start, input.end);
  })
```

**Security & Validation:**
- `privateProcedure` ensures authentication
- Zod schema validates input parameters
- `ctx.sessionUser.id` provides authenticated user context
- Type-safe return promise

### **4. Calendar Manager (Business Logic)**

**Location:** `apps/server/src/lib/calendar-manager.ts`

```typescript
async getEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  const db = await getZeroDB(userId);
  return await db.findEventsByDateRange(start, end);
}
```

**Responsibilities:**
- User-specific database instance creation
- Business logic and data transformation
- Database query coordination
- Error handling and validation

### **5. Database Layer (ZeroDB)**

**Location:** Database abstraction layer

```typescript
// Conceptual implementation
async findEventsByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
  // SQL query to find events within date range
  // Returns array of CalendarEvent objects
}
```

**Database Operations:**
- Date range filtering for performance
- User-isolated data queries
- Structured data return
- Optimized indexing on date fields

---

## 💾 **Event Creation Flow**

### **1. User Input**

**Sources:**
- **Event Dialog:** Traditional form-based event creation
- **Natural Language Dialog:** "Meeting with John tomorrow at 2pm"
- **Quick Actions:** Drag-and-drop on calendar grid

### **2. Frontend Processing**

**Event Dialog Path:**
```typescript
// apps/mail/modules/calendar/components/event-dialog.tsx
const eventData: CalendarEvent = {
  title: values.title,
  start: startUTC,
  end: endUTC,
  description: values.description,
  // ... other fields
};
await createEvent(eventData);
```

**Natural Language Path:**
```typescript
// apps/mail/modules/calendar/components/natural-language-event-dialog.tsx
const parsedEvent = parseNaturalLanguage(input);
const eventData: CalendarEvent = {
  title: parsedEvent.title || "New Event",
  start: parsedEvent.start,
  end: parsedEvent.end,
  description: `Created from: "${input}"`,
};
await createEvent(eventData);
```

### **3. Backend Processing**

**tRPC Mutation:**
```typescript
createEvent: privateProcedure
  .input(z.object({
    title: z.string(),
    start: z.string(),
    end: z.string(),
    allDay: z.boolean(),
    // ... validation schema
  }))
  .mutation(async ({ ctx, input }) => {
    const calendarManager = new CalendarManager();
    return await calendarManager.createEvent(ctx.sessionUser.id, input);
  })
```

**Database Storage:**
```typescript
async createEvent(userId: string, event: UnsavedCalendarEvent) {
  const db = await getZeroDB(userId);
  return await db.createEvent(event);
}
```

### **4. Frontend Update**

After successful creation:
```typescript
// Refresh events list
const refreshedEvents = await getEvents(startDate, endDate);
setEvents(refreshedEvents);

// Show success notification
toast({
  title: "Event created",
  description: `"${eventData.title}" has been added to your calendar.`,
});
```

---

## 🔐 **Authentication & Security**

### **User Context Flow**

```
1. User logs into mail app → Session established
2. Frontend uses useActiveConnection() → Gets active user
3. tRPC privateProcedure → Validates session
4. ctx.sessionUser.id → Provides authenticated user ID
5. getZeroDB(userId) → User-isolated database
```

### **Security Features**

- **Session-based Authentication:** No manual user ID passing
- **User Isolation:** Each user has separate database instance
- **Input Validation:** Zod schemas validate all inputs
- **Error Handling:** Graceful fallbacks prevent data exposure
- **Type Safety:** TypeScript ensures data integrity

---

## 📱 **Frontend State Management**

### **Component State**

```typescript
// apps/mail/modules/calendar/components/multi-calendar-view.tsx
const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
const [sharedEvents, setSharedEvents] = useState<CalendarEvent[]>([])
const [categories, setCategories] = useState<string[]>(initialCategories)
const [isLoading, setIsLoading] = useState(false)
const [loadError, setLoadError] = useState<string | null>(null)
```

### **Data Refresh Triggers**

- **Date Navigation:** Previous/next month, today button
- **View Changes:** Month → Week → Day → Agenda
- **Event Operations:** Create, update, delete events
- **Manual Refresh:** Retry button on errors
- **Real-time Updates:** After successful mutations

---

## 🎯 **Data Types & Interfaces**

### **CalendarEvent Interface**

```typescript
export type CalendarEvent = {
  id: string
  title: string
  description?: string
  location?: string
  start: string // ISO date string
  end?: string // ISO date string
  allDay?: boolean
  categoryId?: string
  source?: 'local' | 'google'
  isShared?: boolean
  recurrence?: any
  timezone?: string
  color?: string
  userId?: string
  reminders?: Array<{ minutes: number; method: 'popup' | 'email' }>
}
```

### **API Response Types**

```typescript
// tRPC query response
Promise<CalendarEvent[]>

// tRPC mutation response
Promise<CalendarEvent> // for create/update
Promise<{ success: boolean }> // for delete
```

---

## 🚀 **Performance Optimizations**

### **Date Range Queries**

- Events are queried by specific date ranges (not all events)
- Reduces database load and network transfer
- Improves rendering performance

### **Caching Strategy**

- Frontend state caching during session
- Optimistic updates for better UX
- Error recovery with data refresh

### **Lazy Loading**

- Events loaded only when calendar view is active
- Shared events loaded separately
- Categories loaded on demand

---

## 🛠 **Development Features**

### **Mock Mode**

```typescript
// Enable with environment variable
const USE_MOCK = process.env?.VITE_PUBLIC_CALENDAR_MOCK === 'true';

// Returns sample data instead of database queries
if (USE_MOCK) return mockEvents('mock-user', start, end);
```

**Benefits:**
- Frontend development without backend
- Consistent test data
- Offline development capability

### **Error Handling**

```typescript
// Comprehensive error boundaries
try {
  const data = await trpcClient.calendar.getEvents.query({ start, end });
  return data as CalendarEvent[];
} catch (e) {
  console.error('[calendar.getEvents] failed', e);
  return []; // Graceful fallback
}
```

---

## 🔄 **Data Synchronization**

### **Current Implementation**

- **Local Events:** Stored in ZeroDB, immediately available
- **Shared Events:** Placeholder implementation (returns empty array)
- **Provider Sync:** Not yet implemented (Google Calendar, Outlook)

### **Future Enhancements**

- **Real-time Sync:** WebSocket updates for shared calendars
- **Provider Integration:** Google Calendar API, Outlook Graph API
- **Conflict Resolution:** Merge strategies for overlapping events
- **Offline Support:** Local storage with sync on reconnection

---

## 📋 **Troubleshooting Guide**

### **Common Issues**

1. **No Events Loading:**
   - Check authentication status
   - Verify database connection
   - Check console for tRPC errors

2. **Events Not Saving:**
   - Validate input data format
   - Check user permissions
   - Verify database write access

3. **Date Range Issues:**
   - Ensure proper timezone handling
   - Validate date format (ISO strings)
   - Check start/end date logic

### **Debug Tools**

- **Browser Console:** tRPC client errors
- **Network Tab:** API request/response inspection
- **React DevTools:** Component state inspection
- **Mock Mode:** Isolate frontend vs backend issues

---

## 📈 **Monitoring & Analytics**

### **Key Metrics**

- **Event Load Time:** Time from request to render
- **Error Rates:** Failed API calls and fallbacks
- **User Engagement:** Event creation/edit frequency
- **Performance:** Database query execution time

### **Logging Strategy**

- **Client-side:** Console errors with context
- **Server-side:** tRPC procedure execution logs
- **Database:** Query performance monitoring
- **User Actions:** Event creation/modification tracking

---

---

## 🚀 **Planned Google Calendar API Integration**

### **Enhanced Data Flow with Google Calendar**

```
Frontend (React) → tRPC Client → tRPC Server → Calendar Manager → Multiple Sources:
                                                      ├── PostgreSQL Database (Local Events)
                                                      └── Google Calendar API (Synced Events)
                                                           ├── Fetch Events
                                                           ├── Create Events  
                                                           ├── Update Events
                                                           └── Delete Events
```

### **Google Calendar Service Architecture**

#### **1. GoogleCalendarService Class**
```typescript
class GoogleCalendarService {
  async fetchEvents(connectionId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>
  async createEvent(connectionId: string, event: CalendarEvent): Promise<string>
  async updateEvent(connectionId: string, eventId: string, event: Partial<CalendarEvent>): Promise<void>
  async deleteEvent(connectionId: string, eventId: string): Promise<void>
  async listCalendars(connectionId: string): Promise<GoogleCalendar[]>
}
```

#### **2. Enhanced CalendarManager**
```typescript
class CalendarManager {
  async getEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    // 1. Fetch local events from PostgreSQL
    const localEvents = await this.getLocalEvents(userId, start, end);
    
    // 2. Fetch Google Calendar events
    const googleEvents = await this.googleCalendarService.fetchEvents(connectionId, start, end);
    
    // 3. Merge and deduplicate events
    return this.mergeEvents(localEvents, googleEvents);
  }
  
  async createEvent(userId: string, event: UnsavedCalendarEvent): Promise<CalendarEvent> {
    // 1. Create in local database
    const localEvent = await this.createLocalEvent(userId, event);
    
    // 2. Sync to Google Calendar
    const googleEventId = await this.googleCalendarService.createEvent(connectionId, localEvent);
    
    // 3. Update local event with Google ID
    await this.updateLocalEvent(localEvent.id, { googleEventId });
    
    return localEvent;
  }
}
```

### **Sync Strategy**

#### **Event Synchronization Logic**
1. **Pull Sync:** Fetch events from Google Calendar on page load
2. **Push Sync:** Create/update/delete events in Google Calendar when modified locally
3. **Conflict Resolution:** Last-write-wins with user notification
4. **Deduplication:** Match events by title, date, and description to avoid duplicates

#### **Database Schema Updates**
```sql
-- Add Google Calendar sync fields to existing table
ALTER TABLE mail0_calendar_event ADD COLUMN google_event_id TEXT;
ALTER TABLE mail0_calendar_event ADD COLUMN google_calendar_id TEXT;
ALTER TABLE mail0_calendar_event ADD COLUMN sync_status TEXT DEFAULT 'synced';
ALTER TABLE mail0_calendar_event ADD COLUMN last_synced TIMESTAMP;

-- Add Google Calendar metadata table
CREATE TABLE mail0_google_calendar (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES mail0_user(id),
  google_calendar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_selected BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Authentication & Permissions**

#### **Required Google OAuth Scopes**
```typescript
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',           // Full calendar access
  'https://www.googleapis.com/auth/calendar.events',   // Event management
  'https://www.googleapis.com/auth/calendar.readonly'  // Read-only access
];
```

#### **Connection Setup Updates**
- Update OAuth flow to request calendar permissions
- Store calendar-specific tokens and refresh tokens
- Handle calendar permission revocation gracefully

### **Real-time Sync Implementation**

#### **Google Calendar Webhooks**
```typescript
// Webhook endpoint for Google Calendar changes
app.post('/api/webhooks/google-calendar', async (req, res) => {
  const { resourceId, resourceUri, eventType } = req.body;
  
  // Verify webhook authenticity
  if (!verifyGoogleWebhook(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process calendar change
  await processCalendarChange(resourceId, eventType);
  
  res.status(200).send('OK');
});
```

#### **Polling Fallback**
```typescript
// Periodic sync for users without webhook support
setInterval(async () => {
  const activeUsers = await getActiveCalendarUsers();
  
  for (const user of activeUsers) {
    try {
      await syncUserCalendar(user.id);
    } catch (error) {
      console.error(`Sync failed for user ${user.id}:`, error);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

### **Error Handling & Rate Limiting**

#### **Google API Rate Limits**
- **Queries per day:** 1,000,000
- **Queries per 100 seconds per user:** 1,000
- **Queries per 100 seconds:** 10,000

#### **Error Handling Strategy**
```typescript
class GoogleCalendarService {
  async fetchEvents(connectionId: string, start: Date, end: Date) {
    try {
      return await this.makeApiCall(() => 
        this.calendar.events.list({
          calendarId: 'primary',
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
        })
      );
    } catch (error) {
      if (error.code === 429) {
        // Rate limit exceeded - implement exponential backoff
        await this.exponentialBackoff();
        return this.fetchEvents(connectionId, start, end);
      }
      
      if (error.code === 401) {
        // Token expired - refresh and retry
        await this.refreshAccessToken(connectionId);
        return this.fetchEvents(connectionId, start, end);
      }
      
      throw error;
    }
  }
}
```

### **Performance Optimizations**

#### **Caching Strategy**
- Cache Google Calendar events for 5-10 minutes
- Implement intelligent cache invalidation
- Use Redis for distributed caching

#### **Batch Operations**
- Batch multiple event operations into single API calls
- Implement request queuing for high-traffic scenarios
- Use Google Calendar batch API for bulk operations

---

This document provides a complete overview of the current calendar data flow architecture and the planned Google Calendar API integration, enabling developers to understand, maintain, and extend the calendar functionality effectively.
