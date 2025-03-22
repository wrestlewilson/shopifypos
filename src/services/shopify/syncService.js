import { ShopifyError } from '../errorHandling';

class ShopifySyncService {
  constructor() {
    this.isSyncing = false;
  }

  async syncCustomer(customerId) {
    if (this.isSyncing) {
      throw new ShopifyError('Sync operation already in progress');
    }

    try {
      this.isSyncing = true;
      // Implement actual Shopify customer sync logic here
      const response = await fetch(`/api/shopify/customers/${customerId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ShopifyError('Failed to sync customer with Shopify');
      }

      return await response.json();
    } catch (error) {
      throw new ShopifyError('Customer sync failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncTransaction(transactionId) {
    if (this.isSyncing) {
      throw new ShopifyError('Sync operation already in progress');
    }

    try {
      this.isSyncing = true;
      // Implement actual Shopify transaction sync logic here
      const response = await fetch(`/api/shopify/transactions/${transactionId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ShopifyError('Failed to sync transaction with Shopify');
      }

      return await response.json();
    } catch (error) {
      throw new ShopifyError('Transaction sync failed', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncInventory(productId) {
    if (this.isSyncing) {
      throw new ShopifyError('Sync operation already in progress');
    }

    try {
      this.isSyncing = true;
      // Implement actual Shopify inventory sync logic here
      const response = await fetch(`/api/shopify/products/${productId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ShopifyError('Failed to sync inventory with Shopify');
      }

      return await response.json();
    } catch (error) {
      throw new ShopifyError('Inventory sync failed', error);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const shopifySyncService = new ShopifySyncService(); 