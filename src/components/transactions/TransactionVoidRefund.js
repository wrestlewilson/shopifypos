import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './TransactionVoidRefund.css';

const TransactionVoidRefund = ({ transactionId, onComplete }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [refundType, setRefundType] = useState('store_credit');
  const [refundItems, setRefundItems] = useState([]);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [requiresManagerApproval, setRequiresManagerApproval] = useState(false);
  const [managerApproved, setManagerApproved] = useState(false);
  const [managerCode, setManagerCode] = useState('');

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/transactions/${transactionId}`);
        setTransaction(response.data);
        
        // Initialize refund items with all transaction items
        const items = response.data.items.map(item => ({
          ...item,
          refundQuantity: 0,
          maxRefundQuantity: item.quantity,
          refundAmount: 0
        }));
        setRefundItems(items);
        
        setError(null);
      } catch (err) {
        setError('Failed to load transaction data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  // Calculate total refund amount based on selected items
  useEffect(() => {
    const total = refundItems.reduce((sum, item) => {
      return sum + item.refundAmount;
    }, 0);
    setRefundAmount(total);
    
    // Check if manager approval is required
    const requiresApproval = total > 100 || refundType === 'cash' || transaction?.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    setRequiresManagerApproval(requiresApproval);
  }, [refundItems, refundType, transaction]);

  // Handle refund type change
  const handleRefundTypeChange = (e) => {
    setRefundType(e.target.value);
  };

  // Handle item quantity change
  const handleQuantityChange = (itemId, quantity) => {
    setRefundItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.min(Math.max(0, quantity), item.maxRefundQuantity);
          return {
            ...item,
            refundQuantity: newQuantity,
            refundAmount: newQuantity * item.price
          };
        }
        return item;
      });
    });
  };

  // Handle select all items
  const handleSelectAllItems = () => {
    setRefundItems(prevItems => {
      return prevItems.map(item => ({
        ...item,
        refundQuantity: item.maxRefundQuantity,
        refundAmount: item.maxRefundQuantity * item.price
      }));
    });
  };

  // Handle clear all items
  const handleClearAllItems = () => {
    setRefundItems(prevItems => {
      return prevItems.map(item => ({
        ...item,
        refundQuantity: 0,
        refundAmount: 0
      }));
    });
  };

  // Verify manager approval code
  const verifyManagerCode = async () => {
    try {
      const client = await createAuthenticatedClient();
      const response = await client.post('/api/auth/verify-manager-code', {
        code: managerCode
      });
      
      if (response.data.valid) {
        setManagerApproved(true);
        return true;
      } else {
        setError('Invalid manager approval code');
        return false;
      }
    } catch (err) {
      console.error('Error verifying manager code:', err);
      setError('Failed to verify manager code');
      return false;
    }
  };

  // Process refund
  const processRefund = async () => {
    if (refundAmount <= 0) {
      setError('Please select at least one item to refund');
      return;
    }
    
    if (refundReason.trim() === '') {
      setError('Please provide a reason for the refund');
      return;
    }
    
    if (requiresManagerApproval && !managerApproved) {
      const isApproved = await verifyManagerCode();
      if (!isApproved) return;
    }
    
    try {
      setProcessing(true);
      const client = await createAuthenticatedClient();
      
      const refundData = {
        transactionId,
        refundType,
        items: refundItems.filter(item => item.refundQuantity > 0).map(item => ({
          id: item.id,
          quantity: item.refundQuantity,
          amount: item.refundAmount
        })),
        reason: refundReason,
        totalAmount: refundAmount,
        managerApproval: requiresManagerApproval ? {
          approved: true,
          managerCode
        } : undefined
      };
      
      const response = await client.post('/api/transactions/refund', refundData);
      
      // Call the callback function with the refund data
      if (onComplete) {
        onComplete(response.data);
      }
      
      // Show success message
      alert(`Refund processed successfully. Refund ID: ${response.data.refundId}`);
    } catch (err) {
      console.error('Error processing refund:', err);
      setError('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  // Process void (cancel entire transaction)
  const processVoid = async () => {
    if (refundReason.trim() === '') {
      setError('Please provide a reason for voiding the transaction');
      return;
    }
    
    if (requiresManagerApproval && !managerApproved) {
      const isApproved = await verifyManagerCode();
      if (!isApproved) return;
    }
    
    try {
      setProcessing(true);
      const client = await createAuthenticatedClient();
      
      const voidData = {
        transactionId,
        reason: refundReason,
        managerApproval: requiresManagerApproval ? {
          approved: true,
          managerCode
        } : undefined
      };
      
      const response = await client.post('/api/transactions/void', voidData);
      
      // Call the callback function with the void data
      if (onComplete) {
        onComplete(response.data);
      }
      
      // Show success message
      alert(`Transaction voided successfully.`);
    } catch (err) {
      console.error('Error voiding transaction:', err);
      setError('Failed to void transaction');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="transaction-void-refund-loading">Loading transaction data...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!transaction) return <div className="transaction-void-refund-error">No transaction found</div>;

  // Check if transaction can be refunded/voided
  const canRefund = transaction.status === 'Completed';
  if (!canRefund) {
    return (
      <div className="transaction-void-refund">
        <h2>Refund/Void Transaction</h2>
        <div className="error-message">
          This transaction cannot be refunded or voided because its status is "{transaction.status}".
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-void-refund">
      <h2>Refund/Void Transaction #{transaction.id}</h2>
      
      <div className="transaction-summary">
        <h3>Transaction Summary</h3>
        <p><strong>Date:</strong> {new Date(transaction.date).toLocaleString()}</p>
        <p><strong>Type:</strong> {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</p>
        <p><strong>Customer:</strong> {transaction.customer ? `${transaction.customer.firstName} ${transaction.customer.lastName}` : 'Guest'}</p>
        <p><strong>Total:</strong> ${transaction.total.toFixed(2)}</p>
        <p><strong>Status:</strong> {transaction.status}</p>
      </div>
      
      <div className="refund-options">
        <h3>Refund Options</h3>
        
        <div className="refund-type">
          <label>Refund Type:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="store_credit"
                checked={refundType === 'store_credit'}
                onChange={handleRefundTypeChange}
              />
              Store Credit
            </label>
            <label>
              <input
                type="radio"
                value="original_payment"
                checked={refundType === 'original_payment'}
                onChange={handleRefundTypeChange}
              />
              Original Payment Method
            </label>
            <label>
              <input
                type="radio"
                value="cash"
                checked={refundType === 'cash'}
                onChange={handleRefundTypeChange}
              />
              Cash
            </label>
          </div>
        </div>
        
        <div className="refund-reason">
          <label htmlFor="refundReason">Reason for Refund/Void:</label>
          <textarea
            id="refundReason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Enter reason for refund or void"
            rows="3"
            required
          />
        </div>
      </div>
      
      <div className="refund-items">
        <h3>Select Items to Refund</h3>
        
        <div className="item-selection-actions">
          <button type="button" onClick={handleSelectAllItems} className="secondary">Select All</button>
          <button type="button" onClick={handleClearAllItems} className="secondary">Clear All</button>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Original Qty</th>
              <th>Refund Qty</th>
              <th>Refund Amount</th>
            </tr>
          </thead>
          <tbody>
            {refundItems.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.sku}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.maxRefundQuantity}</td>
                <td>
                  <div className="quantity-control">
                    <button 
                      type="button" 
                      onClick={() => handleQuantityChange(item.id, item.refundQuantity - 1)}
                      disabled={item.refundQuantity <= 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={item.maxRefundQuantity}
                      value={item.refundQuantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                    />
                    <button 
                      type="button" 
                      onClick={() => handleQuantityChange(item.id, item.refundQuantity + 1)}
                      disabled={item.refundQuantity >= item.maxRefundQuantity}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>${item.refundAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" className="total-label">Total Refund Amount:</td>
              <td className="total-amount">${refundAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {requiresManagerApproval && (
        <div className="manager-approval">
          <h3>Manager Approval Required</h3>
          <p>This refund requires manager approval because:</p>
          <ul>
            {refundAmount > 100 && <li>The refund amount exceeds $100</li>}
            {refundType === 'cash' && <li>Cash refunds require manager approval</li>}
            {transaction.date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) && 
              <li>The transaction is more than 30 days old</li>
            }
          </ul>
          
          <div className="manager-code">
            <label htmlFor="managerCode">Manager Approval Code:</label>
            <input
              type="password"
              id="managerCode"
              value={managerCode}
              onChange={(e) => setManagerCode(e.target.value)}
              placeholder="Enter manager code"
            />
          </div>
        </div>
      )}
      
      <div className="refund-actions">
        <button 
          type="button" 
          onClick={processRefund} 
          disabled={processing || refundAmount <= 0}
          className="primary"
        >
          {processing ? 'Processing...' : 'Process Refund'}
        </button>
        
        <button 
          type="button" 
          onClick={processVoid} 
          disabled={processing}
          className="secondary"
        >
          {processing ? 'Processing...' : 'Void Entire Transaction'}
        </button>
        
        <button 
          type="button" 
          onClick={() => onComplete && onComplete(null)}
          className="secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TransactionVoidRefund; 