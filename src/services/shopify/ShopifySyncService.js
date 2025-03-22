import { createAuthenticatedClient } from './appBridge';
import { CustomerDAO, TransactionDAO } from '../database';
import { AuditLoggingService } from '../security/AuditLoggingService';

// Shopify Data Synchronization Service
class ShopifySyncService {
  constructor() {
    this.client = null;
    this.customerDAO = new CustomerDAO();
    this.transactionDAO = new TransactionDAO();
    this.auditService = new AuditLoggingService();
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
    await this.auditService.initialize();
  }
  
  // Sync customer data from Shopify
  async syncCustomers(options = {}) {
    if (!this.client) await this.initialize();
    
    try {
      const { sinceId = 0, limit = 50, syncAll = false } = options;
      
      // Log sync start
      await this.auditService.logSystemEvent('customer_sync_start', { 
        sinceId, 
        limit, 
        syncAll 
      });
      
      // Get customers from Shopify
      const response = await this.client.get('/api/shopify/customers', {
        params: {
          since_id: sinceId,
          limit
        }
      });
      
      const shopifyCustomers = response.data.customers;
      const results = {
        total: shopifyCustomers.length,
        created: 0,
        updated: 0,
        failed: 0,
        lastSyncedId: sinceId
      };
      
      // Process each customer
      for (const shopifyCustomer of shopifyCustomers) {
        try {
          // Check if customer already exists
          const existingCustomer = await this.customerDAO.getCustomerByShopifyId(
            shopifyCustomer.id.toString()
          );
          
          if (existingCustomer) {
            // Update existing customer
            await this.customerDAO.updateCustomer(existingCustomer._id, {
              firstName: shopifyCustomer.first_name,
              lastName: shopifyCustomer.last_name,
              email: shopifyCustomer.email,
              phone: shopifyCustomer.phone,
              address: {
                street: shopifyCustomer.default_address?.address1,
                city: shopifyCustomer.default_address?.city,
                state: shopifyCustomer.default_address?.province,
                zipCode: shopifyCustomer.default_address?.zip,
                country: shopifyCustomer.default_address?.country
              },
              updatedAt: new Date()
            });
            
            results.updated++;
          } else {
            // Create new customer
            await this.customerDAO.createCustomer({
              shopifyCustomerId: shopifyCustomer.id.toString(),
              firstName: shopifyCustomer.first_name,
              lastName: shopifyCustomer.last_name,
              email: shopifyCustomer.email,
              phone: shopifyCustomer.phone,
              address: {
                street: shopifyCustomer.default_address?.address1,
                city: shopifyCustomer.default_address?.city,
                state: shopifyCustomer.default_address?.province,
                zipCode: shopifyCustomer.default_address?.zip,
                country: shopifyCustomer.default_address?.country
              },
              storeCredit: {
                balance: 0,
                lastUpdated: new Date()
              }
            });
            
            results.created++;
          }
          
          // Update last synced ID
          if (shopifyCustomer.id > results.lastSyncedId) {
            results.lastSyncedId = shopifyCustomer.id;
          }
        } catch (err) {
          console.error(`Error syncing customer ${shopifyCustomer.id}:`, err);
          results.failed++;
        }
      }
      
      // Log sync completion
      await this.auditService.logSystemEvent('customer_sync_complete', results);
      
      // If syncAll is true and there are more customers, continue syncing
      if (syncAll && shopifyCustomers.length === limit) {
        const nextResults = await this.syncCustomers({
          sinceId: results.lastSyncedId,
          limit,
          syncAll
        });
        
        // Combine results
        results.total += nextResults.total;
        results.created += nextResults.created;
        results.updated += nextResults.updated;
        results.failed += nextResults.failed;
        results.lastSyncedId = nextResults.lastSyncedId;
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing customers from Shopify:', error);
      
      // Log sync error
      await this.auditService.logSystemEvent('customer_sync_error', { 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  // Sync orders data from Shopify
  async syncOrders(options = {}) {
    if (!this.client) await this.initialize();
    
    try {
      const { sinceId = 0, limit = 50, syncAll = false, status = 'any' } = options;
      
      // Log sync start
      await this.auditService.logSystemEvent('order_sync_start', { 
        sinceId, 
        limit, 
        syncAll,
        status
      });
      
      // Get orders from Shopify
      const response = await this.client.get('/api/shopify/orders', {
        params: {
          since_id: sinceId,
          limit,
          status
        }
      });
      
      const shopifyOrders = response.data.orders;
      const results = {
        total: shopifyOrders.length,
        created: 0,
        updated: 0,
        failed: 0,
        lastSyncedId: sinceId
      };
      
      // Process each order
      for (const shopifyOrder of shopifyOrders) {
        try {
          // Check if order already exists
          const existingTransaction = await this.transactionDAO.getTransactionByShopifyOrderId(
            shopifyOrder.id.toString()
          );
          
          if (existingTransaction) {
            // Update existing transaction
            await this.transactionDAO.updateTransaction(existingTransaction._id, {
              status: this.mapShopifyOrderStatusToTransactionStatus(shopifyOrder.financial_status),
              // Add other fields to update as needed
            });
            
            results.updated++;
          } else {
            // Find or create customer
            let customer = null;
            if (shopifyOrder.customer) {
              customer = await this.customerDAO.getCustomerByShopifyId(
                shopifyOrder.customer.id.toString()
              );
              
              if (!customer) {
                // Create customer if not exists
                customer = await this.customerDAO.createCustomer({
                  shopifyCustomerId: shopifyOrder.customer.id.toString(),
                  firstName: shopifyOrder.customer.first_name,
                  lastName: shopifyOrder.customer.last_name,
                  email: shopifyOrder.customer.email,
                  phone: shopifyOrder.customer.phone,
                  storeCredit: {
                    balance: 0,
                    lastUpdated: new Date()
                  }
                });
              }
            }
            
            // Create new transaction
            await this.transactionDAO.createTransaction({
              shopifyOrderId: shopifyOrder.id.toString(),
              type: 'sell', // Assuming all Shopify orders are sales
              status: this.mapShopifyOrderStatusToTransactionStatus(shopifyOrder.financial_status),
              customer: customer ? customer._id : null,
              items: shopifyOrder.line_items.map(item => ({
                name: item.name,
                sku: item.sku,
                price: parseFloat(item.price),
                quantity: item.quantity,
                tax: parseFloat(item.tax_lines.reduce((sum, tax) => sum + parseFloat(tax.price), 0)),
                total: parseFloat(item.price) * item.quantity
              })),
              payments: this.extractPaymentsFromShopifyOrder(shopifyOrder),
              subtotal: parseFloat(shopifyOrder.subtotal_price),
              tax: parseFloat(shopifyOrder.total_tax),
              discount: parseFloat(shopifyOrder.total_discounts),
              total: parseFloat(shopifyOrder.total_price),
              notes: shopifyOrder.note,
              employeeId: 'system', // System-generated transaction
              employeeName: 'Shopify Sync',
              locationId: shopifyOrder.location_id || 'default',
              locationName: 'Shopify',
              date: new Date(shopifyOrder.created_at)
            });
            
            results.created++;
          }
          
          // Update last synced ID
          if (shopifyOrder.id > results.lastSyncedId) {
            results.lastSyncedId = shopifyOrder.id;
          }
        } catch (err) {
          console.error(`Error syncing order ${shopifyOrder.id}:`, err);
          results.failed++;
        }
      }
      
      // Log sync completion
      await this.auditService.logSystemEvent('order_sync_complete', results);
      
      // If syncAll is true and there are more orders, continue syncing
      if (syncAll && shopifyOrders.length === limit) {
        const nextResults = await this.syncOrders({
          sinceId: results.lastSyncedId,
          limit,
          syncAll,
          status
        });
        
        // Combine results
        results.total += nextResults.total;
        results.created += nextResults.created;
        results.updated += nextResults.updated;
        results.failed += nextResults.failed;
        results.lastSyncedId = nextResults.lastSyncedId;
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing orders from Shopify:', error);
      
      // Log sync error
      await this.auditService.logSystemEvent('order_sync_error', { 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  // Map Shopify order status to transaction status
  mapShopifyOrderStatusToTransactionStatus(shopifyStatus) {
    switch (shopifyStatus) {
      case 'paid':
        return 'completed';
      case 'refunded':
        return 'refunded';
      case 'partially_refunded':
        return 'partially_refunded';
      case 'voided':
        return 'voided';
      case 'pending':
      case 'authorized':
        return 'pending';
      default:
        return 'pending';
    }
  }
  
  // Extract payments from Shopify order
  extractPaymentsFromShopifyOrder(shopifyOrder) {
    const payments = [];
    
    // Add payment from payment details
    if (shopifyOrder.payment_details) {
      payments.push({
        method: this.mapShopifyPaymentGatewayToMethod(shopifyOrder.payment_details.credit_card_company),
        amount: parseFloat(shopifyOrder.total_price),
        reference: shopifyOrder.payment_details.credit_card_number
      });
    } 
    // If no payment details, use gateway
    else if (shopifyOrder.gateway) {
      payments.push({
        method: this.mapShopifyPaymentGatewayToMethod(shopifyOrder.gateway),
        amount: parseFloat(shopifyOrder.total_price),
        reference: shopifyOrder.id.toString()
      });
    }
    // Fallback to "other" payment method
    else {
      payments.push({
        method: 'other',
        amount: parseFloat(shopifyOrder.total_price),
        reference: shopifyOrder.id.toString()
      });
    }
    
    return payments;
  }
  
  // Map Shopify payment gateway to payment method
  mapShopifyPaymentGatewayToMethod(gateway) {
    if (!gateway) return 'other';
    
    const gatewayLower = gateway.toLowerCase();
    
    if (gatewayLower.includes('visa') || 
        gatewayLower.includes('mastercard') || 
        gatewayLower.includes('amex') || 
        gatewayLower.includes('discover')) {
      return 'credit_card';
    }
    
    if (gatewayLower.includes('cash')) {
      return 'cash';
    }
    
    if (gatewayLower.includes('gift') || gatewayLower.includes('card')) {
      return 'gift_card';
    }
    
    if (gatewayLower.includes('store_credit')) {
      return 'store_credit';
    }
    
    return 'other';
  }
  
  // Push store credit updates to Shopify
  async pushStoreCreditToShopify(customerId) {
    if (!this.client) await this.initialize();
    
    try {
      // Get customer
      const customer = await this.customerDAO.getCustomerById(customerId);
      if (!customer || !customer.shopifyCustomerId) {
        throw new Error('Customer not found or not linked to Shopify');
      }
      
      // Push store credit as customer metafield
      await this.client.post(`/api/shopify/customers/${customer.shopifyCustomerId}/metafields`, {
        metafield: {
          namespace: 'store_credit',
          key: 'balance',
          value: customer.storeCredit.balance.toString(),
          value_type: 'string'
        }
      });
      
      // Log sync
      await this.auditService.logSystemEvent('store_credit_push', {
        customerId,
        shopifyCustomerId: customer.shopifyCustomerId,
        balance: customer.storeCredit.balance
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error pushing store credit to Shopify:', error);
      
      // Log sync error
      await this.auditService.logSystemEvent('store_credit_push_error', {
        customerId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  // Schedule regular sync jobs
  scheduleSync(options = {}) {
    const { 
      customerSyncInterval = 3600000, // 1 hour
      orderSyncInterval = 900000,     // 15 minutes
      initialDelay = 10000            // 10 seconds
    } = options;
    
    // Initial sync after delay
    setTimeout(() => {
      this.syncCustomers({ limit: 50, syncAll: true })
        .catch(err => console.error('Initial customer sync failed:', err));
      
      this.syncOrders({ limit: 50, syncAll: true, status: 'any' })
        .catch(err => console.error('Initial order sync failed:', err));
    }, initialDelay);
    
    // Schedule regular customer sync
    setInterval(() => {
      this.syncCustomers({ limit: 50 })
        .catch(err => console.error('Scheduled customer sync failed:', err));
    }, customerSyncInterval);
    
    // Schedule regular order sync
    setInterval(() => {
      this.syncOrders({ limit: 50, status: 'any' })
        .catch(err => console.error('Scheduled order sync failed:', err));
    }, orderSyncInterval);
    
    console.log('Shopify sync scheduled');
  }
}

export default ShopifySyncService; 