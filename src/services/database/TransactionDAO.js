import { Transaction } from '../../models/Transaction';

class TransactionDAO {
  constructor() {}
  
  // Create a new transaction
  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      await transaction.save();
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
  
  // Get transaction by ID
  async getTransactionById(id) {
    try {
      return await Transaction.findById(id).populate('customer');
    } catch (error) {
      console.error('Error getting transaction by ID:', error);
      throw error;
    }
  }
  
  // Get transaction by Shopify order ID
  async getTransactionByShopifyOrderId(shopifyOrderId) {
    try {
      return await Transaction.findOne({ shopifyOrderId }).populate('customer');
    } catch (error) {
      console.error('Error getting transaction by Shopify order ID:', error);
      throw error;
    }
  }
  
  // Search transactions
  async searchTransactions(filters = {}, options = {}) {
    try {
      const { 
        type, 
        status, 
        customerId, 
        employeeId, 
        locationId, 
        startDate, 
        endDate,
        minAmount,
        maxAmount,
        search
      } = filters;
      
      const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
      
      const query = {};
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (customerId) query.customer = customerId;
      if (employeeId) query.employeeId = employeeId;
      if (locationId) query.locationId = locationId;
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      
      if (minAmount || maxAmount) {
        query.total = {};
        if (minAmount) query.total.$gte = parseFloat(minAmount);
        if (maxAmount) query.total.$lte = parseFloat(maxAmount);
      }
      
      if (search) {
        query.$or = [
          { 'items.name': { $regex: search, $options: 'i' } },
          { 'items.sku': { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const transactions = await Transaction.find(query)
        .populate('customer')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await Transaction.countDocuments(query);
      
      return {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total
      };
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  }
  
  // Update transaction
  async updateTransaction(id, updateData) {
    try {
      return await Transaction.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).populate('customer');
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }
  
  // Add refund to transaction
  async addRefundToTransaction(id, refundData) {
    try {
      return await Transaction.findByIdAndUpdate(
        id,
        { 
          $push: { refunds: refundData },
          $set: { 
            status: refundData.items.length === 0 ? 'refunded' : 'partially_refunded'
          }
        },
        { new: true }
      ).populate('customer');
    } catch (error) {
      console.error('Error adding refund to transaction:', error);
      throw error;
    }
  }
  
  // Void transaction
  async voidTransaction(id, reason, employeeId, employeeName) {
    try {
      return await Transaction.findByIdAndUpdate(
        id,
        { 
          $set: { 
            status: 'voided',
            notes: reason ? `Voided: ${reason}` : 'Voided'
          }
        },
        { new: true }
      ).populate('customer');
    } catch (error) {
      console.error('Error voiding transaction:', error);
      throw error;
    }
  }
  
  // Get customer transactions
  async getCustomerTransactions(customerId, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const transactions = await Transaction.find({ customer: customerId })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await Transaction.countDocuments({ customer: customerId });
      
      return {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total
      };
    } catch (error) {
      console.error('Error getting customer transactions:', error);
      throw error;
    }
  }
}

export default TransactionDAO; 