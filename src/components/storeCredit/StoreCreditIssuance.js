import React, { useState } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './StoreCreditIssuance.css';

// Utility function to calculate expiration date
const calculateExpirationDate = (months = 24) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

const StoreCreditIssuance = ({ customerId, onCreditIssued }) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [expiryMonths, setExpiryMonths] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionType, setTransactionType] = useState('trade');

  // Handle amount input change
  const handleAmountChange = (e) => {
    // Only allow numeric input with up to 2 decimal places
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  // Issue store credit
  const issueStoreCredit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      
      const creditData = {
        customerId,
        amount: parseFloat(amount),
        reason,
        expiryDate: calculateExpirationDate(expiryMonths),
        transactionType,
        issuedBy: 'current-user', // This would be the actual user ID in production
        storeLocation: 'main-store' // This would be the actual store location in production
      };
      
      const response = await client.post('/api/store-credit/issue', creditData);
      
      // Call the callback function with the issued credit data
      if (onCreditIssued) {
        onCreditIssued(response.data);
      }
      
      // Reset form
      setAmount('');
      setReason('');
      setError(null);
    } catch (err) {
      setError('Failed to issue store credit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-credit-issuance">
      <h2>Issue Store Credit</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={issueStoreCredit}>
        <div className="form-group">
          <label htmlFor="creditAmount">Amount</label>
          <div className="amount-input">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="creditAmount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="transactionType">Transaction Type</label>
          <select
            id="transactionType"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
          >
            <option value="trade">Trade-In</option>
            <option value="refund">Refund</option>
            <option value="promotion">Promotion</option>
            <option value="adjustment">Manual Adjustment</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="expiryMonths">Expiration Period (Months)</label>
          <select
            id="expiryMonths"
            value={expiryMonths}
            onChange={(e) => setExpiryMonths(parseInt(e.target.value))}
          >
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
            <option value="24">24 Months</option>
            <option value="36">36 Months</option>
            <option value="0">No Expiration</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="creditReason">Reason</label>
          <textarea
            id="creditReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for issuing store credit"
            rows="3"
            required
          />
        </div>
        
        <div className="credit-summary">
          <p><strong>Credit Amount:</strong> ${amount || '0.00'}</p>
          <p><strong>Expiration Date:</strong> {expiryMonths > 0 ? calculateExpirationDate(expiryMonths).toLocaleDateString() : 'Never'}</p>
        </div>
        
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Processing...' : 'Issue Store Credit'}
        </button>
      </form>
    </div>
  );
};

export { StoreCreditIssuance, calculateExpirationDate }; 