// Performance monitoring service
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      renderTime: 100, // ms
      apiCallTime: 500, // ms
      memoryUsage: 50 * 1024 * 1024, // 50MB
      fps: 30
    };
    this.observers = new Set();
    this.startTime = Date.now();
  }

  // Start monitoring
  start() {
    this.monitorMemoryUsage();
    this.monitorFPS();
    this.monitorNetworkRequests();
    this.monitorLongTasks();
  }

  // Stop monitoring
  stop() {
    this.observers.clear();
    this.metrics.clear();
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if (performance.memory) {
      const observer = setInterval(() => {
        const usage = performance.memory.usedJSHeapSize;
        this.recordMetric('memoryUsage', usage);
        
        if (usage > this.thresholds.memoryUsage) {
          this.notifyObservers({
            type: 'memoryWarning',
            value: usage,
            threshold: this.thresholds.memoryUsage
          });
        }
      }, 5000);

      this.observers.add(observer);
    }
  }

  // Monitor FPS
  monitorFPS() {
    let lastTime = performance.now();
    let frames = 0;
    let lastFPSUpdate = performance.now();

    const observer = requestAnimationFrame(function measureFPS() {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastFPSUpdate >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastFPSUpdate));
        this.recordMetric('fps', fps);
        
        if (fps < this.thresholds.fps) {
          this.notifyObservers({
            type: 'fpsWarning',
            value: fps,
            threshold: this.thresholds.fps
          });
        }

        frames = 0;
        lastFPSUpdate = currentTime;
      }

      lastTime = currentTime;
      requestAnimationFrame(measureFPS);
    });

    this.observers.add(observer);
  }

  // Monitor network requests
  monitorNetworkRequests() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.recordMetric('apiCallTime', entry.duration);
          
          if (entry.duration > this.thresholds.apiCallTime) {
            this.notifyObservers({
              type: 'apiCallWarning',
              value: entry.duration,
              threshold: this.thresholds.apiCallTime,
              url: entry.name
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.add(observer);
  }

  // Monitor long tasks
  monitorLongTasks() {
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric('longTask', entry.duration);
          this.notifyObservers({
            type: 'longTask',
            value: entry.duration,
            startTime: entry.startTime
          });
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.add(observer);
    }
  }

  // Record performance metric
  recordMetric(name, value) {
    const metric = this.metrics.get(name) || {
      values: [],
      timestamps: [],
      maxSize: 100
    };

    metric.values.push(value);
    metric.timestamps.push(Date.now());

    if (metric.values.length > metric.maxSize) {
      metric.values.shift();
      metric.timestamps.shift();
    }

    this.metrics.set(name, metric);
  }

  // Get performance metrics
  getMetrics() {
    const result = {};
    
    for (const [name, metric] of this.metrics.entries()) {
      result[name] = {
        current: metric.values[metric.values.length - 1],
        average: this.calculateAverage(metric.values),
        min: Math.min(...metric.values),
        max: Math.max(...metric.values),
        history: metric.values.map((value, index) => ({
          value,
          timestamp: metric.timestamps[index]
        }))
      };
    }

    return result;
  }

  // Calculate average of values
  calculateAverage(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  // Add observer for performance events
  addObserver(observer) {
    this.observers.add(observer);
  }

  // Remove observer
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  // Notify observers of performance events
  notifyObservers(event) {
    this.observers.forEach(observer => {
      if (typeof observer === 'function') {
        observer(event);
      }
    });
  }

  // Get uptime
  getUptime() {
    return Date.now() - this.startTime;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Set thresholds
  setThresholds(thresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...thresholds
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceMonitor.recordMetric(`${componentName}_renderTime`, duration);
      
      if (duration > performanceMonitor.thresholds.renderTime) {
        performanceMonitor.notifyObservers({
          type: 'renderWarning',
          component: componentName,
          value: duration,
          threshold: performanceMonitor.thresholds.renderTime
        });
      }
    };
  }, [componentName]);
};

// Performance optimization hook
export const usePerformanceOptimization = (callback, deps = []) => {
  const memoizedCallback = React.useCallback(callback, deps);
  const memoizedValue = React.useMemo(() => callback(), deps);
  
  return {
    memoizedCallback,
    memoizedValue
  };
};

// Export monitoring utilities
export default {
  performanceMonitor,
  usePerformanceMonitoring,
  usePerformanceOptimization
}; 