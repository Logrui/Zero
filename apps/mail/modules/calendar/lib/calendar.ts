// Module-local calendar client shim
// TODO: Wire these functions to the app's tRPC once endpoints are available.
import { trpcClient } from '@/providers/query-provider';

// Mock mode toggle: when true, return synthetic data instead of calling TRPC.
// Enable by setting NEXT_PUBLIC_CALENDAR_MOCK=true in your env.
const USE_MOCK = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CALENDAR_MOCK === 'true';

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  location?: string
  start: string // ISO
  end?: string // ISO
  allDay?: boolean
  categoryId?: string
  source?: 'local' | 'google'
  isShared?: boolean
  recurrence?: any
  timezone?: string
  color?: string
  userId?: string
  reminders?: Array<{ minutes: number; method: 'popup' | 'email' }>
  isRecurringInstance?: boolean
  originalEventId?: string
  exceptionDate?: string
};

export async function getEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  if (USE_MOCK) return mockEvents(userId, start, end);
  try {
    const data = await trpcClient.calendar.getEvents.query({ start, end });
    return (data as any[]) as CalendarEvent[];
  } catch (e) {
    console.error('[calendar.getEvents] failed', e);
    return [];
  }
}

export async function getSharedEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  if (USE_MOCK) return mockSharedEvents(userId, start, end);
  // No dedicated shared-events endpoint yet; return empty list for now
  return [];
}

export async function getUserCategories(userId: string): Promise<Array<{ id: string; name: string }>> {
  if (USE_MOCK) return mockCategories();
  try {
    const cats = await trpcClient.calendar.getUserCategories.query();
    return (cats as any[]).map((c: any) => ({ id: c.id ?? c.name, name: c.name ?? c.id }));
  } catch (e) {
    console.error('[calendar.getUserCategories] failed', e);
    return [];
  }
}

// Optional import/export helpers used by ImportExportDialog
export async function importFromICS(userId: string, icsContent: string): Promise<{ imported: number; errors: number }> {
  // Stub implementation
  return { imported: 0, errors: 0 };
}

export async function exportToICS(userId: string, start: Date, end: Date): Promise<string> {
  // Stub implementation
  return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
}

export async function importFromCSV(userId: string, csvContent: string): Promise<{ imported: number; errors: number }> {
  // Stub implementation
  return { imported: 0, errors: 0 };
}

export async function exportToCSV(userId: string, start: Date, end: Date): Promise<string> {
  // Stub implementation
  return 'title,start,end';
}

export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  // Stub implementation until OAuth/connection layer is wired
  return false;
}

// Mutations used by EventDialog
export async function createEvent(event: CalendarEvent): Promise<CalendarEvent> {
  try {
    const payload = {
      title: event.title,
      start: event.start,
      end: event.end ?? event.start,
      allDay: !!event.allDay,
      description: event.description,
      location: event.location,
      color: event.color,
      categoryId: event.categoryId,
    };
    const res = await trpcClient.calendar.createEvent.mutate(payload as any);
    return { ...event, ...(res as any) } as CalendarEvent;
  } catch (e) {
    console.error('[calendar.createEvent] failed', e);
    throw e;
  }
}

export async function updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
  try {
    const { id, ...data } = event;
    await trpcClient.calendar.updateEvent.mutate({ id, data });
    return event;
  } catch (e) {
    console.error('[calendar.updateEvent] failed', e);
    throw e;
  }
}

export async function deleteEvent(userId: string, eventId: string, deleteSeries?: boolean): Promise<boolean> {
  try {
    // No delete endpoint yet; mark as soft-delete via update if needed
    await trpcClient.calendar.updateEvent.mutate({ id: eventId, data: { deleted: true } });
    return true;
  } catch (e) {
    console.error('[calendar.deleteEvent] failed', e);
    return false;
  }
}

// ---------------------------
// Mock helpers (used when NEXT_PUBLIC_CALENDAR_MOCK=true)
// ---------------------------
function mockCategories(): Array<{ id: string; name: string }> {
  return [
    { id: 'Work', name: 'Work' },
    { id: 'Personal', name: 'Personal' },
    { id: 'Family', name: 'Family' },
  ];
}

function mockEvents(userId: string, start: Date, end: Date): CalendarEvent[] {
  const within = (d: Date) => d >= start && d <= end;
  const baseDay = new Date(start);
  const samples: CalendarEvent[] = [
    {
      id: 'm-1',
      title: 'Team Standup',
      start: toISO(atTime(addDaysClamped(baseDay, 1), 9, 0)),
      end: toISO(atTime(addDaysClamped(baseDay, 1), 9, 30)),
      categoryId: 'Work',
      source: 'local',
    },
    {
      id: 'm-2',
      title: 'Lunch with Sam',
      start: toISO(atTime(addDaysClamped(baseDay, 2), 12, 30)),
      end: toISO(atTime(addDaysClamped(baseDay, 2), 13, 30)),
      categoryId: 'Personal',
      source: 'local',
      location: 'Cafe Central',
    },
    {
      id: 'm-3',
      title: 'Dentist',
      start: toISO(atTime(addDaysClamped(baseDay, 3), 16, 0)),
      end: toISO(atTime(addDaysClamped(baseDay, 3), 17, 0)),
      categoryId: 'Personal',
      source: 'local',
    },
  ];
  return samples.filter((e) => within(new Date(e.start)));
}

function mockSharedEvents(userId: string, start: Date, end: Date): CalendarEvent[] {
  const baseDay = new Date(start);
  return [
    {
      id: 's-1',
      title: 'All-hands (Shared)',
      start: toISO(atTime(addDaysClamped(baseDay, 4), 10, 0)),
      end: toISO(atTime(addDaysClamped(baseDay, 4), 11, 0)),
      isShared: true,
      source: 'local',
      categoryId: 'Work',
    },
  ];
}

function toISO(d: Date): string {
  return new Date(d).toISOString();
}

function atTime(d: Date, hour: number, minute: number): Date {
  const n = new Date(d);
  n.setHours(hour, minute, 0, 0);
  return n;
}

function addDaysClamped(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}
