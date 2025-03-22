import EncryptionService from './EncryptionService';

class SecureStorageService {
  constructor() {
    this.encryptionService = new EncryptionService();
  }
  
  // Set item in localStorage with encryption
  setItem(key, value) {
    try {
      const encryptedValue = this.encryptionService.encrypt(value);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error setting secure item:', error);
      throw new Error('Failed to store data securely');
    }
  }
  
  // Get and decrypt item from localStorage
  getItem(key) {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      
      return this.encryptionService.decrypt(encryptedValue);
    } catch (error) {
      console.error('Error getting secure item:', error);
      // If decryption fails, remove the corrupted item
      localStorage.removeItem(key);
      return null;
    }
  }
  
  // Remove item from localStorage
  removeItem(key) {
    localStorage.removeItem(key);
  }
  
  // Clear all items from localStorage
  clear() {
    localStorage.clear();
  }
}

export default SecureStorageService; 