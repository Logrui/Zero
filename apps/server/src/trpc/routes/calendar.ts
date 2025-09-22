import { router, privateProcedure } from '../trpc';
import { CalendarManager } from '../../lib/calendar-manager';
import { z } from 'zod';

import type { CalendarEvent, CalendarCategory, UnsavedCalendarEvent } from '../../types/calendar';


export const calendarRouter = router({
  getEvents: privateProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }): Promise<CalendarEvent[]> => {
      const calendarManager = new CalendarManager();
      return await calendarManager.getEvents(ctx.sessionUser.id, input.start, input.end);
    }),

  getUserCategories: privateProcedure
    .query(async ({ ctx }): Promise<CalendarCategory[]> => {
      const calendarManager = new CalendarManager();
      return await calendarManager.getUserCategories(ctx.sessionUser.id);
    }),

  createEvent: privateProcedure
    .input(
      z.object({
        title: z.string(),
        start: z.string(),
        end: z.string(),
        allDay: z.boolean(),
        description: z.string().optional(),
        location: z.string().optional(),
        color: z.string().optional(),
        categoryId: z.string().optional(),
      }),
    ) // TODO: Add remaining fields
    .mutation(async ({ ctx, input }: { ctx: any, input: UnsavedCalendarEvent }) => {
      const calendarManager = new CalendarManager();
      return await calendarManager.createEvent(ctx.sessionUser.id, input);
    }),

  updateEvent: privateProcedure
    .input(z.object({ id: z.string(), data: z.any() })) // TODO: Define a proper Zod schema
    .mutation(async ({ ctx, input }) => {
      const calendarManager = new CalendarManager();
      // return await calendarManager.updateEvent(ctx.sessionUser.id, input.id, input.data);
      return { success: true };
    }),
});
