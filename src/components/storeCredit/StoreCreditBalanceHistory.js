import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './StoreCreditBalanceHistory.css';

const StoreCreditBalanceHistory = ({ customerId }) => {
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [currentBalance, setCurrentBalance] = useState(0);

  // Fetch customer's store credit balance history
  useEffect(() => {
    const fetchBalanceHistory = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        
        // Build query parameters
        let queryParams = `customerId=${customerId}`;
        if (dateRange.startDate) {
          queryParams += `&startDate=${dateRange.startDate}`;
        }
        if (dateRange.endDate) {
          queryParams += `&endDate=${dateRange.endDate}`;
        }
        
        const response = await client.get(`/api/customers/${customerId}/credit/history?${queryParams}`);
        setBalanceHistory(response.data.history);
        setCurrentBalance(response.data.currentBalance);
        setError(null);
      } catch (err) {
        setError('Failed to load balance history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalanceHistory();
  }, [customerId, dateRange]);

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate total credits and debits
  const calculateTotals = () => {
    let totalCredits = 0;
    let totalDebits = 0;
    
    balanceHistory.forEach(entry => {
      if (entry.type === 'add' || entry.type === 'issue') {
        totalCredits += entry.amount;
      } else if (entry.type === 'use' || entry.type === 'expire') {
        totalDebits += Math.abs(entry.amount);
      }
    });
    
    return { totalCredits, totalDebits };
  };

  if (loading && balanceHistory.length === 0) return <div>Loading balance history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const { totalCredits, totalDebits } = calculateTotals();

  return (
    <div className="store-credit-balance-history">
      <h2>Store Credit Balance History</h2>
      
      <div className="balance-summary">
        <div className="current-balance">
          <h3>Current Balance</h3>
          <div className="balance-amount">${currentBalance.toFixed(2)}</div>
        </div>
        
        <div className="balance-stats">
          <div className="stat-item">
            <span className="stat-label">Total Credits</span>
            <span className="stat-value positive">+${totalCredits.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Debits</span>
            <span className="stat-value negative">-${totalDebits.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="history-filters">
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
          
          <button 
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            className="secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>
      
      {balanceHistory.length === 0 ? (
        <p>No balance history found for this customer.</p>
      ) : (
        <div className="balance-history-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {balanceHistory.map((entry) => (
                <tr key={entry.id} className={entry.type}>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{entry.description}</td>
                  <td>
                    {entry.type === 'add' || entry.type === 'issue' ? 'Credit Added' : 
                     entry.type === 'use' ? 'Credit Used' : 
                     entry.type === 'expire' ? 'Credit Expired' : 
                     entry.type === 'adjust' ? 'Manual Adjustment' : 
                     entry.type}
                  </td>
                  <td className={entry.type === 'add' || entry.type === 'issue' ? 'positive' : 'negative'}>
                    {entry.type === 'add' || entry.type === 'issue' ? '+' : '-'}${Math.abs(entry.amount).toFixed(2)}
                  </td>
                  <td>${entry.balanceAfter.toFixed(2)}</td>
                  <td>
                    {entry.referenceType === 'transaction' ? (
                      <a href={`/transactions/${entry.referenceId}`}>Transaction #{entry.referenceId}</a>
                    ) : entry.referenceType === 'adjustment' ? (
                      <span>Adjustment #{entry.referenceId}</span>
                    ) : (
                      entry.referenceId || 'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="balance-history-chart">
        <h3>Balance History Chart</h3>
        <div className="chart-placeholder">
          {/* In a real implementation, this would be a chart component */}
          <p>Chart visualization would be implemented here using a library like Chart.js or Recharts</p>
        </div>
      </div>
      
      <div className="export-options">
        <button className="secondary">Export CSV</button>
        <button className="secondary">Export PDF</button>
      </div>
    </div>
  );
};

export default StoreCreditBalanceHistory; 