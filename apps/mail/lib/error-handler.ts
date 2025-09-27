/**
 * Error Handling Middleware for API routes
 * Provides consistent error responses and logging
 */

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any[];
}

export class ValidationError extends Error implements ApiError {
  status = 400;
  code = 'VALIDATION_ERROR';
  details: any[];

  constructor(message: string, details: any[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements ApiError {
  status = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements ApiError {
  status = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements ApiError {
  status = 404;
  code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements ApiError {
  status = 409;
  code = 'CONFLICT_ERROR';

  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error implements ApiError {
  status = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Format error response consistently
 */
export function formatErrorResponse(error: any) {
  // Handle known API errors
  if (error instanceof ApiError) {
    const response: any = {
      error: error.message,
      code: error.code
    };

    if (error instanceof ValidationError && error.details.length > 0) {
      response.details = error.details;
    }

    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter;
    }

    return {
      body: response,
      status: error.status || 500
    };
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return {
      body: {
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || []
      },
      status: 400
    };
  }

  // Log unexpected errors
  console.error('Unexpected API error:', error);

  // Generic internal server error
  return {
    body: {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    status: 500
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const { body, status } = formatErrorResponse(error);
      
      // Mock NextResponse for development
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

/**
 * Log API request/response for debugging
 */
export function logApiRequest(method: string, path: string, userId?: string, duration?: number) {
  const timestamp = new Date().toISOString();
  console.log(`[API] ${timestamp} ${method} ${path} ${userId ? `user:${userId}` : 'anonymous'} ${duration ? `${duration}ms` : ''}`);
}

/**
 * Extract request context for logging
 */
export function getRequestContext(request: any) {
  return {
    method: request.method || 'UNKNOWN',
    url: request.url || 'unknown',
    userAgent: request.headers?.get?.('user-agent') || 'unknown',
    ip: request.headers?.get?.('x-forwarded-for') || request.headers?.get?.('x-real-ip') || 'unknown'
  };
}