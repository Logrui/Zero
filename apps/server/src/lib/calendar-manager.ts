import { getZeroDB } from './server-utils';
import type { CalendarEvent, UnsavedCalendarEvent } from '../types/calendar';

export class CalendarManager {
  constructor() {}

  async getEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    const db = await getZeroDB(userId);
    return await db.findEventsByDateRange(start, end);
  }

  async getUserCategories(userId: string) {
    const db = await getZeroDB(userId);
    return await db.findUserCategories();
  }

  async createEvent(userId: string, event: UnsavedCalendarEvent) {
    const db = await getZeroDB(userId);
    return await db.createEvent(event);
  }

  async updateEvent(userId: string, eventId: string, event: Partial<UnsavedCalendarEvent>) {
    const db = await getZeroDB(userId);
    // TODO: Implement updateEvent on the ZeroDB class
    // return await db.updateEvent(eventId, event);
    return { success: true };
  }
}
