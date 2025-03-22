import { ValidationError } from '../services/errorHandling';

export const validateSettings = (settings) => {
  const errors = [];

  if (typeof settings.taxRate !== 'number' || settings.taxRate < 0 || settings.taxRate > 100) {
    errors.push('Tax rate must be a number between 0 and 100');
  }

  if (typeof settings.storeCreditExpiryMonths !== 'number' || settings.storeCreditExpiryMonths < 1) {
    errors.push('Store credit expiry months must be a positive number');
  }

  if (typeof settings.notificationSettings !== 'object') {
    errors.push('Notification settings must be an object');
  } else {
    const { sendSmsUpdates, sendEmailStatements, statementFrequency } = settings.notificationSettings;
    
    if (typeof sendSmsUpdates !== 'boolean') {
      errors.push('sendSmsUpdates must be a boolean');
    }
    
    if (typeof sendEmailStatements !== 'boolean') {
      errors.push('sendEmailStatements must be a boolean');
    }
    
    if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(statementFrequency)) {
      errors.push('Invalid statement frequency');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid settings', errors);
  }

  return true;
};

export const validateTransaction = (transaction) => {
  const errors = [];

  if (!['buy', 'sell', 'trade', 'consignment'].includes(transaction.type)) {
    errors.push('Invalid transaction type');
  }

  if (!transaction.customer) {
    errors.push('Customer is required');
  }

  if (!Array.isArray(transaction.items) || transaction.items.length === 0) {
    errors.push('Transaction must have at least one item');
  }

  if (typeof transaction.subtotal !== 'number' || transaction.subtotal < 0) {
    errors.push('Invalid subtotal amount');
  }

  if (typeof transaction.tax !== 'number' || transaction.tax < 0) {
    errors.push('Invalid tax amount');
  }

  if (typeof transaction.total !== 'number' || transaction.total < 0) {
    errors.push('Invalid total amount');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid transaction', errors);
  }

  return true;
};

export const validateStoreCredit = (storeCredit) => {
  const errors = [];

  if (typeof storeCredit.balance !== 'number') {
    errors.push('Balance must be a number');
  }

  if (storeCredit.expiryDate && !(storeCredit.expiryDate instanceof Date)) {
    errors.push('Expiry date must be a valid date');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid store credit', errors);
  }

  return true;
}; 