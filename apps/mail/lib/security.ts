/**
 * Security Enhancements
 * CORS, security headers, input sanitization, and additional security measures
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

// Security configuration interface
interface SecurityConfig {
  cors?: {
    origins?: string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  headers?: {
    contentSecurityPolicy?: string;
    strictTransportSecurity?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
    referrerPolicy?: string;
    permissionsPolicy?: string;
  };
  rateLimiting?: {
    windowMs?: number;
    maxRequests?: number;
  };
  inputSanitization?: {
    maxLength?: number;
    allowedTags?: string[];
    stripTags?: boolean;
  };
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://zero.dev',
      'https://*.zero.dev'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
  },
  headers: {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' wss: https:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ')
  },
  inputSanitization: {
    maxLength: 10000,
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    stripTags: true
  }
};

/**
 * CORS handler
 */
class CorsHandler {
  private config: {
    origins: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };

  constructor(config: SecurityConfig['cors'] = {}) {
    this.config = {
      origins: config.origins || defaultSecurityConfig.cors?.origins || [],
      methods: config.methods || defaultSecurityConfig.cors?.methods || [],
      allowedHeaders: config.allowedHeaders || defaultSecurityConfig.cors?.allowedHeaders || [],
      credentials: config.credentials !== undefined ? config.credentials : (defaultSecurityConfig.cors?.credentials || false),
      maxAge: config.maxAge || defaultSecurityConfig.cors?.maxAge || 86400
    };
  }

  isOriginAllowed(origin: string): boolean {
    if (!origin) return false;

    return this.config.origins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed === origin) return true;
      
      // Handle wildcard subdomains (e.g., "https://*.zero.dev")
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      
      return false;
    });
  }

  getHeaders(origin?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (origin && this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    }

    headers['Access-Control-Allow-Methods'] = this.config.methods.join(', ');
    headers['Access-Control-Allow-Headers'] = this.config.allowedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = this.config.maxAge.toString();

    if (this.config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
  }

  handlePreflightRequest(origin?: string): {
    status: number;
    headers: Record<string, string>;
    body?: any;
  } {
    if (origin && !this.isOriginAllowed(origin)) {
      return {
        status: 403,
        headers: {},
        body: { error: 'Origin not allowed' }
      };
    }

    return {
      status: 200,
      headers: this.getHeaders(origin)
    };
  }
}

/**
 * Security headers utility
 */
class SecurityHeaders {
  private config: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };

  constructor(config: SecurityConfig['headers'] = {}) {
    this.config = {
      contentSecurityPolicy: config.contentSecurityPolicy || defaultSecurityConfig.headers?.contentSecurityPolicy || '',
      strictTransportSecurity: config.strictTransportSecurity || defaultSecurityConfig.headers?.strictTransportSecurity || '',
      xFrameOptions: config.xFrameOptions || defaultSecurityConfig.headers?.xFrameOptions || 'DENY',
      xContentTypeOptions: config.xContentTypeOptions || defaultSecurityConfig.headers?.xContentTypeOptions || 'nosniff',
      referrerPolicy: config.referrerPolicy || defaultSecurityConfig.headers?.referrerPolicy || 'strict-origin-when-cross-origin',
      permissionsPolicy: config.permissionsPolicy || defaultSecurityConfig.headers?.permissionsPolicy || ''
    };
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.config.contentSecurityPolicy,
      'Strict-Transport-Security': this.config.strictTransportSecurity,
      'X-Frame-Options': this.config.xFrameOptions,
      'X-Content-Type-Options': this.config.xContentTypeOptions,
      'Referrer-Policy': this.config.referrerPolicy,
      'Permissions-Policy': this.config.permissionsPolicy,
      'X-DNS-Prefetch-Control': 'off',
      'X-Download-Options': 'noopen',
      'X-Permitted-Cross-Domain-Policies': 'none'
    };
  }
}

/**
 * Input sanitization utilities
 */
class InputSanitizer {
  private config: {
    maxLength: number;
    allowedTags: string[];
    stripTags: boolean;
  };
  private xssPatterns: RegExp[];

  constructor(config: SecurityConfig['inputSanitization'] = {}) {
    this.config = {
      maxLength: config.maxLength || defaultSecurityConfig.inputSanitization?.maxLength || 10000,
      allowedTags: config.allowedTags || defaultSecurityConfig.inputSanitization?.allowedTags || [],
      stripTags: config.stripTags !== undefined ? config.stripTags : (defaultSecurityConfig.inputSanitization?.stripTags || true)
    };

    // Common XSS patterns to detect and remove
    this.xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
    ];
  }

  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Limit length
    if (sanitized.length > this.config.maxLength) {
      sanitized = sanitized.substring(0, this.config.maxLength);
    }

    // Remove XSS patterns
    this.xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Strip or allow only specific HTML tags
    if (this.config.stripTags) {
      if (this.config.allowedTags.length > 0) {
        // Keep only allowed tags
        const allowedTagsPattern = new RegExp(
          `<(?!\\/?(${this.config.allowedTags.join('|')})\\b)[^>]*>`,
          'gi'
        );
        sanitized = sanitized.replace(allowedTagsPattern, '');
      } else {
        // Strip all HTML tags
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }
    }

    // Decode HTML entities to prevent double encoding
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');

    // Re-encode to prevent XSS
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  validateInput(input: string, type: 'email' | 'url' | 'uuid' | 'slug' | 'alphanumeric'): boolean {
    const patterns = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      url: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      alphanumeric: /^[a-zA-Z0-9]+$/
    };

    return patterns[type].test(input);
  }
}

