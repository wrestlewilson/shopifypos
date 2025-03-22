import React, { useState } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import { calculateExpirationDate } from './StoreCreditIssuance';
import './BulkCreditIssuance.css';

const BulkCreditIssuance = () => {
  const [customers, setCustomers] = useState([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [expiryMonths, setExpiryMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Handle amount input change
  const handleAmountChange = (e) => {
    // Only allow numeric input with up to 2 decimal places
    const value = e.target.value;
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  // Search for customers
  const searchCustomers = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      const response = await client.get(`/api/customers/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (err) {
      setError('Error searching for customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add customer to bulk list
  const addCustomer = (customer) => {
    if (!customers.some(c => c.id === customer.id)) {
      setCustomers([...customers, customer]);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  // Remove customer from bulk list
  const removeCustomer = (customerId) => {
    setCustomers(customers.filter(c => c.id !== customerId));
  };

  // Issue bulk store credit
  const issueBulkCredit = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (customers.length === 0) {
      setError('Please select at least one customer');
      return;
    }
    
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      
      const bulkCreditData = {
        customerIds: customers.map(c => c.id),
        amount: parseFloat(amount),
        reason,
        expiryDate: calculateExpirationDate(expiryMonths),
        issuedBy: 'current-user', // This would be the actual user ID in production
        storeLocation: 'main-store' // This would be the actual store location in production
      };
      
      await client.post('/api/store-credit/bulk-issue', bulkCreditData);
      
      // Reset form and show success message
      setAmount('');
      setReason('');
      setCustomers([]);
      setError(null);
      setSuccess(true);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Failed to issue bulk store credit');
      setSuccess(false);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-credit-issuance">
      <h2>Bulk Store Credit Issuance</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Store credit successfully issued to {customers.length} customers</div>}
      
      <div className="customer-search">
        <h3>Add Customers</h3>
        <form onSubmit={searchCustomers}>
          <div className="search-input">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone"
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            <ul>
              {searchResults.map(customer => (
                <li key={customer.id}>
                  <span>{customer.firstName} {customer.lastName} ({customer.email})</span>
                  <button onClick={() => addCustomer(customer)}>Add</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="selected-customers">
        <h3>Selected Customers ({customers.length})</h3>
        {customers.length === 0 ? (
          <p>No customers selected</p>
        ) : (
          <ul>
            {customers.map(customer => (
              <li key={customer.id}>
                <span>{customer.firstName} {customer.lastName} ({customer.email})</span>
                <button onClick={() => removeCustomer(customer.id)} className="remove">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <form onSubmit={issueBulkCredit}>
        <div className="form-group">
          <label htmlFor="bulkCreditAmount">Amount Per Customer</label>
          <div className="amount-input">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="bulkCreditAmount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="bulkExpiryMonths">Expiration Period (Months)</label>
          <select
            id="bulkExpiryMonths"
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
          <label htmlFor="bulkCreditReason">Reason</label>
          <textarea
            id="bulkCreditReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for issuing store credit"
            rows="3"
            required
          />
        </div>
        
        <div className="credit-summary">
          <p><strong>Total Credit Amount:</strong> ${customers.length > 0 && amount ? (parseFloat(amount) * customers.length).toFixed(2) : '0.00'}</p>
          <p><strong>Expiration Date:</strong> {expiryMonths > 0 ? calculateExpirationDate(expiryMonths).toLocaleDateString() : 'Never'}</p>
        </div>
        
        <button type="submit" className="primary" disabled={loading || customers.length === 0}>
          {loading ? 'Processing...' : 'Issue Bulk Credit'}
        </button>
      </form>
    </div>
  );
};

export default BulkCreditIssuance; 