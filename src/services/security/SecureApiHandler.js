import EncryptionService from './EncryptionService';

class SecureApiHandler {
  constructor() {
    this.encryptionService = new EncryptionService();
  }
  
  // Add security headers to API requests
  addSecurityHeaders(headers = {}) {
    const timestamp = Date.now().toString();
    const nonce = this.encryptionService.generateToken(16);
    
    return {
      ...headers,
      'X-Request-Timestamp': timestamp,
      'X-Request-Nonce': nonce,
      'X-Request-Signature': this.generateRequestSignature(timestamp, nonce)
    };
  }
  
  // Generate request signature for API authentication
  generateRequestSignature(timestamp, nonce) {
    const apiKey = process.env.API_KEY || 'default-api-key';
    const signatureBase = `${apiKey}:${timestamp}:${nonce}`;
    return this.encryptionService.hash(signatureBase);
  }
  
  // Encrypt sensitive request data
  encryptRequestData(data) {
    return this.encryptionService.encrypt(data);
  }
  
  // Decrypt response data
  decryptResponseData(encryptedData) {
    return this.encryptionService.decrypt(encryptedData);
  }
  
  // Verify response signature
  verifyResponseSignature(response) {
    const signature = response.headers['x-response-signature'];
    const timestamp = response.headers['x-response-timestamp'];
    const nonce = response.headers['x-response-nonce'];
    
    if (!signature || !timestamp || !nonce) {
      console.warn('Response is missing security headers');
      return false;
    }
    
    const apiKey = process.env.API_KEY || 'default-api-key';
    const signatureBase = `${apiKey}:${timestamp}:${nonce}:${JSON.stringify(response.data)}`;
    const calculatedSignature = this.encryptionService.hash(signatureBase);
    
    return signature === calculatedSignature;
  }
}

export default SecureApiHandler; 