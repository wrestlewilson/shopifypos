import { Customer } from '../../models/Customer';
import { EncryptionService } from '../security';

class CustomerDAO {
  constructor() {
    this.encryptionService = new EncryptionService();
  }
  
  // Create a new customer
  async createCustomer(customerData) {
    try {
      // Encrypt sensitive data
      if (customerData.phone) {
        customerData.phone = this.encryptionService.encrypt(customerData.phone);
      }
      
      const customer = new Customer(customerData);
      await customer.save();
      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }
  
  // Get customer by ID
  async getCustomerById(id) {
    try {
      const customer = await Customer.findById(id);
      
      if (customer && customer.phone) {
        // Decrypt phone number
        customer.phone = this.encryptionService.decrypt(customer.phone);
      }
      
      return customer;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  }
  
  // Get customer by Shopify ID
  async getCustomerByShopifyId(shopifyId) {
    try {
      const customer = await Customer.findOne({ shopifyCustomerId: shopifyId });
      
      if (customer && customer.phone) {
        // Decrypt phone number
        customer.phone = this.encryptionService.decrypt(customer.phone);
      }
      
      return customer;
    } catch (error) {
      console.error('Error getting customer by Shopify ID:', error);
      throw error;
    }
  }
  
  // Search customers
  async searchCustomers(query, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'lastName', sortOrder = 'asc' } = options;
      
      const searchQuery = {};
      
      if (query) {
        searchQuery.$or = [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const customers = await Customer.find(searchQuery)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await Customer.countDocuments(searchQuery);
      
      // Decrypt sensitive data
      customers.forEach(customer => {
        if (customer.phone) {
          customer.phone = this.encryptionService.decrypt(customer.phone);
        }
      });
      
      return {
        customers,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }
  
  // Update customer
  async updateCustomer(id, updateData) {
    try {
      // Encrypt sensitive data
      if (updateData.phone) {
        updateData.phone = this.encryptionService.encrypt(updateData.phone);
      }
      
      // Set updated timestamp
      updateData.updatedAt = new Date();
      
      const customer = await Customer.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      
      if (customer && customer.phone) {
        // Decrypt phone number for return value
        customer.phone = this.encryptionService.decrypt(customer.phone);
      }
      
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }
  
  // Delete customer
  async deleteCustomer(id) {
    try {
      return await Customer.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
  
  // Get customer store credit
  async getCustomerStoreCredit(id) {
    try {
      const customer = await Customer.findById(id, 'storeCredit');
      return customer ? customer.storeCredit : null;
    } catch (error) {
      console.error('Error getting customer store credit:', error);
      throw error;
    }
  }
  
  // Update customer store credit
  async updateCustomerStoreCredit(id, creditData) {
    try {
      const customer = await Customer.findByIdAndUpdate(
        id,
        { 
          $set: { 
            'storeCredit.balance': creditData.balance,
            'storeCredit.expiryDate': creditData.expiryDate,
            'storeCredit.lastUpdated': new Date()
          }
        },
        { new: true }
      );
      
      return customer ? customer.storeCredit : null;
    } catch (error) {
      console.error('Error updating customer store credit:', error);
      throw error;
    }
  }
}

export default CustomerDAO; 