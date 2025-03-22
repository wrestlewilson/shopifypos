import { createAuthenticatedClient } from '../shopify/appBridge';
import CacheManager from './CacheManager';

// API Response Cache Service
class ApiResponseCache {
  constructor() {
    this.cacheManager = new CacheManager({
      defaultTTL: 600000, // 10 minutes
      maxSize: 200
    });
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Generate cache key from request parameters
  generateCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${endpoint}?${sortedParams}`;
  }
  
  // Fetch data with caching
  async fetchWithCache(endpoint, params = {}, options = {}) {
    if (!this.client) await this.initialize();
    
    const { 
      ttl = 600000, // 10 minutes
      bypassCache = false,
      forceRefresh = false
    } = options;
    
    const cacheKey = this.generateCacheKey(endpoint, params);
    
    // Return cached data if available and not forcing refresh
    if (!bypassCache && !forceRefresh && this.cacheManager.has(cacheKey)) {
      return this.cacheManager.get(cacheKey);
    }
    
    try {
      // Fetch fresh data
      const response = await this.client.get(endpoint, { params });
      const data = response.data;
      
      // Cache the response if not bypassing cache
      if (!bypassCache) {
        this.cacheManager.set(cacheKey, data, ttl);
      }
      
      return data;
    } catch (error) {
      // If error and we have cached data, return it as fallback
      if (!bypassCache && this.cacheManager.has(cacheKey)) {
        console.warn(`API request failed, using cached data for ${cacheKey}`);
        return this.cacheManager.get(cacheKey);
      }
      
      // Otherwise, throw the error
      throw error;
    }
  }
  
  // Invalidate cache for specific endpoint
  invalidateCache(endpoint, params = {}) {
    const cacheKey = this.generateCacheKey(endpoint, params);
    return this.cacheManager.delete(cacheKey);
  }
  
  // Invalidate all cache entries that start with the endpoint
  invalidateCacheByPrefix(endpointPrefix) {
    const keys = this.cacheManager.keys();
    let count = 0;
    
    for (const key of keys) {
      if (key.startsWith(endpointPrefix)) {
        this.cacheManager.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  // Clear entire cache
  clearCache() {
    return this.cacheManager.clear();
  }
  
  // Get cache statistics
  getCacheStats() {
    return this.cacheManager.getStats();
  }
}

export default ApiResponseCache; 