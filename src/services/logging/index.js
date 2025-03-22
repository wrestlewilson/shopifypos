import { createAuthenticatedClient } from '../1_shopify_integration_auth_flow';
import { EncryptionService } from '../5_security_data_encryption';

// Log Levels
export const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Logger Class
export class Logger {
  constructor(options = {}) {
    this.options = {
      appName: 'shopify-pos-bst',
      minLevel: LogLevels.DEBUG,
      enableConsole: true,
      enableRemote: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      sensitiveFields: ['password', 'token', 'credit_card', 'ssn', 'secret'],
      ...options
    };
    
    this.logQueue = [];
    this.client = null;
    this.encryptionService = new EncryptionService();
    this.flushTimer = null;
    
    // Start flush timer
    if (this.options.enableRemote) {
      this.startFlushTimer();
    }
    
    // Handle window unload to flush logs
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }
  
  // Initialize the authenticated client
  async initialize() {
    if (!this.client && this.options.enableRemote) {
      this.client = await createAuthenticatedClient();
    }
  }
  
  // Start flush timer
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.options.flushInterval);
  }
  
  // Stop flush timer
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  // Log a message
  log(level, message, data = {}) {
    // Check if level is enabled
    if (!this.isLevelEnabled(level)) {
      return;
    }
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: this.sanitizeData(data),
      app: this.options.appName,
      session: this.getSessionId(),
      user: this.getUserInfo()
    };
    
    // Log to console if enabled
    if (this.options.enableConsole) {
      this.logToConsole(logEntry);
    }
    
    // Add to queue for remote logging if enabled
    if (this.options.enableRemote) {
      this.logQueue.push(logEntry);
      
      // Flush if queue reaches batch size
      if (this.logQueue.length >= this.options.batchSize) {
        this.flush();
      }
    }
    
    return logEntry;
  }
  
  // Debug level log
  debug(message, data = {}) {
    return this.log(LogLevels.DEBUG, message, data);
  }
  
  // Info level log
  info(message, data = {}) {
    return this.log(LogLevels.INFO, message, data);
  }
  
  // Warn level log
  warn(message, data = {}) {
    return this.log(LogLevels.WARN, message, data);
  }
  
  // Error level log
  error(message, data = {}) {
    return this.log(LogLevels.ERROR, message, data);
  }
  
  // Critical level log
  critical(message, data = {}) {
    return this.log(LogLevels.CRITICAL, message, data);
  }
  
  // Check if level is enabled
  isLevelEnabled(level) {
    const levels = Object.values(LogLevels);
    const minLevelIndex = levels.indexOf(this.options.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  // Sanitize sensitive data
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    // Clone data to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Recursively sanitize object
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return;
      }
      
      Object.keys(obj).forEach(key => {
        // Check if field is sensitive
        if (this.options.sensitiveFields.some(field => 
          key.toLowerCase().includes(field.toLowerCase())
        )) {
          obj[key] = '[REDACTED]';
        } 
        // Recursively sanitize nested objects
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }
  
  // Get session ID
  getSessionId() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let sessionId = sessionStorage.getItem('log_session_id');
      
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('log_session_id', sessionId);
      }
      
      return sessionId;
    }
    
    return null;
  }
  
  // Get user info
  getUserInfo() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return {
            id: user.id,
            username: user.username || user.email,
            role: user.roles ? user.roles[0] : null
          };
        } catch (e) {
          // Ignore parsing errors
        }
      }
    }
    
    return null;
  }
  
  // Log to console
  logToConsole(logEntry) {
    const { level, message, data } = logEntry;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case LogLevels.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LogLevels.INFO:
        console.info(prefix, message, data);
        break;
      case LogLevels.WARN:
        console.warn(prefix, message, data);
        break;
      case LogLevels.ERROR:
      case LogLevels.CRITICAL:
        console.error(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }
  
  // Flush logs to remote server
  async flush() {
    if (!this.options.enableRemote || this.logQueue.length === 0) {
      return;
    }
    
    try {
      // Initialize client if needed
      if (!this.client) {
        await this.initialize();
      }
      
      // Get logs to send
      const logsToSend = [...this.logQueue];
      this.logQueue = [];
      
      // Send logs to server
      await this.client.post('/api/logs/batch', { logs: logsToSend });
    } catch (error) {
      // Put logs back in queue
      this.logQueue = [...this.logQueue, ...this.logQueue];
      
      // Trim queue if it gets too large
      if (this.logQueue.length > this.options.batchSize * 5) {
        this.logQueue = this.logQueue.slice(-this.options.batchSize * 5);
      }
      
      // Log error to console
      if (this.options.enableConsole) {
        console.error('[Logger] Failed to send logs to server:', error);
      }
    }
  }
  
  // Set minimum log level
  setMinLevel(level) {
    this.options.minLevel = level;
  }
  
  // Enable/disable console logging
  setConsoleLogging(enabled) {
    this.options.enableConsole = enabled;
  }
  
  // Enable/disable remote logging
  setRemoteLogging(enabled) {
    this.options.enableRemote = enabled;
    
    if (enabled && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!enabled && this.flushTimer) {
      this.stopFlushTimer();
    }
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Performance Logger
export class PerformanceLogger {
  constructor(options = {}) {
    this.logger = options.logger || logger;
    this.timers = new Map();
  }
  
  // Start timing an operation
  startTimer(operationName, data = {}) {
    const startTime = performance.now();
    this.timers.set(operationName, {
      startTime,
      data
    });
    
    this.logger.debug(`Performance: Started ${operationName}`, data);
    return startTime;
  }
  
  // End timing an operation
  endTimer(operationName, additionalData = {}) {
    const endTime = performance.now();
    const timer = this.timers.get(operationName);
    
    if (!timer) {
      this.logger.warn(`Performance: No timer found for ${operationName}`);
      return null;
    }
    
    const { startTime, data } = timer;
    const duration = endTime - startTime;
    
    this.timers.delete(operationName);
    
    const logData = {
      ...data,
      ...additionalData,
      duration,
      startTime,
      endTime
    };
    
    this.logger.info(`Performance: ${operationName} completed in ${duration.toFixed(2)}ms`, logData);
    return duration;
  }
  
  // Log a performance metric without timing
  logMetric(metricName, value, data = {}) {
    this.logger.info(`Performance Metric: ${metricName} = ${value}`, {
      ...data,
      metricName,
      value
    });
  }
  
  // Get all active timers
  getActiveTimers() {
    return Array.from(this.timers.entries()).map(([name, { startTime, data }]) => ({
      name,
      startTime,
      elapsedTime: performance.now() - startTime,
      data
    }));
  }
  
  // End all active timers
  endAllTimers(additionalData = {}) {
    const results = {};
    
    for (const [operationName] of this.timers) {
      const duration = this.endTimer(operationName, additionalData);
      results[operationName] = duration;
    }
    
    return results;
  }
}

// Create singleton performance logger instance
export const performanceLogger = new PerformanceLogger();

// React Hook for Logging
export const useLogger = () => {
  return {
    logger,
    performanceLogger
  };
};

// Higher-Order Component for Logging
export const withLogging = (WrappedComponent, options = {}) => {
  const componentName = options.name || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithLogging = (props) => {
    // Log component mount
    React.useEffect(() => {
      logger.debug(`Component ${componentName} mounted`, {
        componentName,
        props: logger.sanitizeData(props)
      });
      
      // Start performance timer
      performanceLogger.startTimer(`${componentName} lifetime`);
      
      return () => {
        // Log component unmount
        logger.debug(`Component ${componentName} unmounted`);
        
        // End performance timer
        performanceLogger.endTimer(`${componentName} lifetime`);
      };
    }, []);
    
    // Log prop changes
    React.useEffect(() => {
      logger.debug(`Component ${componentName} props updated`, {
        componentName,
        props: logger.sanitizeData(props)
      });
    }, [props]);
    
    // Create logging methods for the component
    const componentLogger = {
      debug: (message, data) => logger.debug(`[${componentName}] ${message}`, data),
      info: (message, data) => logger.info(`[${componentName}] ${message}`, data),
      warn: (message, data) => logger.warn(`[${componentName}] ${message}`, data),
      error: (message, data) => logger.error(`[${componentName}] ${message}`, data),
      critical: (message, data) => logger.critical(`[${componentName}] ${message}`, data),
      startTimer: (operation, data) => performanceLogger.startTimer(`${componentName}:${operation}`, data),
      endTimer: (operation, data) => performanceLogger.endTimer(`${componentName}:${operation}`, data)
    };
    
    // Pass logger to wrapped component
    return <WrappedComponent {...props} logger={componentLogger} />;
  };
  
  WithLogging.displayName = `WithLogging(${componentName})`;
  return WithLogging;
};

// Network Request Logger
export const createNetworkLogger = (axiosInstance) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Start timer for request
      const requestId = `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      config.requestId = requestId;
      
      performanceLogger.startTimer(requestId, {
        url: config.url,
        method: config.method,
        params: config.params
      });
      
      logger.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
        requestId,
        url: config.url,
        method: config.method,
        params: logger.sanitizeData(config.params),
        headers: logger.sanitizeData(config.headers)
      });
      
      return config;
    },
    (error) => {
      logger.error('API Request Error', {
        error: error.message,
        stack: error.stack
      });
      
      return Promise.reject(error);
    }
  );
  
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      const { config } = response;
      const requestId = config.requestId;
      
      // End timer for request
      if (requestId) {
        performanceLogger.endTimer(requestId, {
          status: response.status,
          statusText: response.statusText,
          dataSize: JSON.stringify(response.data).length
        });
      }
      
      logger.debug(`API Response: ${config.method.toUpperCase()} ${config.url}`, {
        requestId,
        url: config.url,
        method: config.method,
        status: response.status,
        statusText: response.statusText,
        responseTime: response.headers['x-response-time'],
        dataSize: JSON.stringify(response.data).length
      });
      
      return response;
    },
    (error) => {
      const { config, response } = error;
      const requestId = config?.requestId;
      
      // End timer for request
      if (requestId) {
        performanceLogger.endTimer(requestId, {
          error: true,
          status: response?.status,
          statusText: response?.statusText
        });
      }
      
      logger.error(`API Error: ${config?.method?.toUpperCase()} ${config?.url}`, {
        requestId,
        url: config?.url,
        method: config?.method,
        status: response?.status,
        statusText: response?.statusText,
        error: error.message,
        response: logger.sanitizeData(response?.data)
      });
      
      return Promise.reject(error);
    }
  );
  
  return axiosInstance;
};

export default {
  Logger,
  logger,
  PerformanceLogger,
  performanceLogger,
  useLogger,
  withLogging,
  createNetworkLogger,
  LogLevels
}; 