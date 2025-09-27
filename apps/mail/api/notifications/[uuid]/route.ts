import { z } from 'zod';
import { validateApiKey, getUserFromRequest } from '../../../lib/api-auth';
import { getNotificationById, updateNotificationStatus, deleteNotification } from '../../../lib/notifications';
import { rateLimiter } from '../../../middleware/rate-limit';

// Mock Next.js types for development
interface NextRequest {
  headers: { get(name: string): string | null; };
  json(): Promise<any>;
  url: string;
}

interface NextResponse {
  json(body: any, init?: { status?: number }): Response;
}

// Mock NextResponse for development
const NextResponse = {
  json: (body: any, init?: { status?: number }): Response => {
    return new Response(JSON.stringify(body), {
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Validation schema for updating notification
const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

interface RouteParams {
  params: { uuid: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    // Authentication (API key or session)
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuid = params.uuid;
    if (!uuid || typeof uuid !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Get notification
    const notification = await getNotificationById(uuid, userId);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('GET /api/notifications/[uuid] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    // Authentication
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuid = params.uuid;
    if (!uuid || typeof uuid !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    // Check if notification exists first
    const notification = await getNotificationById(uuid, userId);
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update notification
    if (validatedData.isRead !== undefined) {
      const updated = await updateNotificationStatus(uuid, userId, validatedData.isRead);
      if (!updated) {
        return NextResponse.json(
          { error: 'Failed to update notification' },
          { status: 500 }
        );
      }
    }

    // Return updated notification
    const updatedNotification = await getNotificationById(uuid, userId);

    return NextResponse.json({
      success: true,
      data: updatedNotification
    });

  } catch (error) {
    console.error('PATCH /api/notifications/[uuid] error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      );
    }

    // Authentication
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate UUID format
    const uuid = params.uuid;
    if (!uuid || typeof uuid !== 'string') {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    // Delete notification
    const deleted = await deleteNotification(uuid, userId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Notification not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('DELETE /api/notifications/[uuid] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}