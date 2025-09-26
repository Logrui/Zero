import { createDb } from '../db';
import { calendarEvent, connection } from '../db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import { env } from '../env';
import { GoogleCalendarService } from './google-calendar-service';
import type { CalendarEvent, UnsavedCalendarEvent } from '../types/calendar';

export class CalendarManager {
  constructor() {}

  async getEvents(userId: string, start: Date, end: Date): Promise<CalendarEvent[]> {
    console.log('🔍 [CalendarManager.getEvents] Starting event retrieval', {
      userId,
      start: start.toISOString(),
      end: end.toISOString()
    });

    // Add error boundary to catch any issues
    try {

    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
    console.log('📦 [CalendarManager.getEvents] Database connection created');

    try {
      // 1. Fetch local events from database - events that overlap with the date range
      console.log('🔍 [CalendarManager.getEvents] Fetching local events from database...');
      const localEvents = await db
        .select()
        .from(calendarEvent)
        .where(
          and(
            eq(calendarEvent.userId, userId),
            lte(calendarEvent.start, end),
            gte(calendarEvent.end, start)
          )
        );

      console.log('📊 [CalendarManager.getEvents] Local events retrieved', {
        userId,
        localEventCount: localEvents.length,
        events: localEvents
      });

      // 2. Try to fetch Google Calendar events
      let googleEvents: CalendarEvent[] = [];
      try {
        console.log('🔍 [CalendarManager.getEvents] Attempting Google Calendar service creation...');
        const googleCalendarService = await this.getGoogleCalendarService(userId);
        console.log('🔍 [CalendarManager.getEvents] Google Calendar service result:', {
          hasService: !!googleCalendarService
        });

        if (googleCalendarService) {
          console.log('🌐 [CalendarManager.getEvents] Fetching from Google Calendar');
          googleEvents = await googleCalendarService.fetchEvents(start, end);
          console.log('📊 [CalendarManager.getEvents] Google events retrieved', {
            googleEventCount: googleEvents.length,
            events: googleEvents
          });
        } else {
          console.log('⚠️ [CalendarManager.getEvents] No Google Calendar connection available');
        }
      } catch (error) {
        console.error('❌ [CalendarManager.getEvents] Google Calendar fetch failed', {
          error: error.message,
          stack: error.stack
        });
        // Continue with local events only
      }

      // 3. Merge and deduplicate events
      const allEvents = this.mergeEvents(localEvents, googleEvents);

      console.log('✅ [CalendarManager.getEvents] Event retrieval completed', {
        userId,
        localEventCount: localEvents.length,
        googleEventCount: googleEvents.length,
        totalEventCount: allEvents.length
      });

      await conn.end();
      return allEvents;
    } catch (error) {
      console.error('❌ [CalendarManager.getEvents] Event retrieval failed', error);
      await conn.end();
      throw error;
    }
    } catch (outerError) {
      console.error('❌ [CalendarManager.getEvents] CRITICAL ERROR - Method failed completely', {
        error: outerError.message,
        stack: outerError.stack,
        userId
      });
      // Return empty array instead of throwing to prevent complete failure
      return [];
    }
  }

  async createEvent(userId: string, event: UnsavedCalendarEvent) {
    console.log('🔍 [CalendarManager.createEvent] Starting database insert', { userId, event });
    
    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
    
    try {
      const newEvent = await db
        .insert(calendarEvent)
        .values({
          id: crypto.randomUUID(),
          userId,
          title: event.title,
          description: event.description,
          start: new Date(event.start),
          end: new Date(event.end),
          allDay: event.allDay,
          location: event.location,
          color: event.color,
          // categoryId: event.categoryId,
        })
        .returning();
      
      console.log('✅ [CalendarManager.createEvent] Event created', { newEvent });
      await conn.end();
      return newEvent[0];
    } catch (error) {
      console.error('❌ [CalendarManager.createEvent] Failed to create event', error);
      await conn.end();
    }
  }

