import { dubAnalytics } from '@dub/better-auth';
import { type Account, betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { bearer, createAuthMiddleware, jwt, mcp, phoneNumber } from 'better-auth/plugins';
import { Dub } from 'dub';
import { Effect } from 'effect';
import { createDb } from '../db';
import { env } from '../env';
import { type EProviders } from '../types';
import { getSocialProviders } from './auth-providers';
import { disableBrainFunction } from './brain';
import { logDebug } from './debug-logger';
import { createDriver } from './driver';
import {
  AIWritingAssistantEmail,
  AutoLabelingEmail,
  CategoriesEmail,
  Mail0ProEmail,
  ShortcutsEmail,
  SuperSearchEmail,
  WelcomeEmail,
} from './react-emails/email-sequences';
import { defaultUserSettings } from './schemas';
import { getZeroDB, resetConnection } from './server-utils';
import { redis, resend, twilio } from './services';
import { getBrowserTimezone, isValidTimezone } from './timezones';

const scheduleCampaign = (userInfo: { address: string; name: string }) =>
  Effect.gen(function* () {
    const name = userInfo.name || 'there';
    const resendService = resend();

    const sendEmail = (subject: string, react: unknown, scheduledAt?: string) =>
      Effect.promise(() =>
        resendService.emails
          .send({
            from: '0.email <onboarding@0.email>',
            to: userInfo.address,
            subject,
            react: react as any,
            ...(scheduledAt && { scheduledAt }),
          })
          .then(() => void 0),
      );

    const emails = [
      {
        subject: 'Welcome to 0.email',
        react: WelcomeEmail({ name }),
        scheduledAt: undefined,
      },
      {
        subject: 'Mail0 Pro is here 🚀💼',
        react: Mail0ProEmail({ name }),
        scheduledAt: 'in 1 day',
      },
      {
        subject: 'Auto-labeling is here 🎉📥',
        react: AutoLabelingEmail({ name }),
        scheduledAt: 'in 2 days',
      },
      {
        subject: 'AI Writing Assistant is here 🤖💬',
        react: AIWritingAssistantEmail({ name }),
        scheduledAt: 'in 3 days',
      },
      {
        subject: 'Shortcuts are here 🔧🚀',
        react: ShortcutsEmail({ name }),
        scheduledAt: 'in 4 days',
      },
      {
        subject: 'Categories are here 📂🔍',
        react: CategoriesEmail({ name }),
        scheduledAt: 'in 5 days',
      },
      {
        subject: 'Super Search is here 🔍🚀',
        react: SuperSearchEmail({ name }),
        scheduledAt: 'in 6 days',
      },
    ];

    yield* Effect.all(
      emails.map((email) => sendEmail(email.subject, email.react, email.scheduledAt)),
      { concurrency: 'unbounded' },
    );
  });

const connectionHandlerHook = async (account: Account) => {
  logDebug(`connectionHandlerHook called for account: ${account.id}`);
  if (!account.accessToken || !account.refreshToken) {
    console.error('Missing Access/Refresh Tokens', { account });
    throw new APIError('EXPECTATION_FAILED', {
      message: 'Missing Access/Refresh Tokens, contact us on Discord for support',
    });
  }

  const driver = createDriver(account.providerId, {
    auth: {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      userId: account.userId,
      email: '',
    },
  });

  const userInfo = await driver.getUserInfo().catch(async () => {
    if (account.accessToken) {
      await driver.revokeToken(account.accessToken);
      await resetConnection(account.id);
    }
    throw new Response(null, { status: 301, headers: { Location: '/' } });
  });

  if (!userInfo?.address) {
    try {
      await Promise.allSettled(
        [account.accessToken, account.refreshToken]
          .filter(Boolean)
          .map((t) => driver.revokeToken(t as string)),
      );
      await resetConnection(account.id);
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
    }
    throw new Response(null, { status: 303, headers: { Location: '/' } });
  }

  const updatingInfo = {
    name: userInfo.name || 'Unknown',
    picture: userInfo.photo || '',
    accessToken: account.accessToken,
    refreshToken: account.refreshToken,
    scope: driver.getScope(),
    expiresAt: new Date(Date.now() + (account.accessTokenExpiresAt?.getTime() || 3600000)),
  };

  const db = await getZeroDB(account.userId);
  const [result] = await db.createConnection(
    account.providerId as EProviders,
    userInfo.address,
    updatingInfo,
  );

  if (env.NODE_ENV === 'production') {
    await Effect.runPromise(
      scheduleCampaign({ address: userInfo.address, name: userInfo.name || 'there' }),
    );
  }

  if (env.GOOGLE_S_ACCOUNT && env.GOOGLE_S_ACCOUNT !== '{}') {
    logDebug(`Sending message to subscribe_queue for connection: ${result.id}`);
    await env.subscribe_queue.send({
      connectionId: result.id,
      providerId: account.providerId,
    });
  }
};

export const createAuth = () => {
  const twilioClient = twilio();
  const dub = new Dub();

  return betterAuth({
    plugins: [
      dubAnalytics({
        dubClient: dub,
      }),
      mcp({
        loginPage: env.VITE_PUBLIC_APP_URL + '/login',
      }),
      jwt(),
      bearer(),
      phoneNumber({
        sendOTP: async ({ code, phoneNumber }) => {
          await twilioClient.messages
            .send(phoneNumber, `Your verification code is: ${code}, do not share it with anyone.`)
            .catch((error) => {
              console.error('Failed to send OTP', error);
              throw new APIError('INTERNAL_SERVER_ERROR', {
                message: `Failed to send OTP, ${error.message}`,
              });
            });
        },
      }),
    ],
    user: {
      deleteUser: {
        enabled: true,
        async sendDeleteAccountVerification(data) {
          const verificationUrl = data.url;

          await resend().emails.send({
            from: '0.email <no-reply@0.email>',
            to: data.user.email,
            subject: 'Delete your 0.email account',
            html: `
            <h2>Delete Your 0.email Account</h2>
            <p>Click the link below to delete your account:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
          `,
          });
        },
        beforeDelete: async (user, request) => {
          if (!request) throw new APIError('BAD_REQUEST', { message: 'Request object is missing' });
          const db = await getZeroDB(user.id);
          const connections = await db.findManyConnections();
          // Autumn integration removed

          const revokedAccounts = (
            await Promise.allSettled(
              connections.map(async (connection) => {
                if (!connection.accessToken || !connection.refreshToken) return false;
                await disableBrainFunction({
                  id: connection.id,
                  providerId: connection.providerId as EProviders,
                });
                const driver = createDriver(connection.providerId, {
                  auth: {
                    accessToken: connection.accessToken,
                    refreshToken: connection.refreshToken,
                    userId: user.id,
                    email: connection.email,
                  },
                });
                const token = connection.refreshToken;
                return await driver.revokeToken(token || '');
              }),
            )
          ).map((result) => {
            if (result.status === 'fulfilled') {
              return result.value;
            }
            return false;
          });

          if (revokedAccounts.every((value) => !!value)) {
            console.log('Failed to revoke some accounts');
          }

          await db.deleteUser();
        },
      },
    },
    databaseHooks: {
      account: {
        create: {
          after: connectionHandlerHook,
        },
        update: {
          after: connectionHandlerHook,
        },
      },
    },
    emailAndPassword: {
      enabled: false,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await resend().emails.send({
          from: '0.email <onboarding@0.email>',
          to: user.email,
          subject: 'Reset your password',
          html: `
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password:</p>
            <a href="${url}">${url}</a>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, token }) => {
        const verificationUrl = `${env.VITE_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&callbackURL=/settings/connections`;

        await resend().emails.send({
          from: '0.email <onboarding@0.email>',
          to: user.email,
          subject: 'Verify your 0.email account',
          html: `
            <h2>Verify Your 0.email Account</h2>
            <p>Click the link below to verify your email:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
          `,
        });
      },
    },
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        // all hooks that run on sign-up routes
        if (ctx.path.startsWith('/sign-up')) {
          // only true if this request is from a new user
          const newSession = ctx.context.newSession;
          if (newSession) {
            // Check if user already has settings
            const db = await getZeroDB(newSession.user.id);
            const existingSettings = await db.findUserSettings();

            if (!existingSettings) {
              // get timezone from vercel's header
              const headerTimezone = ctx.headers?.get('x-vercel-ip-timezone');
              // validate timezone from header or fallback to browser timezone
              const timezone =
                headerTimezone && isValidTimezone(headerTimezone)
                  ? headerTimezone
                  : getBrowserTimezone();
              // write default settings against the user
              await db.insertUserSettings({
                ...defaultUserSettings,
                timezone,
              });
            }
          }
        }
      }),
    },
    ...createAuthConfig(),
  });
};

const createAuthConfig = () => {
  const cache = redis();
  // Use HYPERDRIVE connection in production, fallback to DATABASE_URL in local development
  const connectionString = env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
  const { db } = createDb(connectionString);
  return {
    database: drizzleAdapter(db, { provider: 'pg' }),
    secondaryStorage: {
      get: async (key: string) => {
        try {
          const value = await cache.get(key);
          return typeof value === 'string' ? value : value ? JSON.stringify(value) : null;
        } catch (error) {
          console.warn(`[AUTH] Redis GET failed for key ${key}:`, error);
          return null;
        }
      },
      set: async (key: string, value: string, ttl?: number) => {
        try {
          if (ttl) await cache.set(key, value, { ex: ttl });
          else await cache.set(key, value);
        } catch (error) {
          console.warn(`[AUTH] Redis SET failed for key ${key}:`, error);
          // Don't throw - let auth continue without caching
        }
      },
      delete: async (key: string) => {
        try {
          await cache.del(key);
        } catch (error) {
          console.warn(`[AUTH] Redis DEL failed for key ${key}:`, error);
          // Don't throw - deletion failure shouldn't break auth
        }
      },
    },
    advanced: {
      ipAddress: {
        disableIpTracking: true,
      },
      cookiePrefix: env.NODE_ENV === 'development' ? 'better-auth-dev' : 'better-auth',
      crossSubDomainCookies: {
        enabled: true,
        domain: env.COOKIE_DOMAIN,
      },
    },
    baseURL: env.VITE_PUBLIC_BACKEND_URL,
    trustedOrigins: [
      'https://app.0.email',
      'https://sapi.0.email',
      'https://staging.0.email',
      'https://0.email',
      'http://localhost:3000',
      'http://localhost:3500',
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 3, // 1 day (every 1 day the session expiration is updated)
    },
    socialProviders: getSocialProviders(env as unknown as Record<string, string>),
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
        trustedProviders: ['google', 'microsoft'],
      },
    },
    onAPIError: {
      onError: (error) => {
        console.error('API Error', error);
      },
      errorURL: `${env.VITE_PUBLIC_APP_URL}/login`,
      throw: true,
    },
  } satisfies BetterAuthOptions;
};

export const createSimpleAuth = () => {
  return betterAuth(createAuthConfig());
};

export type Auth = ReturnType<typeof createAuth>;
export type SimpleAuth = ReturnType<typeof createSimpleAuth>;
