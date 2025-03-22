import EncryptionService from './EncryptionService';

class SecurePaymentHandler {
  constructor() {
    this.encryptionService = new EncryptionService();
  }
  
  // Mask credit card number (show only last 4 digits)
  maskCardNumber(cardNumber) {
    if (!cardNumber) return '';
    
    const sanitized = cardNumber.replace(/\D/g, '');
    const lastFour = sanitized.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  }
  
  // Encrypt card data for transmission
  encryptCardData(cardData) {
    try {
      return this.encryptionService.encrypt(cardData);
    } catch (error) {
      console.error('Error encrypting card data:', error);
      throw new Error('Failed to secure payment information');
    }
  }
  
  // Validate credit card number using Luhn algorithm
  validateCardNumber(cardNumber) {
    if (!cardNumber) return false;
    
    const sanitized = cardNumber.replace(/\D/g, '');
    
    // Check if the card number is a valid length
    if (sanitized.length < 13 || sanitized.length > 19) {
      return false;
    }
    
    // Luhn algorithm implementation
    let sum = 0;
    let double = false;
    
    // Loop through values starting from the rightmost digit
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i));
      
      // Double every second digit
      if (double) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      double = !double;
    }
    
    // If the sum is a multiple of 10, the number is valid
    return sum % 10 === 0;
  }
  
  // Determine card type based on number
  getCardType(cardNumber) {
    if (!cardNumber) return 'Unknown';
    
    const sanitized = cardNumber.replace(/\D/g, '');
    
    // Visa
    if (/^4/.test(sanitized)) {
      return 'Visa';
    }
    
    // Mastercard
    if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) {
      return 'Mastercard';
    }
    
    // American Express
    if (/^3[47]/.test(sanitized)) {
      return 'American Express';
    }
    
    // Discover
    if (/^6(?:011|5)/.test(sanitized)) {
      return 'Discover';
    }
    
    return 'Unknown';
  }
  
  // Format expiration date (MM/YY)
  formatExpirationDate(month, year) {
    if (!month || !year) return '';
    
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().length === 4 ? year.toString().slice(-2) : year.toString().padStart(2, '0');
    
    return `${monthStr}/${yearStr}`;
  }
}

export default SecurePaymentHandler; 