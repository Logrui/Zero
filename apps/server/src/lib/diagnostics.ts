import { createDb } from '../db';
import { connection } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { env } from '../env';
import { createDriver } from './driver';
import type { Context } from 'hono';

export async function revokeAndReauthorizeConnection(c: Context) {
  const userId = c.req.query('userId') || c.var.sessionUser?.id;
  const connectionId = c.req.query('connectionId');

  if (!userId) {
    return c.json({ error: 'userId is required (either as query param or authenticated session)' }, 400);
  }

  if (!connectionId) {
    return c.json({ error: 'connectionId is required' }, 400);
  }

  console.log('🔄 [revokeAndReauthorizeConnection] Starting re-auth for user:', userId, 'connection:', connectionId);

  try {
    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

    // Find the connection
    const connection = await db.query.connection.findFirst({
      where: and(
        eq(connection.userId, userId),
        eq(connection.id, connectionId),
        eq(connection.providerId, 'google')
      )
    });

    if (!connection) {
      await conn.end();
      return c.json({ error: 'Connection not found' }, 404);
    }

    // Revoke the current tokens
    const driver = createDriver('google', {
      auth: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        userId,
        email: connection.email,
      },
    });

    try {
      await driver.revokeToken(connection.refreshToken || connection.accessToken);
      console.log('✅ [revokeAndReauthorizeConnection] Successfully revoked tokens for:', connection.email);
    } catch (revokeError) {
      console.warn('⚠️ [revokeAndReauthorizeConnection] Failed to revoke tokens (may already be invalid):', revokeError);
    }

    // Delete the connection from database
    await db.delete(connection).where(eq(connection.id, connectionId));

    await conn.end();

    return c.json({
      message: 'Connection revoked successfully. Please re-authorize through the frontend.',
      connectionId,
      email: connection.email,
      nextStep: 'User needs to re-authorize this connection through the Google OAuth flow to get calendar permissions'
    });

  } catch (error: any) {
    console.error('❌ [revokeAndReauthorizeConnection] Re-auth failed:', error);
    return c.json({ error: error.message }, 500);
  }
}

export async function diagnoseGoogleConnection(c: Context) {
  const userId = c.req.query('userId') || c.var.sessionUser?.id;

  if (!userId) {
    return c.json({ error: 'userId is required (either as query param or authenticated session)' }, 400);
  }

  console.log('🔍 [diagnoseGoogleConnection] Starting diagnosis for user:', userId);

  try {
    const { db, conn } = createDb(env.HYPERDRIVE.connectionString);

    // Check for Google connections
    const googleConnections = await db
      .select()
      .from(connection)
      .where(
        and(
          eq(connection.userId, userId),
          eq(connection.providerId, 'google')
        )
      );

      console.log('🔍 [diagnoseGoogleConnection] Found Google connections:', {
        count: googleConnections.length,
        connections: googleConnections.map(conn => ({
          id: conn.id,
          email: conn.email,
          hasAccessToken: !!conn.accessToken,
          hasRefreshToken: !!conn.refreshToken,
          scope: conn.scope,
          expiresAt: conn.expiresAt
        }))
      });

      // Check for missing calendar scopes
      const requiredScopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];

      const missingScopesByConnection = googleConnections.map(conn => {
        const currentScopes = conn.scope?.split(' ') || [];
        const missingScopes = requiredScopes.filter(scope => !currentScopes.includes(scope));
        return {
          connectionId: conn.id,
          email: conn.email,
          currentScopes,
          missingScopes,
          hasAllScopes: missingScopes.length === 0
        };
      });

      console.log('🔍 [diagnoseGoogleConnection] Missing scopes analysis:', missingScopesByConnection);

    // Check for local calendar events
    const { calendarEvent } = await import('../db/schema');
    const localEvents = await db
      .select()
      .from(calendarEvent)
      .where(eq(calendarEvent.userId, userId))
      .limit(5);

    console.log('🔍 [diagnoseGoogleConnection] Found local events:', {
      count: localEvents.length,
      events: localEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
      }))
    });

    await conn.end();

    return c.json({
      userId,
      googleConnections: googleConnections.length,
      hasValidTokens: googleConnections.some(conn => conn.accessToken && conn.refreshToken),
      hasCalendarScope: googleConnections.some(conn => conn.scope?.includes('calendar')!),
      localEventCount: localEvents.length,
      diagnosis: {
        hasGoogleConnection: googleConnections.length > 0,
        hasValidTokens: googleConnections.some(conn => conn.accessToken && conn.refreshToken),
        hasCalendarScope: googleConnections.some(conn => conn.scope?.includes('calendar')!),
        hasLocalEvents: localEvents.length > 0,
        tokensExpired: googleConnections.some(conn => conn.expiresAt && conn.expiresAt < new Date()),
        missingScopes: missingScopesByConnection.filter(conn => conn.missingScopes.length > 0)
      },
      connections: googleConnections.map(conn => ({
        id: conn.id,
        email: conn.email,
        providerId: conn.providerId,
        hasAccessToken: !!conn.accessToken,
        hasRefreshToken: !!conn.refreshToken,
        scope: conn.scope,
        expiresAt: conn.expiresAt
      })),
      missingScopesDetail: missingScopesByConnection,
      localEvents: localEvents.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        source: event.source
      }))
    });

  } catch (error: any) {
    console.error('❌ [diagnoseGoogleConnection] diagnosis failed:', error);
    return c.json({ error: error.message }, 500);
  }
}
