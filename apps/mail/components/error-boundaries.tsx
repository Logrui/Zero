/**
 * Error Boundaries and Monitoring
 * Comprehensive error handling, boundaries, and monitoring for the notifications system
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { randomUUID } from 'crypto';

// Error types and interfaces
export interface ErrorDetails {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'ui' | 'api' | 'database' | 'network' | 'validation' | 'security' | 'unknown';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export interface ErrorMonitorConfig {
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  maxErrorsPerSession?: number;
  apiEndpoint?: string;
  apiKey?: string;
  enableUserReporting?: boolean;
  enableAutomaticRecovery?: boolean;
}

/**
 * Global error monitor singleton
 */
class ErrorMonitor {
  private config: ErrorMonitorConfig;
  private errors: ErrorDetails[] = [];
  private sessionId: string;
  private maxErrors: number;

  constructor(config: ErrorMonitorConfig = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      maxErrorsPerSession: 50,
      enableUserReporting: true,
      enableAutomaticRecovery: false,
      ...config
    };
    
    this.sessionId = randomUUID();
    this.maxErrors = this.config.maxErrorsPerSession || 50;
    
    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle uncaught JavaScript errors
      window.addEventListener('error', (event) => {
        this.captureError({
          message: event.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }, 'unknown');
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack
        }, 'unknown');
      });

      // Handle React errors (this will be overridden by Error Boundaries)
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Check if this is a React error
        if (args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('React') || arg.includes('Warning'))
        )) {
          this.captureError({
            message: args.join(' '),
            stack: new Error().stack
          }, 'ui');
        }
        originalConsoleError.apply(console, args);
      };
    }
  }

  /**
   * Capture and process an error
   */
  captureError(
    error: Error | any,
    category: ErrorDetails['category'] = 'unknown',
    metadata?: Record<string, any>
  ): string {
    const errorId = randomUUID();
    
    const errorDetails: ErrorDetails = {
      id: errorId,
      message: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata: {
        ...metadata,
        category,
        errorType: error?.constructor?.name || 'Unknown'
      },
      severity: this.determineSeverity(error, category),
      category
    };

    // Add to local error collection
    if (this.errors.length >= this.maxErrors) {
      this.errors.shift(); // Remove oldest error
    }
    this.errors.push(errorDetails);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      console.error(`[ErrorMonitor] ${category.toUpperCase()}:`, {
        id: errorId,
        message: errorDetails.message,
        stack: errorDetails.stack,
        metadata: errorDetails.metadata
      });
    }

    // Send to remote logging service if enabled
    if (this.config.enableRemoteLogging) {
      this.sendToRemoteService(errorDetails);
    }

    // Trigger recovery if enabled
    if (this.config.enableAutomaticRecovery) {
      this.attemptRecovery(errorDetails);
    }

    return errorId;
  }

  private determineSeverity(error: any, category: string): ErrorDetails['severity'] {
    // Critical errors
    if (category === 'security' || category === 'database') {
      return 'critical';
    }

    // High severity errors
    if (category === 'api' && error?.status >= 500) {
      return 'high';
    }

    if (error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('timeout')) {
      return 'high';
    }

    // Medium severity errors
    if (category === 'validation' || category === 'ui') {
      return 'medium';
    }

    // Default to low
    return 'low';
  }

  private async sendToRemoteService(error: ErrorDetails): Promise<void> {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          error,
          service: 'zero-notifications',
          environment: process.env.NODE_ENV || 'development'
        })
      });
    } catch (loggingError) {
      console.warn('Failed to send error to remote service:', loggingError);
    }
  }

  private attemptRecovery(error: ErrorDetails): void {
    // Implement recovery strategies based on error type
    switch (error.category) {
      case 'network':
        // Retry network requests after a delay
        setTimeout(() => {
          console.log('Attempting network recovery...');
        }, 1000);
        break;
        
      case 'ui':
        // Force re-render of components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('error-recovery', { detail: error }));
        }
        break;
        
      default:
        // Generic recovery
        console.log(`No specific recovery strategy for ${error.category} errors`);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: ErrorDetails[];
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    
    this.errors.forEach(error => {
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      recentErrors: this.errors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get all errors
   */
  getAllErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorDetails['category']): ErrorDetails[] {
    return this.errors.filter(error => error.category === category);
  }
}

// Global error monitor instance
const errorMonitor = new ErrorMonitor();

/**
 * React Error Boundary Component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showDetails?: boolean;
  enableRetry?: boolean;
  category?: ErrorDetails['category'];
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = errorMonitor.captureError(
      error,
      this.props.category || 'ui',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        props: this.props
      }
    );

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo, errorId);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Show custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            
            {this.props.showDetails && (
              <details className="error-boundary__details">
                <summary>Error Details</summary>
                <pre>
                  Error ID: {this.state.errorId}
                  {'\n'}
                  Message: {this.state.error?.message}
                  {'\n'}
                  Stack: {this.state.error?.stack}
                  {this.state.errorInfo?.componentStack && (
                    `\nComponent Stack: ${this.state.errorInfo.componentStack}`
                  )}
                </pre>
              </details>
            )}

            {this.props.enableRetry && (
              <button 
                onClick={this.handleRetry}
                className="error-boundary__retry-btn"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for error handling
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for error handling in functional components
 */
export function useErrorHandler() {
  const handleError = (
    error: Error,
    category: ErrorDetails['category'] = 'ui',
    metadata?: Record<string, any>
  ): string => {
    return errorMonitor.captureError(error, category, metadata);
  };

  const handleAsyncError = async (
    asyncFn: () => Promise<any>,
    category: ErrorDetails['category'] = 'api'
  ): Promise<any> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, category);
      throw error; // Re-throw to allow component-level handling
    }
  };

  return {
    handleError,
    handleAsyncError,
    errorStats: errorMonitor.getErrorStats()
  };
}

