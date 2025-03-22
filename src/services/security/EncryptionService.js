import CryptoJS from 'crypto-js';

class EncryptionService {
  constructor(encryptionKey = null) {
    // Use provided key or try to get from environment/config
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || 'default-secure-key-should-be-replaced';
  }
  
  // Encrypt data
  encrypt(data) {
    if (!data) return null;
    
    try {
      // Convert data to string if it's an object
      const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
      
      // Encrypt the data using AES
      const encrypted = CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  // Decrypt data
  decrypt(encryptedData) {
    if (!encryptedData) return null;
    
    try {
      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey).toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(decrypted);
      } catch {
        // Return as string if not valid JSON
        return decrypted;
      }
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw new Error('Failed to decrypt data');
    }
  }
  
  // Hash data (one-way encryption, cannot be decrypted)
  hash(data) {
    if (!data) return null;
    
    try {
      const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
      return CryptoJS.SHA256(dataString).toString();
    } catch (error) {
      console.error('Error hashing data:', error);
      throw new Error('Failed to hash data');
    }
  }
  
  // Generate a secure random token
  generateToken(length = 32) {
    try {
      const randomBytes = CryptoJS.lib.WordArray.random(length);
      return randomBytes.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Error generating token:', error);
      throw new Error('Failed to generate token');
    }
  }
}

export default EncryptionService; 