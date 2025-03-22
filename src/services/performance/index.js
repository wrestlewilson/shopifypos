import { useCallback, useMemo, Suspense, lazy } from 'react';

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 1000,
  maxAge: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
};

// Cache implementation
class Cache {
  constructor(config = CACHE_CONFIG) {
    this.config = config;
    this.cache = new Map();
    this.startCleanupInterval();
  }

  set(key, value, ttl = this.config.maxAge) {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = item.timestamp;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  startCleanupInterval() {
    setInterval(() => {
      for (const [key, item] of this.cache.entries()) {
        if (this.isExpired(item)) {
          this.cache.delete(key);
        }
      }
    }, this.config.cleanupInterval);
  }

  clear() {
    this.cache.clear();
  }
}

// Create singleton cache instance
const cache = new Cache();

// Memoization utilities
export const memoize = (fn, getKey = (...args) => JSON.stringify(args)) => {
  const memoized = (...args) => {
    const key = getKey(...args);
    const cached = cache.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.clear = () => cache.clear();
  return memoized;
};

// Lazy loading utilities
export const lazyLoad = (importFn, options = {}) => {
  const {
    fallback = null,
    timeout = 5000,
    retryCount = 3
  } = options;

  return lazy(() => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const attemptLoad = () => {
        attempts++;
        importFn()
          .then(resolve)
          .catch(error => {
            if (attempts < retryCount) {
              setTimeout(attemptLoad, timeout);
            } else {
              reject(error);
            }
          });
      };

      attemptLoad();
    });
  });
};

// Pagination utilities
export const usePagination = (items, pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage
  };
};

// Virtual list utilities for handling large datasets
export const useVirtualList = (items, options = {}) => {
  const {
    itemHeight = 50,
    overscan = 5,
    containerHeight = 400
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    startIndex + visibleCount
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', onScroll);
      return () => container.removeEventListener('scroll', onScroll);
    }
  }, [onScroll]);

  return {
    containerRef,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex
  };
};

// Memory leak prevention utilities
export const useCleanup = (cleanupFn) => {
  useEffect(() => {
    return () => {
      cleanupFn();
    };
  }, [cleanupFn]);
};

// API response caching
export const useApiCache = (key, fetchFn, options = {}) => {
  const {
    ttl = CACHE_CONFIG.maxAge,
    shouldCache = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        if (shouldCache) {
          const cached = cache.get(key);
          if (cached !== null) {
            setData(cached);
            setLoading(false);
            return;
          }
        }

        const result = await fetchFn();
        
        if (mounted) {
          setData(result);
          if (shouldCache) {
            cache.set(key, result, ttl);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [key, fetchFn, ttl, shouldCache]);

  return { data, loading, error };
};

// Code splitting utilities
export const withSuspense = (Component, fallback = null) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Performance monitoring
export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow renders
        console.warn(`Slow render detected in ${componentName}: ${duration}ms`);
      }
    };
  }, [componentName]);
};

// Export all utilities
export default {
  memoize,
  lazyLoad,
  usePagination,
  useVirtualList,
  useCleanup,
  useApiCache,
  withSuspense,
  usePerformanceMonitor,
  cache
}; 