/**
 * API Error handling utilities
 */
class ApiErrorHandler {
  /**
   * Handle API response errors
   */
  static async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any;
      
      const apiError = new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      (apiError as any).status = response.status;
      (apiError as any).data = errorData;
      
      errorMonitor.captureError(apiError, 'api', {
        url: response.url,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      throw apiError;
    }
    
    return response.json();
  }

  /**
   * Retry failed API requests with exponential backoff
   */
  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          errorMonitor.captureError(lastError, 'api', {
            maxRetriesExceeded: true,
            attempts: attempt + 1
          });
          throw lastError;
        }
        
        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

/**
 * Database Error handling utilities
 */
class DatabaseErrorHandler {
  /**
   * Handle database connection errors
   */
  static handleConnectionError(error: Error): never {
    errorMonitor.captureError(error, 'database', {
      type: 'connection',
      critical: true
    });
    
    throw new Error('Database connection failed. Please try again later.');
  }

  /**
   * Handle query errors
   */
  static handleQueryError(error: Error, query?: string): never {
    errorMonitor.captureError(error, 'database', {
      type: 'query',
      query: query ? query.substring(0, 200) : undefined // Truncate for security
    });
    
    throw new Error('Database query failed. Please check your request and try again.');
  }
}

/**
 * Error reporting utilities
 */
export const errorReporting = {
  /**
   * Report error to user
   */
  reportToUser(error: ErrorDetails, showToast?: (message: string) => void): void {
    const message = this.getUserFriendlyMessage(error);
    
    if (showToast) {
      showToast(message);
    } else {
      console.warn('User Error:', message);
    }
  },

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: ErrorDetails): string {
    switch (error.category) {
      case 'network':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'api':
        return 'Server error. Please try again in a few moments.';
      case 'validation':
        return 'Invalid input. Please check your data and try again.';
      case 'security':
        return 'Security error. Please contact support if this persists.';
      case 'database':
        return 'Data access error. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  },

  /**
   * Generate error report for support
   */
  generateReport(errorId: string): string {
    const error = errorMonitor.getAllErrors().find(e => e.id === errorId);
    if (!error) return 'Error not found';

    return `
ERROR REPORT
============
ID: ${error.id}
Time: ${error.timestamp.toISOString()}
Category: ${error.category}
Severity: ${error.severity}
Message: ${error.message}
URL: ${error.url || 'N/A'}
User Agent: ${error.userAgent || 'N/A'}

Stack Trace:
${error.stack || 'Not available'}

Metadata:
${JSON.stringify(error.metadata, null, 2)}
    `.trim();
  },

  /**
   * Check if error should be reported to user
   */
  shouldReportToUser(error: ErrorDetails): boolean {
    // Don't report low severity UI errors
    if (error.category === 'ui' && error.severity === 'low') {
      return false;
    }

    // Always report security and database errors
    if (['security', 'database'].includes(error.category)) {
      return true;
    }

    // Report medium and high severity errors
    return ['medium', 'high', 'critical'].includes(error.severity);
  }
};

// Export error monitor instance and utilities
export {
  errorMonitor,
  ApiErrorHandler,
  DatabaseErrorHandler
};