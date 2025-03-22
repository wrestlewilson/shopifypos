import { createAuthenticatedClient } from '../shopify/auth';

class StoreCreditBalanceService {
  constructor() {
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Record a credit transaction in the balance history
  async recordCreditTransaction(transactionData) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/store-credit/transactions', transactionData);
      return response.data;
    } catch (error) {
      console.error('Error recording credit transaction:', error);
      throw error;
    }
  }
  
  // Get a customer's credit balance
  async getCustomerBalance(customerId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(`/api/customers/${customerId}/credit/balance`);
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching customer balance:', error);
      throw error;
    }
  }
  
  // Generate a credit statement for a customer
  async generateCreditStatement(customerId, startDate, endDate) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/customers/credit/statement', {
        customerId,
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error('Error generating credit statement:', error);
      throw error;
    }
  }
}

export default new StoreCreditBalanceService(); 