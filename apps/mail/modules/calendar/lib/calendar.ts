// Module-local calendar client shim
// TODO: Wire these functions to the app's tRPC once endpoints are available.
import { trpcClient } from '@/providers/query-provider';

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
  try {
    const data = await trpcClient.calendar.getEvents.query({ start, end });
    return (data as any[]) as CalendarEvent[];
  } catch (e) {
    console.error('[calendar.getEvents] failed', e);
    return [];
  }
}

export async function getSharedEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
  // No dedicated shared-events endpoint yet; return empty list for now
  return [];
}

export async function getUserCategories(userId: string): Promise<Array<{ id: string; name: string }>> {
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
