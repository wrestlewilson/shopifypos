import { EncryptionService } from '../security/EncryptionService';

// Cache Manager Class
class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.encryptionService = new EncryptionService();
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes in milliseconds
    this.maxSize = options.maxSize || 100; // Maximum number of items in cache
    this.sensitiveKeys = options.sensitiveKeys || []; // Keys that should be encrypted
  }
  
  // Set an item in the cache
  set(key, value, ttl = this.defaultTTL) {
    // Check if cache is at max capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    // Encrypt value if key is in sensitiveKeys list
    const storedValue = this.sensitiveKeys.includes(key) 
      ? this.encryptionService.encrypt(value)
      : value;
    
    // Store the item with expiration time
    this.cache.set(key, {
      value: storedValue,
      expires: Date.now() + ttl,
      encrypted: this.sensitiveKeys.includes(key)
    });
    
    return true;
  }
  
  // Get an item from the cache
  get(key) {
    // Check if key exists and not expired
    if (!this.cache.has(key)) {
      return null;
    }
    
    const item = this.cache.get(key);
    
    // Check if item has expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Decrypt value if it was encrypted
    return item.encrypted 
      ? this.encryptionService.decrypt(item.value)
      : item.value;
  }
  
  // Delete an item from the cache
  delete(key) {
    return this.cache.delete(key);
  }
  
  // Clear all items from the cache
  clear() {
    this.cache.clear();
    return true;
  }
  
  // Check if key exists in cache and not expired
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const item = this.cache.get(key);
    
    // Check if item has expired
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Get cache size
  size() {
    // Clean expired items first
    this.cleanExpired();
    return this.cache.size;
  }
  
  // Clean expired items
  cleanExpired() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < now) {
        this.cache.delete(key);
      }
    }
  }
  
  // Evict oldest item from cache
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expires < oldestTime) {
        oldestKey = key;
        oldestTime = item.expires;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  // Get all keys in cache
  keys() {
    // Clean expired items first
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }
  
  // Get cache statistics
  getStats() {
    // Clean expired items first
    this.cleanExpired();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
      sensitiveKeysCount: this.sensitiveKeys.length
    };
  }
}

export default CacheManager; 