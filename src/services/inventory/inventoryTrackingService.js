import { createAuthenticatedClient } from '../shopify/auth';

class InventoryTrackingService {
  constructor() {
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Check if item is in stock
  async checkItemStock(itemId, quantity = 1) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(`/api/inventory/check-stock?itemId=${itemId}&quantity=${quantity}`);
      return response.data;
    } catch (error) {
      console.error('Error checking item stock:', error);
      throw error;
    }
  }
  
  // Reserve inventory for a transaction
  async reserveInventory(items) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/inventory/reserve', { items });
      return response.data;
    } catch (error) {
      console.error('Error reserving inventory:', error);
      throw error;
    }
  }
  
  // Release reserved inventory (e.g., when transaction is cancelled)
  async releaseInventory(reservationId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/inventory/release', { reservationId });
      return response.data;
    } catch (error) {
      console.error('Error releasing inventory:', error);
      throw error;
    }
  }
  
  // Commit inventory changes (e.g., when transaction is completed)
  async commitInventoryChanges(transactionId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/inventory/commit', { transactionId });
      return response.data;
    } catch (error) {
      console.error('Error committing inventory changes:', error);
      throw error;
    }
  }
  
  // Update inventory levels for multiple items
  async updateInventoryLevels(items) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/inventory/update-levels', { items });
      return response.data;
    } catch (error) {
      console.error('Error updating inventory levels:', error);
      throw error;
    }
  }
  
  // Sync inventory with Shopify
  async syncWithShopify() {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/inventory/sync-shopify');
      return response.data;
    } catch (error) {
      console.error('Error syncing inventory with Shopify:', error);
      throw error;
    }
  }
}

export default InventoryTrackingService; 