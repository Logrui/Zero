import { getUserFromRequest } from '../../../../lib/api-auth';
import { rateLimiter } from '../../../../middleware/rate-limit';

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

// Mock API key data store (same as in parent route)
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

// This would be shared from a central store in production
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

interface RouteParams {
  params: { id: string };
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

    // Validate key ID
    const keyId = params.id;
    if (!keyId || typeof keyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key ID' },
        { status: 400 }
      );
    }

    // Find the API key
    const keyIndex = mockApiKeys.findIndex(k => k.id === keyId && k.userId === userId);
    if (keyIndex === -1) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the API key
    const deletedKey = mockApiKeys.splice(keyIndex, 1)[0];

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
      data: {
        id: deletedKey.id,
        name: deletedKey.name,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('DELETE /api/notifications/keys/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    // Authentication
    const userId = await getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate key ID
    const keyId = params.id;
    if (!keyId || typeof keyId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid API key ID' },
        { status: 400 }
      );
    }

    // Find the API key
    const apiKey = mockApiKeys.find(k => k.id === keyId && k.userId === userId);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Return key details (without the actual key value)
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        isActive: apiKey.isActive
      }
    });

  } catch (error) {
    console.error('GET /api/notifications/keys/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}