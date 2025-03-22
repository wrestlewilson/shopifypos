class ConfigService {
  constructor() {
    this.config = {
      api: {
        baseUrl: process.env.REACT_APP_API_URL,
        wsUrl: process.env.REACT_APP_WS_URL,
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },
      logging: {
        enabled: process.env.REACT_APP_ENABLE_LOGGING === 'true',
        level: process.env.REACT_APP_LOG_LEVEL || 'info',
        maxLogSize: 5 * 1024 * 1024, // 5MB
        maxLogFiles: 5
      },
      analytics: {
        enabled: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        trackingId: process.env.REACT_APP_GA_TRACKING_ID,
        debug: process.env.REACT_APP_DEBUG === 'true'
      },
      cache: {
        enabled: true,
        maxAge: 3600, // 1 hour
        maxSize: 50 * 1024 * 1024 // 50MB
      },
      performance: {
        enableMonitoring: true,
        samplingRate: 0.1,
        thresholds: {
          slowRender: 100, // ms
          slowNetwork: 1000, // ms
          memoryWarning: 0.8 // 80% of max
        }
      },
      security: {
        tokenExpiry: 3600, // 1 hour
        refreshTokenExpiry: 7 * 24 * 3600, // 7 days
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60, // 15 minutes
        rateLimit: {
          window: 15 * 60 * 1000, // 15 minutes
          max: 100
        }
      }
    };
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config);
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, this.config);
    target[lastKey] = value;
  }

  merge(partialConfig) {
    this.config = {
      ...this.config,
      ...partialConfig
    };
  }

  reset() {
    this.config = {
      api: {
        baseUrl: process.env.REACT_APP_API_URL,
        wsUrl: process.env.REACT_APP_WS_URL,
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },
      logging: {
        enabled: process.env.REACT_APP_ENABLE_LOGGING === 'true',
        level: process.env.REACT_APP_LOG_LEVEL || 'info',
        maxLogSize: 5 * 1024 * 1024,
        maxLogFiles: 5
      },
      analytics: {
        enabled: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        trackingId: process.env.REACT_APP_GA_TRACKING_ID,
        debug: process.env.REACT_APP_DEBUG === 'true'
      },
      cache: {
        enabled: true,
        maxAge: 3600,
        maxSize: 50 * 1024 * 1024
      },
      performance: {
        enableMonitoring: true,
        samplingRate: 0.1,
        thresholds: {
          slowRender: 100,
          slowNetwork: 1000,
          memoryWarning: 0.8
        }
      },
      security: {
        tokenExpiry: 3600,
        refreshTokenExpiry: 7 * 24 * 3600,
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60,
        rateLimit: {
          window: 15 * 60 * 1000,
          max: 100
        }
      }
    };
  }

  validate() {
    const requiredFields = [
      'api.baseUrl',
      'api.wsUrl',
      'security.tokenExpiry',
      'security.refreshTokenExpiry'
    ];

    const missingFields = requiredFields.filter(field => !this.get(field));

    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    return true;
  }

  // Environment-specific methods
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  // Feature flags
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`) === true;
  }

  enableFeature(feature) {
    this.set(`features.${feature}`, true);
  }

  disableFeature(feature) {
    this.set(`features.${feature}`, false);
  }

  // API configuration
  getApiConfig() {
    return this.get('api');
  }

  setApiConfig(config) {
    this.set('api', { ...this.get('api'), ...config });
  }

  // Security configuration
  getSecurityConfig() {
    return this.get('security');
  }

  setSecurityConfig(config) {
    this.set('security', { ...this.get('security'), ...config });
  }

  // Performance configuration
  getPerformanceConfig() {
    return this.get('performance');
  }

  setPerformanceConfig(config) {
    this.set('performance', { ...this.get('performance'), ...config });
  }

  // Cache configuration
  getCacheConfig() {
    return this.get('cache');
  }

  setCacheConfig(config) {
    this.set('cache', { ...this.get('cache'), ...config });
  }

  // Analytics configuration
  getAnalyticsConfig() {
    return this.get('analytics');
  }

  setAnalyticsConfig(config) {
    this.set('analytics', { ...this.get('analytics'), ...config });
  }

  // Logging configuration
  getLoggingConfig() {
    return this.get('logging');
  }

  setLoggingConfig(config) {
    this.set('logging', { ...this.get('logging'), ...config });
  }
}

// Create singleton instance
export const configService = new ConfigService();

// Export configuration hooks
export const useConfig = () => {
  const [config, setConfig] = React.useState(configService.config);

  React.useEffect(() => {
    const updateConfig = () => {
      setConfig({ ...configService.config });
    };

    // Subscribe to config changes
    configService.subscribe(updateConfig);

    return () => {
      configService.unsubscribe(updateConfig);
    };
  }, []);

  return config;
};

export const useConfigValue = (key) => {
  const [value, setValue] = React.useState(configService.get(key));

  React.useEffect(() => {
    const updateValue = () => {
      setValue(configService.get(key));
    };

    // Subscribe to config changes
    configService.subscribe(updateValue);

    return () => {
      configService.unsubscribe(updateValue);
    };
  }, [key]);

  return value;
};

export default configService; 