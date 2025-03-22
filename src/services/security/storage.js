import { securityService } from './index';
import CryptoJS from 'crypto-js';

class SecureStorageService {
  constructor() {
    this.storage = window.localStorage;
    this.encryptionKey = process.env.REACT_APP_STORAGE_KEY || 'your-secure-storage-key';
  }

  // Set encrypted item
  setItem(key, value) {
    try {
      const encryptedValue = this.encrypt(value);
      this.storage.setItem(key, encryptedValue);
      return true;
    } catch (error) {
      console.error('Error setting encrypted item:', error);
      return false;
    }
  }

  // Get decrypted item
  getItem(key) {
    try {
      const encryptedValue = this.storage.getItem(key);
      if (!encryptedValue) return null;
      return this.decrypt(encryptedValue);
    } catch (error) {
      console.error('Error getting encrypted item:', error);
      return null;
    }
  }

  // Remove item
  removeItem(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing item:', error);
      return false;
    }
  }

  // Clear all items
  clear() {
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Get all items
  getAllItems() {
    try {
      const items = {};
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        items[key] = this.getItem(key);
      }
      return items;
    } catch (error) {
      console.error('Error getting all items:', error);
      return {};
    }
  }

  // Check if item exists
  hasItem(key) {
    return this.storage.getItem(key) !== null;
  }

  // Get storage size
  getSize() {
    return this.storage.length;
  }

  // Get storage keys
  getKeys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      keys.push(this.storage.key(i));
    }
    return keys;
  }

  // Encrypt data
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  // Decrypt data
  decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  // Store sensitive data with expiration
  setSecureItem(key, value, ttl = 24 * 60 * 60 * 1000) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        ttl
      };
      return this.setItem(key, data);
    } catch (error) {
      console.error('Error setting secure item:', error);
      return false;
    }
  }

  // Get secure item with expiration check
  getSecureItem(key) {
    try {
      const data = this.getItem(key);
      if (!data) return null;

      if (Date.now() - data.timestamp > data.ttl) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Error getting secure item:', error);
      return null;
    }
  }

  // Store session data
  setSessionData(key, value) {
    return this.setSecureItem(`session_${key}`, value, securityService.config.tokenExpiry);
  }

  // Get session data
  getSessionData(key) {
    return this.getSecureItem(`session_${key}`);
  }

  // Remove session data
  removeSessionData(key) {
    return this.removeItem(`session_${key}`);
  }

  // Store user preferences
  setUserPreferences(preferences) {
    return this.setItem('user_preferences', preferences);
  }

  // Get user preferences
  getUserPreferences() {
    return this.getItem('user_preferences') || {};
  }

  // Store authentication tokens
  setAuthTokens(tokens) {
    return this.setSecureItem('auth_tokens', tokens, securityService.config.tokenExpiry);
  }

  // Get authentication tokens
  getAuthTokens() {
    return this.getSecureItem('auth_tokens');
  }

  // Remove authentication tokens
  removeAuthTokens() {
    return this.removeItem('auth_tokens');
  }

  // Store sensitive form data
  setFormData(key, data) {
    return this.setSecureItem(`form_${key}`, data, 30 * 60 * 1000); // 30 minutes
  }

  // Get sensitive form data
  getFormData(key) {
    return this.getSecureItem(`form_${key}`);
  }

  // Remove sensitive form data
  removeFormData(key) {
    return this.removeItem(`form_${key}`);
  }

  // Clear all sensitive data
  clearSensitiveData() {
    const keys = this.getKeys();
    keys.forEach(key => {
      if (key.startsWith('session_') || key.startsWith('form_') || key === 'auth_tokens') {
        this.removeItem(key);
      }
    });
  }

  // Export storage data (for backup)
  exportData() {
    try {
      const data = this.getAllItems();
      return this.encrypt(JSON.stringify(data));
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Import storage data (from backup)
  importData(encryptedData) {
    try {
      const data = JSON.parse(this.decrypt(encryptedData));
      Object.entries(data).forEach(([key, value]) => {
        this.setItem(key, value);
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorageService();

// Export storage service
export default secureStorage; 