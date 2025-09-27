/**
 * Performance Monitoring and Metrics Collection
 * Comprehensive performance tracking for the notifications system
 */

import { randomUUID } from 'crypto';
import React from 'react';

// Performance metric interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage' | 'ratio';
  timestamp: Date;
  category: 'api' | 'ui' | 'database' | 'network' | 'memory' | 'cpu' | 'custom';
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  metrics: PerformanceMetric[];
  summary: {
    totalApiCalls: number;
    avgApiResponseTime: number;
    totalRenderTime: number;
    avgRenderTime: number;
    errorCount: number;
    cacheHitRatio: number;
  };
}

export interface PerformanceConfig {
  enableCollection?: boolean;
  enableConsoleLogging?: boolean;
  enableRemoteReporting?: boolean;
  sampleRate?: number; // 0-1, percentage of events to collect
  bufferSize?: number;
  reportingInterval?: number; // ms
  apiEndpoint?: string;
  apiKey?: string;
}

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private startTime: Date;
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private reportingTimer?: NodeJS.Timeout;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableCollection: true,
      enableConsoleLogging: true,
      enableRemoteReporting: false,
      sampleRate: 1.0,
      bufferSize: 1000,
      reportingInterval: 60000, // 1 minute
      ...config
    };

    this.sessionId = randomUUID();
    this.startTime = new Date();

    if (this.config.enableCollection) {
      this.setupPerformanceObservers();
      this.startReportingTimer();
    }
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationTiming(entry);
          }
        });
        observer.observe({ entryTypes: ['navigation', 'measure', 'mark'] });

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceTiming(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPaintTiming(entry);
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe layout shift (CLS)
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLayoutShift(entry as any);
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

        // Observe largest contentful paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLargestContentfulPaint(entry as any);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Monitor memory usage
      this.setupMemoryMonitoring();
      
      // Monitor frame rate
      this.setupFrameRateMonitoring();

    } catch (error) {
      console.warn('Failed to setup performance observers:', error);
    }
  }

  private recordNavigationTiming(entry: PerformanceEntry): void {
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      
      this.recordMetric({
        name: 'page_load_time',
        value: navEntry.loadEventEnd - navEntry.startTime,
        unit: 'ms',
        category: 'ui',
        tags: { type: 'navigation' }
      });

      this.recordMetric({
        name: 'dom_content_loaded',
        value: navEntry.domContentLoadedEventEnd - navEntry.startTime,
        unit: 'ms',
        category: 'ui',
        tags: { type: 'navigation' }
      });

      this.recordMetric({
        name: 'time_to_first_byte',
        value: navEntry.responseStart - navEntry.startTime,
        unit: 'ms',
        category: 'network',
        tags: { type: 'navigation' }
      });
    }
  }

  private recordResourceTiming(entry: PerformanceEntry): void {
    const resourceEntry = entry as PerformanceResourceTiming;
    
    // Skip data URLs and blob URLs
    if (resourceEntry.name.startsWith('data:') || resourceEntry.name.startsWith('blob:')) {
      return;
    }

    this.recordMetric({
      name: 'resource_load_time',
      value: resourceEntry.responseEnd - resourceEntry.startTime,
      unit: 'ms',
      category: 'network',
      tags: {
        resource: resourceEntry.name,
        type: this.getResourceType(resourceEntry.name)
      },
      metadata: {
        transferSize: resourceEntry.transferSize,
        encodedBodySize: resourceEntry.encodedBodySize,
        decodedBodySize: resourceEntry.decodedBodySize
      }
    });
  }

  private recordPaintTiming(entry: PerformanceEntry): void {
    this.recordMetric({
      name: entry.name.replace('-', '_'),
      value: entry.startTime,
      unit: 'ms',
      category: 'ui',
      tags: { type: 'paint' }
    });
  }

  private recordLayoutShift(entry: any): void {
    if (!entry.hadRecentInput) {
      this.recordMetric({
        name: 'cumulative_layout_shift',
        value: entry.value,
        unit: 'ratio',
        category: 'ui',
        tags: { type: 'layout_shift' }
      });
    }
  }

  private recordLargestContentfulPaint(entry: any): void {
    this.recordMetric({
      name: 'largest_contentful_paint',
      value: entry.startTime,
      unit: 'ms',
      category: 'ui',
      tags: { type: 'lcp', element: entry.element?.tagName?.toLowerCase() }
    });
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        
        this.recordMetric({
          name: 'memory_used',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'memory'
        });

        this.recordMetric({
          name: 'memory_total',
          value: memory.totalJSHeapSize,
          unit: 'bytes',
          category: 'memory'
        });

        this.recordMetric({
          name: 'memory_limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
          category: 'memory'
        });
      }, 10000); // Every 10 seconds
    }
  }

  private setupFrameRateMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) { // Every second
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        this.recordMetric({
          name: 'frame_rate',
          value: fps,
          unit: 'count',
          category: 'ui',
          tags: { type: 'fps' }
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.(css)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (!this.config.enableCollection) return;
    
    // Apply sampling
    if (Math.random() > (this.config.sampleRate || 1)) return;

    const fullMetric: PerformanceMetric = {
      id: randomUUID(),
      timestamp: new Date(),
      ...metric
    };

    // Add to buffer
    if (this.metrics.length >= (this.config.bufferSize || 1000)) {
      this.metrics.shift(); // Remove oldest metric
    }
    this.metrics.push(fullMetric);

    // Log to console if enabled
    if (this.config.enableConsoleLogging && metric.category !== 'memory') {
      console.log(`[Performance] ${metric.name}: ${metric.value}${metric.unit}`, metric.tags);
    }
  }

  /**
   * Start a timer for measuring duration
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End a timer and record the duration
   */
  endTimer(
    name: string, 
    category: PerformanceMetric['category'] = 'custom',
    tags?: Record<string, string>
  ): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      category,
      tags
    });

    return duration;
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const currentValue = this.counters.get(name) || 0;
    const newValue = currentValue + value;
    this.counters.set(name, newValue);

    this.recordMetric({
      name,
      value: newValue,
      unit: 'count',
      category: 'custom',
      tags
    });
  }

  /**
   * Record API call performance
   */
  recordApiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    size?: number
  ): void {
    this.recordMetric({
      name: 'api_response_time',
      value: duration,
      unit: 'ms',
      category: 'api',
      tags: {
        endpoint,
        method,
        status: status.toString(),
        statusClass: Math.floor(status / 100) + 'xx'
      },
      metadata: { size }
    });

    // Track API call count
    this.incrementCounter('api_calls', 1, { endpoint, method });

    // Track error rate
    if (status >= 400) {
      this.incrementCounter('api_errors', 1, { endpoint, method, status: status.toString() });
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(
    query: string,
    duration: number,
    rowCount?: number,
    cached?: boolean
  ): void {
    this.recordMetric({
      name: 'database_query_time',
      value: duration,
      unit: 'ms',
      category: 'database',
      tags: {
        operation: this.extractQueryOperation(query),
        cached: cached ? 'true' : 'false'
      },
      metadata: { rowCount }
    });
  }

  private extractQueryOperation(query: string): string {
    const operation = query.trim().split(' ')[0].toUpperCase();
    return ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(operation) ? operation : 'OTHER';
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const endTime = new Date();
    const apiMetrics = this.metrics.filter(m => m.category === 'api');
    const uiMetrics = this.metrics.filter(m => m.category === 'ui' && m.name.includes('render'));
    const errorMetrics = this.metrics.filter(m => m.name.includes('error'));

    return {
      id: randomUUID(),
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      metrics: [...this.metrics],
      summary: {
        totalApiCalls: apiMetrics.length,
        avgApiResponseTime: this.calculateAverage(apiMetrics.map(m => m.value)),
        totalRenderTime: uiMetrics.reduce((sum, m) => sum + m.value, 0),
        avgRenderTime: this.calculateAverage(uiMetrics.map(m => m.value)),
        errorCount: errorMetrics.length,
        cacheHitRatio: this.calculateCacheHitRatio()
      }
    };
  }

  private calculateAverage(values: number[]): number {
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
  }

  private calculateCacheHitRatio(): number {
    const cacheMetrics = this.metrics.filter(m => 
      m.tags?.cached !== undefined
    );
    
    if (cacheMetrics.length === 0) return 0;
    
    const hits = cacheMetrics.filter(m => m.tags?.cached === 'true').length;
    return hits / cacheMetrics.length;
  }

  private startReportingTimer(): void {
    if (this.config.enableRemoteReporting && this.config.reportingInterval) {
      this.reportingTimer = setInterval(() => {
        this.sendReport();
      }, this.config.reportingInterval);
    }
  }

  private async sendReport(): Promise<void> {
    if (!this.config.apiEndpoint || this.metrics.length === 0) return;

    try {
      const report = this.generateReport();
      
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          report,
          service: 'zero-notifications',
          environment: process.env.NODE_ENV || 'development'
        })
      });

      // Clear sent metrics
      this.metrics = [];
      
    } catch (error) {
      console.warn('Failed to send performance report:', error);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    metricsCount: number;
    sessionDuration: number;
    avgApiResponseTime: number;
    avgRenderTime: number;
    memoryUsage?: number;
    cacheHitRatio: number;
  } {
    const now = Date.now();
    const sessionDuration = now - this.startTime.getTime();
    
    const apiMetrics = this.metrics.filter(m => m.category === 'api');
    const renderMetrics = this.metrics.filter(m => 
      m.category === 'ui' && m.name.includes('render')
    );
    const memoryMetrics = this.metrics.filter(m => 
      m.category === 'memory' && m.name === 'memory_used'
    );

    return {
      metricsCount: this.metrics.length,
      sessionDuration,
      avgApiResponseTime: this.calculateAverage(apiMetrics.map(m => m.value)),
      avgRenderTime: this.calculateAverage(renderMetrics.map(m => m.value)),
      memoryUsage: memoryMetrics.length > 0 ? 
        memoryMetrics[memoryMetrics.length - 1].value : undefined,
      cacheHitRatio: this.calculateCacheHitRatio()
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.counters.clear();
    this.timers.clear();
  }

  /**
   * Destroy the monitor and clean up
   */
  destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.clearMetrics();
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const startTimer = (name: string) => performanceMonitor.startTimer(name);
  const endTimer = (name: string, category?: PerformanceMetric['category']) => 
    performanceMonitor.endTimer(name, category);
  const recordMetric = (metric: Omit<PerformanceMetric, 'id' | 'timestamp'>) =>
    performanceMonitor.recordMetric(metric);

  return {
    startTimer,
    endTimer,
    recordMetric,
    stats: performanceMonitor.getStats()
  };
}

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name;
    
    React.useEffect(() => {
      performanceMonitor.startTimer(`component_render_${name}`);
      
      return () => {
        performanceMonitor.endTimer(`component_render_${name}`, 'ui');
      };
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Performance utilities
 */
export const performanceUtils = {
  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    fn: () => Promise<T>,
    name: string,
    category: PerformanceMetric['category'] = 'custom'
  ): Promise<T> {
    performanceMonitor.startTimer(name);
    try {
      const result = await fn();
      performanceMonitor.endTimer(name, category);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(name, category);
      throw error;
    }
  },

  /**
   * Measure synchronous function execution time
   */
  measure<T>(
    fn: () => T,
    name: string,
    category: PerformanceMetric['category'] = 'custom'
  ): T {
    performanceMonitor.startTimer(name);
    try {
      const result = fn();
      performanceMonitor.endTimer(name, category);
      return result;
    } catch (error) {
      performanceMonitor.endTimer(name, category);
      throw error;
    }
  },

  /**
   * Create a performance-aware fetch wrapper
   */
  async performanceFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const method = options?.method || 'GET';
    const timerName = `api_${method.toLowerCase()}_${url}`;
    
    performanceMonitor.startTimer(timerName);
    
    try {
      const response = await fetch(url, options);
      const duration = performanceMonitor.endTimer(timerName, 'api') || 0;
      
      performanceMonitor.recordApiCall(
        url,
        method,
        duration,
        response.status,
        parseInt(response.headers.get('content-length') || '0')
      );
      
      return response;
    } catch (error) {
      performanceMonitor.endTimer(timerName, 'api');
      throw error;
    }
  },

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): {
    lcp?: number;
    fid?: number;
    cls?: number;
  } {
    const metrics = performanceMonitor.generateReport().metrics;
    
    return {
      lcp: metrics.find(m => m.name === 'largest_contentful_paint')?.value,
      fid: metrics.find(m => m.name === 'first_input_delay')?.value,
      cls: metrics.reduce((sum, m) => 
        m.name === 'cumulative_layout_shift' ? sum + m.value : sum, 0
      )
    };
  }
};

// Export everything
export {
  performanceMonitor,
  PerformanceMonitor
};