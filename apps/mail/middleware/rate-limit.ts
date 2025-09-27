/**
 * Rate Limiting Middleware for API routes
 * Simple in-memory rate limiting for development
 */

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining?: number;
}

interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
  url?: string;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter configuration
 */
const RATE_LIMITS = {
  // API key requests: 1000 per hour
  apiKey: { requests: 1000, windowMs: 60 * 60 * 1000 },
  // IP-based requests: 100 per hour for unauthenticated
  ip: { requests: 100, windowMs: 60 * 60 * 1000 }
};

/**
 * Apply rate limiting based on API key or IP address
 */
export async function rateLimiter(request: RequestLike): Promise<RateLimitResult> {
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Determine the key to use for rate limiting
  let rateLimitKey: string;
  let config: typeof RATE_LIMITS.apiKey;
  
  if (apiKey) {
    // Use API key for authenticated requests
    rateLimitKey = `api_key:${apiKey}`;
    config = RATE_LIMITS.apiKey;
  } else {
    // Use IP for unauthenticated requests
    const ip = getClientIP(request);
    rateLimitKey = `ip:${ip}`;
    config = RATE_LIMITS.ip;
  }
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(rateLimitKey);
  
  if (!entry || entry.resetTime <= now) {
    // Create new or reset expired entry
    entry = { count: 0, resetTime: now + config.windowMs };
    rateLimitStore.set(rateLimitKey, entry);
  }
  
  // Check if request is allowed
  if (entry.count >= config.requests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000), // seconds
      remaining: 0
    };
  }
  
  // Increment counter
  entry.count++;
  
  return {
    allowed: true,
    remaining: config.requests - entry.count
  };
}

/**
 * Extract client IP from request
 * In a real deployment, this would check various headers
 */
function getClientIP(request: RequestLike): string {
  // Check common proxy headers
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  // Fallback to a default for development
  return '127.0.0.1';
}

/**
 * Clean up expired rate limit entries
 * Should be called periodically in production
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);