  async updateEvent(userId: string, eventId: string, event: Partial<UnsavedCalendarEvent>) {
    console.log('🔍 [CalendarManager.updateEvent] Starting database update', { userId, eventId, event });

    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

    try {
      // Only update the fields that are explicitly provided
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (event.title !== undefined) updateData.title = event.title;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.location !== undefined) updateData.location = event.location;
      if (event.allDay !== undefined) updateData.allDay = event.allDay;
      if (event.start !== undefined) updateData.start = new Date(event.start);
      if (event.end !== undefined) updateData.end = new Date(event.end);
      if (event.color !== undefined) updateData.color = event.color;
      // if (event.categoryId !== undefined) updateData.categoryId = event.categoryId;

      const updatedEvent = await db
        .update(calendarEvent)
        .set(updateData)
        .where(and(
          eq(calendarEvent.id, eventId),
          eq(calendarEvent.userId, userId)
        ))
        .returning();

      console.log('✅ [CalendarManager.updateEvent] Event updated', { updatedEvent });
      await conn.end();
      return updatedEvent[0];
    } catch (error) {
      console.error('❌ [CalendarManager.updateEvent] Failed to update event', error);
      await conn.end();
      throw error;
    }
  }
  /**
   * Get Google Calendar service for a user if they have a valid connection
   */
  private async getGoogleCalendarService(userId: string): Promise<GoogleCalendarService | null> {
    console.log('🔍 [CalendarManager.getGoogleCalendarService] Looking for Google connection', { userId });

    try {
      console.log('🔍 [CalendarManager.getGoogleCalendarService] Creating database connection...');
      const { db, conn } = createDb(env.HYPERDRIVE.connectionString);
      console.log('🔍 [CalendarManager.getGoogleCalendarService] Database connection created');

      // Find user's Google connection
      const userConnection = await db
        .select()
        .from(connection)
        .where(
          and(
            eq(connection.userId, userId),
            eq(connection.providerId, 'google')
          )
        )
        .limit(1);

      console.log('🔍 [CalendarManager.getGoogleCalendarService] Connection query result:', {
        userId,
        connectionCount: userConnection.length,
        connections: userConnection
      });

      if (!userConnection.length) {
        console.log('⚠️ [CalendarManager.getGoogleCalendarService] No Google connection found', { userId });
        await conn.end();
        return null;
      }

      const conn_data = userConnection[0];

      console.log('🔍 [CalendarManager.getGoogleCalendarService] Connection data:', {
        userId,
        connectionId: conn_data.id,
        providerId: conn_data.providerId,
        hasAccessToken: !!conn_data.accessToken,
        hasRefreshToken: !!conn_data.refreshToken,
        scope: conn_data.scope,
        scopeArray: conn_data.scope?.split(' ') || []
      });

      // Check if connection has required tokens
      if (!conn_data.accessToken || !conn_data.refreshToken) {
        console.log('⚠️ [CalendarManager.getGoogleCalendarService] Missing tokens', { userId });
        await conn.end();
        return null;
      }

      // Check if connection has calendar scope
      const scopeArray = conn_data.scope?.split(' ').filter(s => s.trim()) || [];
      const hasCalendarScope = scopeArray.some(scope =>
        scope.includes('calendar') || scope.includes('calendar.events')
      );

      console.log('🔍 [CalendarManager.getGoogleCalendarService] Scope analysis:', {
        userId,
        scope: conn_data.scope,
        scopeArray,
        hasCalendarScope,
        calendarScopes: scopeArray.filter(s => s.includes('calendar'))
      });

      if (!hasCalendarScope) {
        console.log('⚠️ [CalendarManager.getGoogleCalendarService] Missing calendar scope', {
          userId,
          scope: conn_data.scope,
          scopeArray,
          hasCalendarScope
        });
        await conn.end();
        return null;
      }

      await conn.end();

      console.log('🔍 [CalendarManager.getGoogleCalendarService] Creating GoogleCalendarService...');
      console.log('✅ [CalendarManager.getGoogleCalendarService] Connection found with calendar scope!', {
        userId,
        hasTokens: true,
        scope: conn_data.scope
      });

      const googleCalendarService = new GoogleCalendarService({
        accessToken: conn_data.accessToken,
        refreshToken: conn_data.refreshToken,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      });

      return googleCalendarService;
    } catch (error) {
      console.error('❌ [CalendarManager.getGoogleCalendarService] CRITICAL ERROR', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      return null;
    }
  }

  /**
   * Merge local and Google Calendar events, removing duplicates
   */
  private mergeEvents(localEvents: any[], googleEvents: CalendarEvent[]): CalendarEvent[] {
    console.log('🔍 [CalendarManager.mergeEvents] Merging events', {
      localCount: localEvents.length,
      googleCount: googleEvents.length
    });

    // Convert local events to CalendarEvent format
    const formattedLocalEvents: CalendarEvent[] = localEvents.map(event => ({
      ...event,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    })) as CalendarEvent[];

    // Create a map to track events and avoid duplicates
    const eventMap = new Map<string, CalendarEvent>();

    // Add local events first (they take precedence)
    formattedLocalEvents.forEach(event => {
      const key = this.createEventKey(event);
      eventMap.set(key, event);
    });

    // Add Google events, but skip if we already have a local version
    googleEvents.forEach(event => {
      const key = this.createEventKey(event);
      if (!eventMap.has(key)) {
        // Mark as Google-sourced event
        eventMap.set(key, {
          ...event,
          source: 'google',
          syncStatus: 'synced'
        });
      }
    });

    const mergedEvents = Array.from(eventMap.values());
    
    console.log('✅ [CalendarManager.mergeEvents] Events merged', {
      localCount: localEvents.length,
      googleCount: googleEvents.length,
      mergedCount: mergedEvents.length,
      duplicatesRemoved: (localEvents.length + googleEvents.length) - mergedEvents.length
    });

    return mergedEvents;
  }

  /**
   * Create a unique key for an event to detect duplicates
   */
  private createEventKey(event: CalendarEvent): string {
    // Use title, start time, and end time to create a unique key
    const title = event.title?.toLowerCase().trim() || '';
    const start = event.start;
    const end = event.end;
    
    return `${title}|${start}|${end}`;
  }
}
