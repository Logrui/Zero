import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import { env } from '../env';

export const resend = () =>
  env.RESEND_API_KEY
    ? new Resend(env.RESEND_API_KEY)
    : { emails: { send: async (...args: unknown[]) => console.log(args) } };

export const redis = () => {
  try {
    return new Redis({
      url: env.REDIS_URL,
      token: env.REDIS_TOKEN,
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.pow(2, retryCount) * 1000,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
    // Fallback mock for development if Redis connection fails
    return {
      get: async (key: string) => {
        console.log(`[REDIS:FALLBACK] GET ${key}`);
        return null;
      },
      set: async (key: string, value: string, options?: { ex?: number }) => {
        console.log(`[REDIS:FALLBACK] SET ${key} = ${value}`, options);
        return 'OK';
      },
      del: async (key: string) => {
        console.log(`[REDIS:FALLBACK] DEL ${key}`);
        return 1;
      },
    } as any;
  }
};

export const twilio = () => {
  // Twilio disabled - return mock implementation
  console.log('[TWILIO:DISABLED] Twilio functionality is disabled');

  return {
    messages: {
      send: async (to: string, body: string) => {
        console.log(`[TWILIO:MOCK] Would send message to ${to}: ${body}`);
        return { sid: 'mock-message-sid' };
      },
    },
  };
};
