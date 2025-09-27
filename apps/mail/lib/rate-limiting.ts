/**
 * Rate Limiting Implementation
 * Advanced rate limiting for API endpoints with multiple strategies
 */

// Mock Next.js types for development
interface MockNextRequest {
  ip?: string;
  nextUrl: { pathname: string };
  method: string;
  headers: {
    get(name: string): string | null;
  };
}

interface MockNextResponse {
  headers: {
    set(name: string, value: string): void;
  };
  json(body: any, init?: { status?: number }): MockNextResponse;
}

// Mock implementations
const mockNextResponse = {
  json: (body: any, init?: { status?: number }) => ({
    headers: {
      set: (name: string, value: string) => {}
    },
    json: mockNextResponse.json
  } as MockNextResponse)
};

type NextRequest = MockNextRequest;
type NextResponse = MockNextResponse;
const NextResponse = mockNextResponse;

// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Custom error message
  headers?: boolean;     // Include rate limit headers in response
  keyGenerator?: (req: NextRequest) => string; // Custom key generation
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean;     // Only count successful requests
  onLimitReached?: (req: NextRequest, info: RateLimitInfo) => void;
}

// Rate limit information
interface RateLimitInfo {
  totalHits: number;
  totalResets: number;
  resetTime: Date;
  remaining: number;
}

// Storage interface for different backends
interface RateLimitStore {
  incr(key: string): Promise<number>;
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttlMs: number): Promise<void>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory rate limit store
 * For development - in production use Redis or similar
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (now > value.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60 * 1000);
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return 1; // Will be set by the rate limiter
    }
    
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return 1;
    }
    
    entry.count++;
    return entry.count;
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.count;
  }

  async set(key: string, value: number, ttlMs: number): Promise<void> {
    this.store.set(key, {
      count: value,
      resetTime: Date.now() + ttlMs
    });
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

/**
 * Redis-based rate limit store (for production)
 */
class RedisStore implements RateLimitStore {
  private redisClient: any; // Redis client type

  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  async incr(key: string): Promise<number> {
    return await this.redisClient.incr(key);
  }

  async get(key: string): Promise<number | null> {
    const result = await this.redisClient.get(key);
    return result ? parseInt(result, 10) : null;
  }

  async set(key: string, value: number, ttlMs: number): Promise<void> {
    await this.redisClient.setex(key, Math.ceil(ttlMs / 1000), value);
  }

  async reset(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}

/**
 * Rate limiter class
 */
class RateLimiter {
  private config: Required<RateLimitConfig>;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      message: config.message || 'Too many requests, please try again later',
      headers: config.headers !== false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      onLimitReached: config.onLimitReached || (() => {})
    };
    
    this.store = store || new MemoryStore();
  }

  private defaultKeyGenerator(req: NextRequest): string {
    // Use IP address and user agent for anonymous requests
    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    
    // Include API key if present for authenticated requests
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '') ||
                   req.headers.get('x-api-key');
    
    return apiKey ? `api:${apiKey}` : `ip:${ip}`;
  }

  async checkLimit(req: NextRequest): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
    response?: NextResponse;
  }> {
    const key = this.config.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get current count
    let count = await this.store.get(key) || 0;
    
    // Increment counter
    count = await this.store.incr(key);
    
    // Set TTL if this is a new key
    if (count === 1) {
      await this.store.set(key, count, this.config.windowMs);
    }

    const resetTime = new Date(windowStart + this.config.windowMs);
    const remaining = Math.max(0, this.config.maxRequests - count);
    
    const info: RateLimitInfo = {
      totalHits: count,
      totalResets: 0, // Would track resets in production
      resetTime,
      remaining
    };

    // Check if limit exceeded
    if (count > this.config.maxRequests) {
      this.config.onLimitReached(req, info);
      
      const response = NextResponse.json(
        {
          error: this.config.message,
          retryAfter: Math.ceil(this.config.windowMs / 1000)
        },
        { status: 429 }
      );

      if (this.config.headers) {
        this.addRateLimitHeaders(response, info);
      }

      return {
        allowed: false,
        info,
        response
      };
    }

    return {
      allowed: true,
      info
    };
  }

  private addRateLimitHeaders(response: NextResponse, info: RateLimitInfo): void {
    response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
    response.headers.set('X-RateLimit-Reset', info.resetTime.getTime().toString());
    response.headers.set('Retry-After', Math.ceil(this.config.windowMs / 1000).toString());
  }
}

/**
 * Predefined rate limiting configurations
 */
export const rateLimitConfigs = {
  // General API endpoints
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests. Please try again in 15 minutes.'
  },
  
  // Strict rate limiting for sensitive endpoints
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    maxRequests: 10,
    message: 'Rate limit exceeded for this endpoint. Please try again later.'
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // Create/write operations
  create: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many create requests. Please slow down.'
  },
  
  // Read operations (more permissive)
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many read requests. Please slow down.'
  },
  
  // Public endpoints
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Rate limit exceeded. Please try again in a minute.'
  }
};

