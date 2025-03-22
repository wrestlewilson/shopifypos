import { EncryptionService } from '../security/EncryptionService';

// Local Storage Cache Service
class LocalStorageCache {
  constructor(prefix = 'app_cache_') {
    this.prefix = prefix;
    this.encryptionService = new EncryptionService();
    this.sensitiveKeys = []; // Keys that should be encrypted
  }
  
  // Set an item in localStorage with expiration
  set(key, value, ttl = 3600000) { // Default 1 hour
    const prefixedKey = this.prefix + key;
    const expires = Date.now() + ttl;
    
    // Encrypt value if key is in sensitiveKeys list
    const shouldEncrypt = this.sensitiveKeys.includes(key);
    const storedValue = shouldEncrypt 
      ? this.encryptionService.encrypt(value)
      : value;
    
    const item = {
      value: storedValue,
      expires,
      encrypted: shouldEncrypt
    };
    
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Error storing item in localStorage:', error);
      return false;
    }
  }
  
  // Get an item from localStorage
  get(key) {
    const prefixedKey = this.prefix + key;
    const itemStr = localStorage.getItem(prefixedKey);
    
    if (!itemStr) {
      return null;
    }
    
    try {
      const item = JSON.parse(itemStr);
      
      // Check if item has expired
      if (item.expires < Date.now()) {
        localStorage.removeItem(prefixedKey);
        return null;
      }
      
      // Decrypt value if it was encrypted
      return item.encrypted 
        ? this.encryptionService.decrypt(item.value)
        : item.value;
    } catch (error) {
      console.error('Error retrieving item from localStorage:', error);
      localStorage.removeItem(prefixedKey);
      return null;
    }
  }
  
  // Delete an item from localStorage
  delete(key) {
    const prefixedKey = this.prefix + key;
    localStorage.removeItem(prefixedKey);
    return true;
  }
  
  // Clear all items with this prefix from localStorage
  clear() {
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
    
    return true;
  }
  
  // Check if key exists in localStorage and not expired
  has(key) {
    const prefixedKey = this.prefix + key;
    const itemStr = localStorage.getItem(prefixedKey);
    
    if (!itemStr) {
      return false;
    }
    
    try {
      const item = JSON.parse(itemStr);
      
      // Check if item has expired
      if (item.expires < Date.now()) {
        localStorage.removeItem(prefixedKey);
        return false;
      }
      
      return true;
    } catch (error) {
      localStorage.removeItem(prefixedKey);
      return false;
    }
  }
  
  // Add a key to the sensitive keys list
  addSensitiveKey(key) {
    if (!this.sensitiveKeys.includes(key)) {
      this.sensitiveKeys.push(key);
    }
  }
  
  // Remove a key from the sensitive keys list
  removeSensitiveKey(key) {
    this.sensitiveKeys = this.sensitiveKeys.filter(k => k !== key);
  }
  
  // Clean expired items
  cleanExpired() {
    const keys = Object.keys(localStorage);
    let count = 0;
    
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        const itemStr = localStorage.getItem(key);
        
        try {
          const item = JSON.parse(itemStr);
          
          if (item.expires < Date.now()) {
            localStorage.removeItem(key);
            count++;
          }
        } catch (error) {
          // Remove invalid items
          localStorage.removeItem(key);
          count++;
        }
      }
    }
    
    return count;
  }
  
  // Get all keys with this prefix
  keys() {
    const allKeys = Object.keys(localStorage);
    const prefixLength = this.prefix.length;
    
    return allKeys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.substring(prefixLength));
  }
  
  // Get cache statistics
  getStats() {
    const keys = this.keys();
    let size = 0;
    let validItems = 0;
    let expiredItems = 0;
    
    for (const key of keys) {
      const prefixedKey = this.prefix + key;
      const itemStr = localStorage.getItem(prefixedKey);
      
      if (itemStr) {
        size += itemStr.length;
        
        try {
          const item = JSON.parse(itemStr);
          
          if (item.expires < Date.now()) {
            expiredItems++;
          } else {
            validItems++;
          }
        } catch (error) {
          expiredItems++;
        }
      }
    }
    
    return {
      totalItems: keys.length,
      validItems,
      expiredItems,
      size: `${Math.round(size / 1024)} KB`,
      sensitiveKeysCount: this.sensitiveKeys.length
    };
  }
}

export default LocalStorageCache; 