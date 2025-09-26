import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { CalendarEvent } from '../types/calendar';

export interface GoogleCalendarConfig {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export interface GoogleCalendar {
  id: string;
  name: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: string;
}

export class GoogleCalendarService {
  private calendar: any;
  private oauth2Client: OAuth2Client;

  constructor(config: GoogleCalendarConfig) {
    console.log('🔍 [GoogleCalendarService] Initializing with config', {
      hasAccessToken: !!config.accessToken,
      hasRefreshToken: !!config.refreshToken,
      clientId: config.clientId?.substring(0, 20) + '...'
    });

    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'http://localhost:8787/auth/callback/google' // Redirect URI
    );

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    // Initialize Calendar API
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.oauth2Client,
    });

    console.log('✅ [GoogleCalendarService] Initialized successfully');
  }

  /**
   * Fetch events from Google Calendar within a date range
   */
  async fetchEvents(startDate: Date, endDate: Date, calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    console.log('🔍 [GoogleCalendarService.fetchEvents] Starting fetch', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      calendarId
    });

    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Google Calendar API limit
      });

      const googleEvents = response.data.items || [];
      console.log('📊 [GoogleCalendarService.fetchEvents] Raw Google events received', {
        eventCount: googleEvents.length,
        calendarId
      });

      // Convert Google Calendar events to our CalendarEvent format
      const calendarEvents = googleEvents.map(this.convertGoogleEventToCalendarEvent);
      
      console.log('✅ [GoogleCalendarService.fetchEvents] Events converted', {
        eventCount: calendarEvents.length,
        calendarId
      });

      return calendarEvents;
    } catch (error) {
      console.error('❌ [GoogleCalendarService.fetchEvents] Failed to fetch events', {
        error: error.message,
        calendarId,
        code: error.code
      });

      // Handle specific error cases
      if (error.code === 401) {
        console.log('🔄 [GoogleCalendarService.fetchEvents] Access token expired, attempting refresh');
        await this.refreshAccessToken();
        // Retry once after token refresh
        return this.fetchEvents(startDate, endDate, calendarId);
      }

      if (error.code === 429) {
        console.log('⏳ [GoogleCalendarService.fetchEvents] Rate limit exceeded, implementing backoff');
        await this.exponentialBackoff();
        return this.fetchEvents(startDate, endDate, calendarId);
      }

      throw error;
    }
  }

  /**
   * Create an event in Google Calendar
   */
  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<string> {
    console.log('🔍 [GoogleCalendarService.createEvent] Creating event', {
      title: event.title,
      start: event.start,
      end: event.end,
      calendarId
    });

    try {
      const googleEvent = this.convertCalendarEventToGoogleEvent(event);
      
      const response = await this.calendar.events.insert({
        calendarId,
        resource: googleEvent,
      });

      const googleEventId = response.data.id;
      console.log('✅ [GoogleCalendarService.createEvent] Event created successfully', {
        googleEventId,
        title: event.title
      });

      return googleEventId;
    } catch (error) {
      console.error('❌ [GoogleCalendarService.createEvent] Failed to create event', {
        error: error.message,
        title: event.title,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Update an event in Google Calendar
   */
  async updateEvent(googleEventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary'): Promise<void> {
    console.log('🔍 [GoogleCalendarService.updateEvent] Updating event', {
      googleEventId,
      title: event.title,
      calendarId
    });

    try {
      const googleEvent = this.convertCalendarEventToGoogleEvent(event as CalendarEvent);
      
      await this.calendar.events.update({
        calendarId,
        eventId: googleEventId,
        resource: googleEvent,
      });

      console.log('✅ [GoogleCalendarService.updateEvent] Event updated successfully', {
        googleEventId,
        title: event.title
      });
    } catch (error) {
      console.error('❌ [GoogleCalendarService.updateEvent] Failed to update event', {
        error: error.message,
        googleEventId,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Delete an event from Google Calendar
   */
  async deleteEvent(googleEventId: string, calendarId: string = 'primary'): Promise<void> {
    console.log('🔍 [GoogleCalendarService.deleteEvent] Deleting event', {
      googleEventId,
      calendarId
    });

    try {
      await this.calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      });

      console.log('✅ [GoogleCalendarService.deleteEvent] Event deleted successfully', {
        googleEventId
      });
    } catch (error) {
      console.error('❌ [GoogleCalendarService.deleteEvent] Failed to delete event', {
        error: error.message,
        googleEventId,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * List all calendars for the authenticated user
   */
  async listCalendars(): Promise<GoogleCalendar[]> {
    console.log('🔍 [GoogleCalendarService.listCalendars] Fetching user calendars');

    try {
      const response = await this.calendar.calendarList.list();
      const calendars = response.data.items || [];

      console.log('✅ [GoogleCalendarService.listCalendars] Calendars fetched', {
        calendarCount: calendars.length
      });

      return calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        primary: cal.primary,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        accessRole: cal.accessRole,
      }));
    } catch (error) {
      console.error('❌ [GoogleCalendarService.listCalendars] Failed to fetch calendars', {
        error: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Convert Google Calendar event to our CalendarEvent format
   */
  private convertGoogleEventToCalendarEvent = (googleEvent: any): CalendarEvent => {
    const start = googleEvent.start?.dateTime || googleEvent.start?.date;
    const end = googleEvent.end?.dateTime || googleEvent.end?.date;
    const allDay = !googleEvent.start?.dateTime; // All-day events use 'date' instead of 'dateTime'

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || null,
      start: start,
      end: end,
      allDay,
      location: googleEvent.location || null,
      color: null, // Google Calendar uses calendar colors, not event colors
      categoryId: null,
      userId: '', // Will be set by CalendarManager
      googleEventId: googleEvent.id,
      googleCalendarId: googleEvent.organizer?.email || 'primary',
      syncStatus: 'synced',
      lastSynced: new Date().toISOString(),
      createdAt: googleEvent.created,
      updatedAt: googleEvent.updated,
      // Additional Google Calendar specific fields
      attendees: googleEvent.attendees?.map((attendee: any) => attendee.email) || [],
      reminders: googleEvent.reminders?.overrides?.map((reminder: any) => ({
        minutes: reminder.minutes,
        method: reminder.method,
      })) || [],
      recurringEventId: googleEvent.recurringEventId,
      originalStartTime: googleEvent.originalStartTime?.dateTime || googleEvent.originalStartTime?.date,
      status: googleEvent.status,
      htmlLink: googleEvent.htmlLink,
      hangoutLink: googleEvent.hangoutLink,
      conferenceData: googleEvent.conferenceData,
    };
  };

  /**
   * Convert our CalendarEvent to Google Calendar event format
   */
  private convertCalendarEventToGoogleEvent = (event: CalendarEvent): any => {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      location: event.location,
    };

    // Handle all-day vs timed events
    if (event.allDay) {
      // All-day events use date format (YYYY-MM-DD)
      googleEvent.start = {
        date: new Date(event.start).toISOString().split('T')[0],
      };
      googleEvent.end = {
        date: new Date(event.end).toISOString().split('T')[0],
      };
    } else {
      // Timed events use dateTime format
      googleEvent.start = {
        dateTime: event.start,
        timeZone: 'America/New_York', // TODO: Use user's timezone
      };
      googleEvent.end = {
        dateTime: event.end,
        timeZone: 'America/New_York', // TODO: Use user's timezone
      };
    }

    // Add attendees if present
    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map(email => ({ email }));
    }

    // Add reminders if present
    if (event.reminders && event.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders,
      };
    }

    return googleEvent;
  };

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    console.log('🔄 [GoogleCalendarService.refreshAccessToken] Refreshing access token');

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      console.log('✅ [GoogleCalendarService.refreshAccessToken] Token refreshed successfully');
    } catch (error) {
      console.error('❌ [GoogleCalendarService.refreshAccessToken] Failed to refresh token', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Implement exponential backoff for rate limiting
   */
  private async exponentialBackoff(attempt: number = 1): Promise<void> {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
    console.log(`⏳ [GoogleCalendarService.exponentialBackoff] Waiting ${delay}ms (attempt ${attempt})`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Test the connection to Google Calendar API
   */
  async testConnection(): Promise<boolean> {
    console.log('🔍 [GoogleCalendarService.testConnection] Testing API connection');

    try {
      await this.calendar.calendarList.list({ maxResults: 1 });
      console.log('✅ [GoogleCalendarService.testConnection] Connection successful');
      return true;
    } catch (error) {
      console.error('❌ [GoogleCalendarService.testConnection] Connection failed', {
        error: error.message,
        code: error.code
      });
      return false;
    }
  }
}