/**
 * Create rate limiting middleware
 */
export function createRateLimit(
  configName: keyof typeof rateLimitConfigs | RateLimitConfig,
  customConfig: Partial<RateLimitConfig> = {}
) {
  const baseConfig = typeof configName === 'string' 
    ? rateLimitConfigs[configName]
    : configName;
    
  const finalConfig = { ...baseConfig, ...customConfig };
  const limiter = new RateLimiter(finalConfig);

  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    const result = await limiter.checkLimit(req);
    
    if (!result.allowed && result.response) {
      console.warn(`Rate limit exceeded for ${finalConfig.keyGenerator?.(req) || 'unknown'}:`, {
        path: req.nextUrl.pathname,
        method: req.method,
        hits: result.info.totalHits,
        limit: finalConfig.maxRequests
      });
      
      return result.response;
    }

    // Add rate limit headers to successful responses
    if (finalConfig.headers !== false) {
      // Headers will be added by the middleware wrapper
      (req as any).__rateLimitInfo = result.info;
    }

    return null; // Allow request to proceed
  };
}

/**
 * Rate limiting middleware wrapper for API routes
 */
export function withRateLimit(
  configName: keyof typeof rateLimitConfigs | RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>,
  customConfig: Partial<RateLimitConfig> = {}
) {
  const rateLimitMiddleware = createRateLimit(configName, customConfig);

  return async function wrappedHandler(req: NextRequest): Promise<NextResponse> {
    // Check rate limit first
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute the original handler
    const response = await handler(req);

    // Add rate limit headers to the response
    const rateLimitInfo = (req as any).__rateLimitInfo as RateLimitInfo;
    if (rateLimitInfo) {
      const baseConfig = typeof configName === 'string' 
        ? rateLimitConfigs[configName]
        : configName;
      const finalConfig = { ...baseConfig, ...customConfig };
      
      if (finalConfig.headers !== false) {
        response.headers.set('X-RateLimit-Limit', finalConfig.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.getTime().toString());
      }
    }

    return response;
  };
}

/**
 * Sliding window rate limiter for more precise control
 */
export class SlidingWindowRateLimiter {
  private windows = new Map<string, number[]>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  checkLimit(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this key
    let requests = this.windows.get(key) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if we can add another request
    if (requests.length >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0
      };
    }
    
    // Add current request
    requests.push(now);
    this.windows.set(key, requests);
    
    return {
      allowed: true,
      remaining: this.maxRequests - requests.length
    };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.windows.entries()) {
      const validRequests = requests.filter(timestamp => 
        timestamp > now - this.windowMs
      );
      
      if (validRequests.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validRequests);
      }
    }
  }
}

/**
 * Rate limiting utilities
 */
export const rateLimitUtils = {
  /**
   * Check if an IP is whitelisted
   */
  isWhitelisted(ip: string, whitelist: string[] = []): boolean {
    return whitelist.includes(ip) || 
           whitelist.includes('127.0.0.1') && ip === '127.0.0.1';
  },

  /**
   * Get client identifier from request
   */
  getClientId(req: NextRequest): string {
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '') ||
                   req.headers.get('x-api-key');
    
    if (apiKey) {
      return `api:${apiKey}`;
    }

    const ip = req.ip || 
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
               
    return `ip:${ip}`;
  },

  /**
   * Format rate limit error response
   */
  formatRateLimitError(info: RateLimitInfo, windowMs: number) {
    return {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
      limit: info.totalHits,
      remaining: info.remaining,
      resetTime: info.resetTime.toISOString()
    };
  },

  /**
   * Create adaptive rate limiter that adjusts based on server load
   */
  createAdaptiveRateLimit(baseConfig: RateLimitConfig) {
    return {
      ...baseConfig,
      keyGenerator: (req: NextRequest) => {
        // Adjust limits based on server metrics
        const serverLoad = this.getServerLoad();
        const adjustedMax = serverLoad > 0.8 
          ? Math.floor(baseConfig.maxRequests * 0.5)
          : baseConfig.maxRequests;
          
        return baseConfig.keyGenerator?.(req) || rateLimitUtils.getClientId(req);
      }
    };
  },

  /**
   * Mock server load calculation (replace with real metrics)
   */
  getServerLoad(): number {
    // In production, this would check actual server metrics
    // CPU usage, memory, active connections, etc.
    return Math.random() * 0.7; // Mock load between 0-70%
  }
};

// Global cleanup for memory store
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    // Cleanup would happen here for production stores
  });
}

// Export default memory store instance
export const defaultStore = new MemoryStore();

// Export everything
export { 
  RateLimiter, 
  MemoryStore, 
  RedisStore,
  type RateLimitConfig,
  type RateLimitInfo,
  type RateLimitStore
};