import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './CustomerHistory.css';

const CustomerHistory = ({ customerId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch customer transaction history
  useEffect(() => {
    const fetchCustomerHistory = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        
        // Build query parameters
        let queryParams = `customerId=${customerId}`;
        if (filter !== 'all') {
          queryParams += `&type=${filter}`;
        }
        if (dateRange.startDate) {
          queryParams += `&startDate=${dateRange.startDate}`;
        }
        if (dateRange.endDate) {
          queryParams += `&endDate=${dateRange.endDate}`;
        }
        
        const response = await client.get(`/api/transactions/history?${queryParams}`);
        setTransactions(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load customer history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerHistory();
  }, [customerId, filter, dateRange]);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div>Loading customer history...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="customer-history">
      <h2>Customer Transaction History</h2>
      
      <div className="history-filters">
        <div className="filter-group">
          <label htmlFor="transactionType">Transaction Type</label>
          <select 
            id="transactionType" 
            value={filter} 
            onChange={handleFilterChange}
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="trade">Trade</option>
            <option value="consignment">Consignment</option>
          </select>
        </div>
        
        <div className="date-range">
          <div className="filter-group">
            <label htmlFor="startDate">From</label>
            <input 
              type="date" 
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To</label>
            <input 
              type="date" 
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <p>No transaction history found for this customer.</p>
      ) : (
        <div className="transaction-list">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Items</th>
                <th>Total</th>
                <th>Store Credit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td>{transaction.id}</td>
                  <td>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                  <td>{transaction.items.length}</td>
                  <td>${transaction.total.toFixed(2)}</td>
                  <td>${transaction.storeCredit ? transaction.storeCredit.toFixed(2) : '0.00'}</td>
                  <td>{transaction.status}</td>
                  <td>
                    <button className="secondary">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="history-summary">
        <h3>Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{transactions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">
              ${transactions
                .filter(t => t.type === 'sell')
                .reduce((sum, t) => sum + t.total, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Earned</span>
            <span className="stat-value">
              ${transactions
                .filter(t => t.type === 'buy')
                .reduce((sum, t) => sum + t.total, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHistory; 