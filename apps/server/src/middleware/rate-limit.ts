import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting for the notifications API using Upstash Redis.
 * Different limits for different types of operations and users.
 */

export interface RateLimitConfig {
  requests: number;
  window: string; // e.g., '1 h', '1 m', '1 s'
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  error?: string;
}

export class RateLimitService {
  private redis: Redis;
  private rateLimiters: Map<string, Ratelimit>;

  constructor(redisUrl?: string, redisToken?: string) {
    // Initialize Redis connection
    this.redis = new Redis({
      url: redisUrl || process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:8079',
      token: redisToken || process.env.UPSTASH_REDIS_REST_TOKEN || 'example_token',
    });

    this.rateLimiters = new Map();
    this.initializeRateLimiters();
  }

  /**
   * Initialize different rate limiters for different operations
   */
  private initializeRateLimiters(): void {
    // API key requests - 10 requests per minute
    this.rateLimiters.set('api:create', new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
    }));

    // Notification listing - 100 requests per minute
    this.rateLimiters.set('api:list', new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    }));

    // Internal operations - higher limits
    this.rateLimiters.set('internal:create', new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      analytics: true,
    }));

    // Default rate limiter - 60 requests per minute
    this.rateLimiters.set('default', new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
    }));

    // Webhook endpoints - 20 requests per minute per API key
    this.rateLimiters.set('webhook', new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
    }));
  }

  /**
   * Check rate limit for a specific operation
   */
  async checkRateLimit(
    identifier: string,
    operation: string = 'default'
  ): Promise<RateLimitResult> {
    const rateLimiter = this.rateLimiters.get(operation) || this.rateLimiters.get('default')!;

    try {
      const result = await rateLimiter.limit(identifier);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset),
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      
      // Fail open - allow request if rate limiter is down
      return {
        success: true,
        limit: 60,
        remaining: 59,
        reset: new Date(Date.now() + 60000),
        error: 'Rate limiter unavailable',
      };
    }
  }

  /**
   * Check rate limit for API key operations
   */
  async checkApiKeyRateLimit(apiKeyId: string, operation: 'create' | 'list' = 'create'): Promise<RateLimitResult> {
    const rateLimitKey = `api_key:${apiKeyId}`;
    const operationKey = `api:${operation}`;
    
    return this.checkRateLimit(rateLimitKey, operationKey);
  }

  /**
   * Check rate limit for webhook operations
   */
  async checkWebhookRateLimit(apiKeyId: string): Promise<RateLimitResult> {
    const rateLimitKey = `webhook:${apiKeyId}`;
    
    return this.checkRateLimit(rateLimitKey, 'webhook');
  }

  /**
   * Check rate limit for internal operations
   */
  async checkInternalRateLimit(userId: string, operation: string = 'create'): Promise<RateLimitResult> {
    const rateLimitKey = `internal:${userId}`;
    const operationKey = `internal:${operation}`;
    
    return this.checkRateLimit(rateLimitKey, operationKey);
  }

  /**
   * Check rate limit by IP address (for anonymous requests)
   */
  async checkIpRateLimit(ipAddress: string): Promise<RateLimitResult> {
    const rateLimitKey = `ip:${ipAddress}`;
    
    return this.checkRateLimit(rateLimitKey, 'default');
  }

  /**
   * Get rate limit headers for HTTP responses
   */
  getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.reset.getTime() / 1000).toString(),
    };
  }

  /**
   * Create a custom rate limiter for specific use cases
   */
  createCustomRateLimiter(
    key: string,
    config: RateLimitConfig
  ): void {
    const { requests, window } = config;
    
    this.rateLimiters.set(key, new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(requests, window as any), // Type assertion for duration string
      analytics: true,
    }));
  }

  /**
   * Reset rate limit for a specific identifier (admin function)
   * Note: Direct reset not supported by Upstash, would need manual Redis operation
   */
  async resetRateLimit(identifier: string, operation: string = 'default'): Promise<void> {
    // TODO: Implement manual Redis key deletion if needed
    console.log(`Rate limit reset requested for ${identifier}:${operation}`);
    // For now, this is a placeholder - manual Redis operations would be needed
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getRateLimitStats(identifier: string, operation: string = 'default'): Promise<{
    current: number;
    limit: number;
    window: string;
    resetTime: Date;
  }> {
    // This would need to be implemented based on Upstash analytics
    // For now, return placeholder data
    return {
      current: 0,
      limit: 60,
      window: '1m',
      resetTime: new Date(Date.now() + 60000),
    };
  }
}