/**
 * API Key security utilities
 */
class ApiKeySecurity {
  /**
   * Generate a cryptographically secure API key
   */
  static generateApiKey(prefix = 'zro', length = 32): string {
    const randomPart = randomBytes(length).toString('hex').substring(0, length);
    return `${prefix}_${randomPart}`;
  }

  /**
   * Hash an API key for secure storage
   */
  static hashApiKey(apiKey: string, salt?: string): { hash: string; salt: string } {
    const usedSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(apiKey + usedSalt)
      .digest('hex');
    
    return { hash, salt: usedSalt };
  }

  /**
   * Verify an API key against a hash
   */
  static verifyApiKey(apiKey: string, hash: string, salt: string): boolean {
    const computedHash = createHash('sha256')
      .update(apiKey + salt)
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(computedHash, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate API key with validation
   */
  static createSecureApiKey(prefix = 'zro'): {
    key: string;
    hash: string;
    salt: string;
    prefix: string;
  } {
    const key = this.generateApiKey(prefix);
    const { hash, salt } = this.hashApiKey(key);
    const keyPrefix = key.substring(0, 12) + '****';

    return {
      key,
      hash,
      salt,
      prefix: keyPrefix
    };
  }
}

/**
 * Request validation utilities
 */
class RequestValidator {
  /**
   * Validate request origin and referrer
   */
  static validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    
    const corsHandler = new CorsHandler({ origins: allowedOrigins });
    return corsHandler.isOriginAllowed(origin);
  }

  /**
   * Validate request size
   */
  static validateRequestSize(contentLength: number, maxSize = 1024 * 1024): boolean { // 1MB default
    return contentLength <= maxSize;
  }

  /**
   * Validate content type
   */
  static validateContentType(contentType: string, allowedTypes: string[]): boolean {
    if (!contentType) return false;
    
    return allowedTypes.some(allowed => 
      contentType.toLowerCase().includes(allowed.toLowerCase())
    );
  }

  /**
   * Extract and validate client IP
   */
  static getClientIP(headers: Record<string, string>): string {
    const xForwardedFor = headers['x-forwarded-for'];
    const xRealIp = headers['x-real-ip'];
    const cfConnectingIp = headers['cf-connecting-ip']; // Cloudflare

    // Prefer Cloudflare IP, then real IP, then first forwarded IP
    if (cfConnectingIp) return cfConnectingIp;
    if (xRealIp) return xRealIp;
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    
    return 'unknown';
  }

  /**
   * Check for suspicious patterns in user agent
   */
  static isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent) return true; // No user agent is suspicious
    
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /postman/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}

/**
 * Security middleware factory
 */
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  const corsHandler = new CorsHandler(config.cors);
  const securityHeaders = new SecurityHeaders(config.headers);
  const inputSanitizer = new InputSanitizer(config.inputSanitization);

  return {
    /**
     * Apply CORS headers
     */
    applyCors(headers: Record<string, string>, origin?: string): Record<string, string> {
      return {
        ...headers,
        ...corsHandler.getHeaders(origin)
      };
    },

    /**
     * Apply security headers
     */
    applySecurityHeaders(headers: Record<string, string>): Record<string, string> {
      return {
        ...headers,
        ...securityHeaders.getHeaders()
      };
    },

    /**
     * Sanitize request body
     */
    sanitizeRequestBody(body: any): any {
      return inputSanitizer.sanitizeObject(body);
    },

    /**
     * Handle preflight request
     */
    handlePreflight(origin?: string) {
      return corsHandler.handlePreflightRequest(origin);
    },

    /**
     * Validate request
     */
    validateRequest(request: {
      origin?: string;
      contentType?: string;
      contentLength?: number;
      userAgent?: string;
    }): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      // Validate origin
      if (request.origin && !corsHandler.isOriginAllowed(request.origin)) {
        errors.push('Invalid origin');
      }

      // Validate content type for POST/PUT requests
      if (request.contentType && !RequestValidator.validateContentType(
        request.contentType,
        ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
      )) {
        errors.push('Invalid content type');
      }

      // Validate request size
      if (request.contentLength && !RequestValidator.validateRequestSize(request.contentLength)) {
        errors.push('Request too large');
      }

      // Check for suspicious user agent
      if (request.userAgent && RequestValidator.isSuspiciousUserAgent(request.userAgent)) {
        errors.push('Suspicious user agent detected');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }
  };
}

// Export utilities
export {
  CorsHandler,
  SecurityHeaders,
  InputSanitizer,
  ApiKeySecurity,
  RequestValidator
};

// Default security middleware instance
export const defaultSecurityMiddleware = createSecurityMiddleware(defaultSecurityConfig);