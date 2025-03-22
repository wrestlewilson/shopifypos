import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './TransactionHistoryView.css';

const TransactionHistoryView = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all',
    location: 'all',
    employee: 'all',
    minAmount: '',
    maxAmount: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        
        // Build query parameters
        let queryParams = `page=${pagination.currentPage}&pageSize=${pagination.pageSize}`;
        queryParams += `&sort=${sortConfig.key}&direction=${sortConfig.direction}`;
        
        if (filters.startDate) {
          queryParams += `&startDate=${filters.startDate}`;
        }
        if (filters.endDate) {
          queryParams += `&endDate=${filters.endDate}`;
        }
        if (filters.type !== 'all') {
          queryParams += `&type=${filters.type}`;
        }
        if (filters.location !== 'all') {
          queryParams += `&location=${filters.location}`;
        }
        if (filters.employee !== 'all') {
          queryParams += `&employee=${filters.employee}`;
        }
        if (filters.minAmount) {
          queryParams += `&minAmount=${filters.minAmount}`;
        }
        if (filters.maxAmount) {
          queryParams += `&maxAmount=${filters.maxAmount}`;
        }
        if (filters.searchQuery) {
          queryParams += `&search=${encodeURIComponent(filters.searchQuery)}`;
        }
        
        const response = await client.get(`/api/transactions/history?${queryParams}`);
        setTransactions(response.data.transactions);
        setPagination({
          ...pagination,
          totalPages: response.data.totalPages
        });
        setError(null);
      } catch (err) {
        setError('Failed to load transaction history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [filters, pagination.currentPage, pagination.pageSize, sortConfig]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Handle sort changes
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: 'all',
      location: 'all',
      employee: 'all',
      minAmount: '',
      maxAmount: '',
      searchQuery: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // View transaction details
  const viewTransactionDetails = (transactionId) => {
    // In a real implementation, this would navigate to a transaction details page
    console.log(`View transaction details for ID: ${transactionId}`);
  };

  if (loading && transactions.length === 0) return <div>Loading transaction history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="transaction-history-view">
      <h2>Transaction History</h2>
      
      <div className="transaction-filters">
        <div className="search-bar">
          <input
            type="text"
            name="searchQuery"
            value={filters.searchQuery}
            onChange={handleFilterChange}
            placeholder="Search transactions..."
          />
        </div>
        
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="type">Transaction Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="trade">Trade</option>
              <option value="consignment">Consignment</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="all">All Locations</option>
              <option value="main">Main Store</option>
              <option value="downtown">Downtown</option>
              <option value="westside">West Side</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="employee">Employee</label>
            <select
              id="employee"
              name="employee"
              value={filters.employee}
              onChange={handleFilterChange}
            >
              <option value="all">All Employees</option>
              <option value="emp1">John Doe</option>
              <option value="emp2">Jane Smith</option>
              <option value="emp3">Bob Johnson</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="minAmount">Min Amount</label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="maxAmount">Max Amount</label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="filter-actions">
            <button onClick={resetFilters} className="secondary">Reset Filters</button>
          </div>
        </div>
      </div>
      
      {transactions.length === 0 ? (
        <div className="no-results">
          <p>No transactions found matching your criteria.</p>
        </div>
      ) : (
        <div className="transaction-table">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className={sortConfig.key === 'id' ? sortConfig.direction : ''}>
                  ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('date')} className={sortConfig.key === 'date' ? sortConfig.direction : ''}>
                  Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('type')} className={sortConfig.key === 'type' ? sortConfig.direction : ''}>
                  Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('customer')} className={sortConfig.key === 'customer' ? sortConfig.direction : ''}>
                  Customer {sortConfig.key === 'customer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('items')} className={sortConfig.key === 'items' ? sortConfig.direction : ''}>
                  Items {sortConfig.key === 'items' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('total')} className={sortConfig.key === 'total' ? sortConfig.direction : ''}>
                  Total {sortConfig.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('employee')} className={sortConfig.key === 'employee' ? sortConfig.direction : ''}>
                  Employee {sortConfig.key === 'employee' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('location')} className={sortConfig.key === 'location' ? sortConfig.direction : ''}>
                  Location {sortConfig.key === 'location' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} className={sortConfig.key === 'status' ? sortConfig.direction : ''}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className={transaction.status.toLowerCase()}>
                  <td>{transaction.id}</td>
                  <td>{new Date(transaction.date).toLocaleString()}</td>
                  <td>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                  <td>
                    {transaction.customer ? (
                      `${transaction.customer.firstName} ${transaction.customer.lastName}`
                    ) : 'Guest'}
                  </td>
                  <td>{transaction.items.length}</td>
                  <td>{formatCurrency(transaction.total)}</td>
                  <td>{transaction.employeeName}</td>
                  <td>{transaction.locationName}</td>
                  <td>
                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => viewTransactionDetails(transaction.id)}
                        className="action-button view"
                      >
                        View
                      </button>
                      {transaction.status === 'Completed' && (
                        <button className="action-button receipt">Receipt</button>
                      )}
                      {transaction.status === 'Completed' && (
                        <button className="action-button void">Void</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={pagination.currentPage === 1}
        >
          First
        </button>
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)} 
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)} 
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </button>
        <button 
          onClick={() => handlePageChange(pagination.totalPages)} 
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Last
        </button>
      </div>
      
      <div className="export-options">
        <button className="secondary">Export CSV</button>
        <button className="secondary">Export PDF</button>
        <button className="secondary">Print Report</button>
      </div>
    </div>
  );
};

export default TransactionHistoryView; 