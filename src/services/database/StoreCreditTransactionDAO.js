import { StoreCreditTransaction } from '../../models/StoreCreditTransaction';

class StoreCreditTransactionDAO {
  constructor() {}
  
  // Create a new store credit transaction
  async createTransaction(transactionData) {
    try {
      const transaction = new StoreCreditTransaction(transactionData);
      await transaction.save();
      return transaction;
    } catch (error) {
      console.error('Error creating store credit transaction:', error);
      throw error;
    }
  }
  
  // Get transaction by ID
  async getTransactionById(id) {
    try {
      return await StoreCreditTransaction.findById(id);
    } catch (error) {
      console.error('Error getting store credit transaction by ID:', error);
      throw error;
    }
  }
  
  // Get transactions by customer ID
  async getTransactionsByCustomerId(customerId, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc' } = options;
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const transactions = await StoreCreditTransaction.find({ customerId })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
      const total = await StoreCreditTransaction.countDocuments({ customerId });
      
      return {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalItems: total
      };
    } catch (error) {
      console.error('Error getting store credit transactions by customer ID:', error);
      throw error;
    }
  }
  
  // Get expiring credits
  async getExpiringCredits(daysThreshold = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      return await StoreCreditTransaction.aggregate([
        {
          $match: {
            type: 'add',
            expiryDate: { $lte: thresholdDate, $gt: new Date() }
          }
        },
        {
          $lookup: {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer'
          }
        },
        {
          $unwind: '$customer'
        },
        {
          $project: {
            _id: 1,
            customerId: 1,
            amount: 1,
            expiryDate: 1,
            date: 1,
            'customer.firstName': 1,
            'customer.lastName': 1,
            'customer.email': 1
          }
        }
      ]);
    } catch (error) {
      console.error('Error getting expiring credits:', error);
      throw error;
    }
  }
  
  // Get customer's expiring credits
  async getCustomerExpiringCredits(customerId, daysThreshold = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
      
      return await StoreCreditTransaction.find({
        customerId,
        type: 'add',
        expiryDate: { $lte: thresholdDate, $gt: new Date() }
      }).sort({ expiryDate: 1 });
    } catch (error) {
      console.error('Error getting customer expiring credits:', error);
      throw error;
    }
  }
}

export default StoreCreditTransactionDAO; 