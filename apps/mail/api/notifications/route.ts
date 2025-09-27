import { z } from 'zod';
import { validateApiKey } from '../../lib/api-auth';
import { createNotification, getNotifications } from '../../lib/notifications';
import { rateLimiter } from '../../middleware/rate-limit';

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

// Validation schema for creating notifications
const createNotificationSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  body: z.string().min(1, 'Body is required').max(2000, 'Body too long'),
  tags: z.array(z.string()).min(1, 'At least one tag required').max(10, 'Too many tags'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
});

// Query parameters for GET requests
const getNotificationsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  tags: z.string().optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().optional(),
});

export async function POST(request: NextRequest) {
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

    // API key validation
    const apiKeyResult = await validateApiKey(request);
    if (!apiKeyResult.valid) {
      return NextResponse.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // Create notification
    const notification = await createNotification({
      ...validatedData,
      userId: apiKeyResult.userId!,
      apiKeyId: apiKeyResult.keyId!,
      source: 'api'
    });

    return NextResponse.json({
      success: true,
      data: {
        id: notification.id,
        subject: notification.subject,
        createdAt: notification.createdAt,
        priority: notification.priority
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/notifications error:', error);

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

export async function GET(request: NextRequest) {
  try {
    // API key validation (optional for GET - could be user session based)
    const url = new URL(request.url);
    const apiKey = request.headers.get('X-API-Key');
    
    let userId: string;
    if (apiKey) {
      const apiKeyResult = await validateApiKey(request);
      if (!apiKeyResult.valid) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      userId = apiKeyResult.userId!;
    } else {
      // TODO: Get userId from session/auth when user authentication is implemented
      // For now, return error requiring API key
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams);
    const validatedParams = getNotificationsSchema.parse(queryParams);

    // Parse tags if provided
    let tags: string[] | undefined;
    if (validatedParams.tags) {
      tags = validatedParams.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    // Get notifications
    const result = await getNotifications(userId, {
      page: validatedParams.page,
      limit: validatedParams.limit,
      tags,
      unreadOnly: validatedParams.unreadOnly,
      priority: validatedParams.priority,
      search: validatedParams.search
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validatedParams.limit)
        }
      }
    });

  } catch (error) {
    console.error('GET /api/notifications error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
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