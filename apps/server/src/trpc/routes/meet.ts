import { activeDriverProcedure, createRateLimiterMiddleware, router } from '../trpc';
import { isProCustomer } from '../../lib/utils';
import { Ratelimit } from '@upstash/ratelimit';
import { TRPCError } from '@trpc/server';
import { env } from '../../env';

type MeetResponse = {
  success: boolean;
  data: {
    created_at: string;
    id: string;
    is_large: boolean;
    live_stream_on_start: boolean;
    persist_chat: boolean;
    record_on_start: boolean;
    status: string;
    summarize_on_end: boolean;
    updated_at: string;
  };
};

export const meetRouter = router({
  create: activeDriverProcedure
    .use(
      createRateLimiterMiddleware({
        limiter: Ratelimit.slidingWindow(10, '1m'),
        generatePrefix: ({ sessionUser }) => `ratelimit:meet-create-${sessionUser?.id}`,
      }),
    )
    .mutation(async () => {
      const enableMeet = env.ENABLE_MEET === 'true';
      if (!enableMeet) return new Response('Not implemented', { status: 501 });
      // Autumn integration removed - assuming non-pro customer

      if (!isProCustomer()) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Customer is not a pro customer, please upgrade to a pro plan',
        });
      }

      const AuthHeader = env.MEET_AUTH_HEADER;
      const response = await fetch(env.MEET_API_URL + '/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AuthHeader,
        },
      });

      if (!response.ok) {
        console.error(await response.text());
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create meeting' });
      }

      const data = await response.json<MeetResponse>();
      return data;
    }),
});
