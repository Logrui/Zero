/**
 * Performance Optimization Hooks and Utilities
 * Caching, memoization, and performance features for the notifications system
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Cache interface for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

/**
 * In-memory cache utility class
 */
class InMemoryCache<T> {
  private cache: Cache<T> = {};
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 100, cleanupIntervalMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    
    // Set up automatic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  set(key: string, data: T, ttlMs = 10 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (Object.keys(this.cache).length >= this.maxSize) {
      const oldestKey = Object.keys(this.cache)
        .sort((a, b) => this.cache[a].timestamp - this.cache[b].timestamp)[0];
      delete this.cache[oldestKey];
    }

    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    };
  }

  get(key: string): T | null {
    const entry = this.cache[key];
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      delete this.cache[key];
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    delete this.cache[key];
  }

  clear(): void {
    this.cache = {};
  }

  size(): number {
    return Object.keys(this.cache).length;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.cache)) {
      if (now - entry.timestamp > entry.ttl) {
        delete this.cache[key];
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Global caches for different data types
const notificationCache = new InMemoryCache(50);
const apiKeyCache = new InMemoryCache(20);
const statsCache = new InMemoryCache(10, 60 * 1000); // Stats cache with 1-minute cleanup

/**
 * Hook for cached API requests
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    cache?: InMemoryCache<T>;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default TTL
    cache = notificationCache as InMemoryCache<T>,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cachedData = cache.get(key);
    if (cachedData) {
      setData(cachedData);
      onSuccess?.(cachedData);
      return cachedData;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, ttl, cache, enabled, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    fetchData();
  }, [cache, key, fetchData]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(data)
      : newData;
    
    setData(updatedData);
    cache.set(key, updatedData, ttl);
  }, [cache, key, ttl, data]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    invalidate,
    mutate
  };
}

/**
 * Hook for optimized notification queries with smart caching
 */
export function useOptimizedNotifications(
  params: {
    userId?: string;
    type?: string;
    status?: string;
    limit?: number;
    page?: number;
  } = {}
) {
  const cacheKey = `notifications-${JSON.stringify(params)}`;
  
  const fetcher = useCallback(async () => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/notifications?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }
    return response.json();
  }, [params]);

  return useCachedQuery(cacheKey, fetcher, {
    ttl: 2 * 60 * 1000, // 2 minutes for notification data
    cache: notificationCache as InMemoryCache<any>
  });
}

/**
 * Hook for memoized complex calculations
 */
export function useMemoizedCalculation<T>(
  calculator: () => T,
  dependencies: React.DependencyList,
  options: {
    shouldRecalculate?: (prev: T, current: T) => boolean;
  } = {}
): T {
  const { shouldRecalculate } = options;
  
  return useMemo(() => {
    const result = calculator();
    
    // Custom comparison function for complex objects
    if (shouldRecalculate) {
      const prevRef = useRef<T | undefined>(undefined);
      if (prevRef.current && !shouldRecalculate(prevRef.current, result)) {
        return prevRef.current;
      }
      prevRef.current = result;
    }
    
    return result;
  }, dependencies);
}

/**
 * Hook for debounced values and functions
 */
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled functions
 */
export function useThrottled<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime.current >= delay) {
      lastCallTime.current = now;
      return func(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now();
        func(...args);
      }, delay - (now - lastCallTime.current));
    }
  }, [func, delay]) as T;
}

/**
 * Hook for optimized list rendering with virtualization hints
 */
export function useVirtualizedList<T>(
  items: T[],
  options: {
    itemHeight?: number;
    overscan?: number;
    containerHeight?: number;
  } = {}
) {
  const { itemHeight = 60, overscan = 5, containerHeight = 400 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
  
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    containerProps: {
      style: {
        height: containerHeight,
        overflow: 'auto' as const,
        position: 'relative' as const
      },
      onScroll: handleScroll
    }
  };
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number | undefined>(undefined);
  const metricsRef = useRef<{
    renderCount: number;
    averageRenderTime: number;
    lastRenderTime: number;
  }>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    return () => {
      if (startTimeRef.current) {
        const renderTime = performance.now() - startTimeRef.current;
        const metrics = metricsRef.current;
        
        metrics.renderCount++;
        metrics.lastRenderTime = renderTime;
        metrics.averageRenderTime = 
          (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) / 
          metrics.renderCount;

        // Log performance warnings for slow renders
        if (renderTime > 16) { // > 1 frame at 60fps
          console.warn(`Slow render detected in ${name}: ${renderTime.toFixed(2)}ms`);
        }

        // Log metrics periodically
        if (metrics.renderCount % 10 === 0) {
          console.log(`Performance metrics for ${name}:`, {
            renders: metrics.renderCount,
            avgTime: metrics.averageRenderTime.toFixed(2) + 'ms',
            lastTime: metrics.lastRenderTime.toFixed(2) + 'ms'
          });
        }
      }
    };
  });

  return metricsRef.current;
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [hasLoaded, options]);

  return {
    elementRef,
    isVisible,
    hasLoaded
  };
}

/**
 * Cache management utilities
 */
export const cacheUtils = {
  /**
   * Clear all notification cache
   */
  clearNotificationCache(): void {
    notificationCache.clear();
  },

  /**
   * Clear all API key cache
   */
  clearApiKeyCache(): void {
    apiKeyCache.clear();
  },

  /**
   * Clear stats cache
   */
  clearStatsCache(): void {
    statsCache.clear();
  },

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    notificationCache.clear();
    apiKeyCache.clear();
    statsCache.clear();
  },

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      notifications: notificationCache.size(),
      apiKeys: apiKeyCache.size(),
      stats: statsCache.size()
    };
  },

  /**
   * Prefetch data for improved perceived performance
   */
  async prefetchNotifications(params: any): Promise<void> {
    const cacheKey = `notifications-${JSON.stringify(params)}`;
    
    if (!notificationCache.get(cacheKey)) {
      try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });

        const response = await fetch(`/api/notifications?${queryParams}`);
        if (response.ok) {
          const data = await response.json();
          notificationCache.set(cacheKey, data);
        }
      } catch (error) {
        console.warn('Prefetch failed:', error);
      }
    }
  }
};

// Export cache instances for direct access if needed
export { notificationCache, apiKeyCache, statsCache };

// Cleanup function for when the module is unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    notificationCache.destroy();
    apiKeyCache.destroy();
    statsCache.destroy();
  });
}