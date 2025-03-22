import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './StoreCreditRedemption.css';

const StoreCreditRedemption = ({ customerId, transactionTotal, onCreditApplied }) => {
  const [creditInfo, setCreditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amountToRedeem, setAmountToRedeem] = useState('');
  const [maxRedeemable, setMaxRedeemable] = useState(0);

  // Fetch customer's store credit information
  useEffect(() => {
    const fetchCreditInfo = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/customers/${customerId}/credit`);
        setCreditInfo(response.data);
        
        // Calculate max redeemable amount (either full balance or transaction total)
        const maxAmount = Math.min(response.data.balance, transactionTotal || Infinity);
        setMaxRedeemable(maxAmount);
        
        setError(null);
      } catch (err) {
        setError('Failed to load store credit information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditInfo();
  }, [customerId, transactionTotal]);

  // Handle amount input change
  const handleAmountChange = (e) => {
    // Only allow numeric input with up to 2 decimal places
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      // Ensure amount doesn't exceed max redeemable
      if (value === '' || parseFloat(value) <= maxRedeemable) {
        setAmountToRedeem(value);
      }
    }
  };

  // Apply maximum available credit
  const applyMaxCredit = () => {
    setAmountToRedeem(maxRedeemable.toFixed(2));
  };

  // Apply store credit to transaction
  const applyCredit = async () => {
    if (!amountToRedeem || parseFloat(amountToRedeem) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amountToRedeem) > creditInfo.balance) {
      setError('Amount exceeds available credit balance');
      return;
    }
    
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      
      const redemptionData = {
        customerId,
        amount: parseFloat(amountToRedeem),
        transactionId: 'current-transaction', // This would be the actual transaction ID in production
      };
      
      const response = await client.post('/api/store-credit/redeem', redemptionData);
      
      // Update credit info with new balance
      setCreditInfo({
        ...creditInfo,
        balance: creditInfo.balance - parseFloat(amountToRedeem)
      });
      
      // Call the callback function with the redeemed amount
      if (onCreditApplied) {
        onCreditApplied(parseFloat(amountToRedeem));
      }
      
      // Reset form
      setAmountToRedeem('');
      setError(null);
    } catch (err) {
      setError('Failed to apply store credit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !creditInfo) return <div>Loading store credit information...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!creditInfo) return <div>No store credit information found</div>;
  
  // If customer has no credit balance, show appropriate message
  if (creditInfo.balance <= 0) {
    return (
      <div className="store-credit-redemption">
        <h3>Store Credit</h3>
        <p>This customer has no available store credit balance.</p>
      </div>
    );
  }

  return (
    <div className="store-credit-redemption">
      <h3>Apply Store Credit</h3>
      
      <div className="credit-balance-info">
        <p><strong>Available Balance:</strong> ${creditInfo.balance.toFixed(2)}</p>
        <p><strong>Expiration Date:</strong> {creditInfo.expiryDate ? new Date(creditInfo.expiryDate).toLocaleDateString() : 'No expiration'}</p>
      </div>
      
      <div className="redemption-form">
        <div className="form-group">
          <label htmlFor="redemptionAmount">Amount to Apply</label>
          <div className="amount-input">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="redemptionAmount"
              value={amountToRedeem}
              onChange={handleAmountChange}
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div className="redemption-actions">
          <button 
            type="button" 
            className="secondary" 
            onClick={applyMaxCredit}
            disabled={maxRedeemable <= 0}
          >
            Apply Maximum (${maxRedeemable.toFixed(2)})
          </button>
          
          <button 
            type="button" 
            className="primary" 
            onClick={applyCredit}
            disabled={!amountToRedeem || parseFloat(amountToRedeem) <= 0 || loading}
          >
            {loading ? 'Processing...' : 'Apply Credit'}
          </button>
        </div>
      </div>
      
      {transactionTotal > 0 && (
        <div className="transaction-summary">
          <p><strong>Transaction Total:</strong> ${transactionTotal.toFixed(2)}</p>
          <p><strong>Credit Applied:</strong> ${amountToRedeem ? parseFloat(amountToRedeem).toFixed(2) : '0.00'}</p>
          <p><strong>Remaining Balance:</strong> ${(transactionTotal - (amountToRedeem ? parseFloat(amountToRedeem) : 0)).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default StoreCreditRedemption; 