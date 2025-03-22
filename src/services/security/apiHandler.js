import { securityService } from './index';
import { secureStorage } from './storage';
import { authService } from './auth';

class SecureApiHandler {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }

  // Initialize CSRF token
  async initializeCSRF() {
    try {
      const response = await fetch(`${this.baseURL}/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const { token } = await response.json();
        secureStorage.setSessionData('csrfToken', token);
      }
    } catch (error) {
      console.error('CSRF token initialization error:', error);
    }
  }

  // Make API request
  async request(options) {
    const {
      method = 'GET',
      url,
      data,
      headers = {},
      requiresAuth = true,
      retry = true,
      retryCount = 3,
      retryDelay = 1000
    } = options;

    try {
      // Add request to queue if rate limited
      if (this.isRateLimited()) {
        return new Promise((resolve, reject) => {
          this.requestQueue.push({
            options,
            resolve,
            reject
          });
          this.processQueue();
        });
      }

      // Prepare request
      const requestOptions = await this.prepareRequest({
        method,
        url,
        data,
        headers,
        requiresAuth
      });

      // Make request
      const response = await fetch(requestOptions.url, requestOptions);
      
      // Handle response
      return await this.handleResponse(response, options);
    } catch (error) {
      // Handle error
      return this.handleError(error, options, retry, retryCount, retryDelay);
    }
  }

  // Prepare request
  async prepareRequest({ method, url, data, headers, requiresAuth }) {
    // Add base headers
    const baseHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // Add CSRF token
    const csrfToken = secureStorage.getSessionData('csrfToken');
    if (csrfToken) {
      baseHeaders['X-CSRF-Token'] = csrfToken;
    }

    // Add auth token if required
    if (requiresAuth) {
      const tokens = secureStorage.getAuthTokens();
      if (tokens) {
        baseHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    }

    // Prepare request options
    const requestOptions = {
      method,
      headers: baseHeaders,
      credentials: 'include'
    };

    // Add body if present
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    // Add URL
    requestOptions.url = `${this.baseURL}${url}`;

    return requestOptions;
  }

  // Handle response
  async handleResponse(response, options) {
    // Check for rate limiting
    if (response.status === 429) {
      this.handleRateLimit(response);
      throw new Error('Rate limit exceeded');
    }

    // Check for authentication errors
    if (response.status === 401) {
      await this.handleAuthError(options);
      throw new Error('Authentication required');
    }

    // Check for CSRF errors
    if (response.status === 403) {
      await this.handleCSRFError();
      throw new Error('CSRF validation failed');
    }

    // Parse response
    const data = await response.json();

    // Sanitize response data
    return this.sanitizeResponse(data);
  }

  // Handle error
  async handleError(error, options, retry, retryCount, retryDelay) {
    // Check if retry is needed
    if (retry && retryCount > 0) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return this.request({
        ...options,
        retryCount: retryCount - 1
      });
    }

    // Handle specific error types
    if (error.name === 'NetworkError') {
      throw new Error('Network connection error');
    }

    if (error.name === 'TimeoutError') {
      throw new Error('Request timeout');
    }

    throw error;
  }

  // Handle rate limit
  handleRateLimit(response) {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      setTimeout(() => {
        this.processQueue();
      }, parseInt(retryAfter) * 1000);
    }
  }

  // Handle authentication error
  async handleAuthError(options) {
    try {
      // Attempt token refresh
      await authService.refreshToken();
      
      // Retry request with new token
      return this.request(options);
    } catch (error) {
      // Logout if refresh fails
      await authService.logout();
      throw error;
    }
  }

  // Handle CSRF error
  async handleCSRFError() {
    try {
      // Reinitialize CSRF token
      await this.initializeCSRF();
    } catch (error) {
      console.error('CSRF error handling failed:', error);
    }
  }

  // Process request queue
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    const request = this.requestQueue.shift();

    try {
      const response = await this.request(request.options);
      request.resolve(response);
    } catch (error) {
      request.reject(error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Check if rate limited
  isRateLimited() {
    const rateLimit = secureStorage.getSessionData('rateLimit');
    if (!rateLimit) return false;

    return Date.now() < rateLimit.expiresAt;
  }

  // Sanitize response data
  sanitizeResponse(data) {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeResponse(item));
    }

    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeResponse(value);
      }
      return sanitized;
    }

    if (typeof data === 'string') {
      return securityService.sanitizeInput(data, 'text');
    }

    return data;
  }

  // Cancel pending requests
  cancelPendingRequests() {
    for (const [key, controller] of this.pendingRequests) {
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  // HTTP method helpers
  async get(url, options = {}) {
    return this.request({ ...options, method: 'GET', url });
  }

  async post(url, data, options = {}) {
    return this.request({ ...options, method: 'POST', url, data });
  }

  async put(url, data, options = {}) {
    return this.request({ ...options, method: 'PUT', url, data });
  }

  async patch(url, data, options = {}) {
    return this.request({ ...options, method: 'PATCH', url, data });
  }

  async delete(url, options = {}) {
    return this.request({ ...options, method: 'DELETE', url });
  }
}

// Create singleton instance
export const secureApiHandler = new SecureApiHandler();

// Export API handler
export default secureApiHandler; 