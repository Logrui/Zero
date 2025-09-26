import { router, privateProcedure } from '../trpc';
import { CalendarManager } from '../../lib/calendar-manager';
import { z } from 'zod';

import type { CalendarEvent, UnsavedCalendarEvent } from '../../types/calendar';


export const calendarRouter = router({
  getEvents: privateProcedure
    .input(z.object({ start: z.date(), end: z.date() }))
    .query(async ({ ctx, input }): Promise<CalendarEvent[]> => {
      console.log('🔍 [tRPC.calendar.getEvents] Starting request', {
        userId: ctx.sessionUser.id,
        start: input.start.toISOString(),
        end: input.end.toISOString(),
        sessionUser: ctx.sessionUser
      });
      
      const calendarManager = new CalendarManager();
      const events = await calendarManager.getEvents(ctx.sessionUser.id, input.start, input.end);
      
      console.log('✅ [tRPC.calendar.getEvents] Response ready', {
        userId: ctx.sessionUser.id,
        eventCount: events?.length || 0,
      });
      
      return events;
    }),

  // getUserCategories: privateProcedure
  //   .query(async ({ ctx }): Promise<CalendarCategory[]> => {
  //     console.log('🔍 [tRPC.calendar.getUserCategories] Starting request', {
  //       userId: ctx.sessionUser.id,
  //       sessionUser: ctx.sessionUser
  //     });

  //     const calendarManager = new CalendarManager();
  //     const categories = await calendarManager.getUserCategories(ctx.sessionUser.id);

  //     console.log('✅ [tRPC.calendar.getUserCategories] Response ready', {
  //       userId: ctx.sessionUser.id,
  //       categoryCount: categories?.length || 0,
  //       categories: categories
  //     });

  //     return categories;
  //   }),

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
        // categoryId: z.string().optional(),
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
