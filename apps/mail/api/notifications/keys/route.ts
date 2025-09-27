import { z } from 'zod';
import { getUserFromRequest } from '../../../lib/api-auth';
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

// Mock API key data store for development
interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  userId: string;
  permissions: string[];
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

const mockApiKeys: ApiKeyData[] = [
  {
    id: 'key-1',
    name: 'Development Key',
    keyPrefix: 'zro_1234',
    userId: 'user-123',
    permissions: ['notifications:create', 'notifications:read'],
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    isActive: true
  }
];

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z.array(z.string()).optional().default(['notifications:create']),
  expiresAt: z.string().datetime().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (stricter for API key creation)
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

    // Authentication (requires user session, not API key)
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Check if user already has a key with this name
    const existingKey = mockApiKeys.find(k => k.name === validatedData.name && k.userId === userId);
    if (existingKey) {
      return NextResponse.json(
        { error: 'API key with this name already exists' },
        { status: 409 }
      );
    }

    // Generate new API key
    const newApiKey: ApiKeyData = {
      id: 'key-' + Math.random().toString(36).substr(2, 9),
      name: validatedData.name,
      keyPrefix: 'zro_' + Math.random().toString(36).substr(2, 8),
      userId,
      permissions: validatedData.permissions,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Store the key
    mockApiKeys.push(newApiKey);

    // Generate full key for one-time display (in production, this would be properly generated)
    const fullKey = newApiKey.keyPrefix + '_' + Math.random().toString(36).substr(2, 24);

    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: fullKey, // Only returned on creation
        keyPrefix: newApiKey.keyPrefix,
        permissions: newApiKey.permissions,
        createdAt: newApiKey.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/notifications/keys error:', error);

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

    // Get user's API keys (without full key values)
    const userApiKeys = mockApiKeys
      .filter(k => k.userId === userId)
      .map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        permissions: k.permissions,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
        isActive: k.isActive
      }));

    return NextResponse.json({
      success: true,
      data: userApiKeys
    });

  } catch (error) {
    console.error('GET /api/notifications/keys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}