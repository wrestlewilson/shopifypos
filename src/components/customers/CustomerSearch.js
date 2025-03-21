import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';

const CustomerSearch = ({ onSelectCustomer }) => {
  const { searchCustomers } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // For demo purposes, create mock customers
  const mockCustomers = [
    {
      id: 'customer-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      storeCredit: 150.00,
      storeCreditExpiry: new Date('2027-01-01'),
      transactionHistory: []
    },
    {
      id: 'customer-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-987-6543',
      storeCredit: 75.50,
      storeCreditExpiry: new Date('2026-08-15'),
      transactionHistory: []
    },
    {
      id: 'customer-3',
      name: 'Robert Johnson',
      email: 'robert@example.com',
      phone: '555-456-7890',
      storeCredit: 0,
      storeCreditExpiry: new Date('2025-12-31'),
      transactionHistory: []
    }
  ];

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purposes, use mock data instead of actual API call
      // const results = await searchCustomers(searchQuery);
      
      // Filter mock customers based on search query
      const results = mockCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery)
      );
      
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('No customers found');
      }
    } catch (err) {
      setError('Error searching for customers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Customer Search</h2>
      </div>
      
      <form onSubmit={handleSearch}>
        <div className="search-input">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or phone"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && <p className="error-message">{error}</p>}
      
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Store Credit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>${customer.storeCredit.toFixed(2)}</td>
                  <td>
                    <button onClick={() => handleSelectCustomer(customer)}>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="create-customer">
        <h3>Create New Customer</h3>
        <p>If the customer is not found, you can create a new customer record.</p>
        <button className="secondary">Create New Customer</button>
      </div>
    </div>
  );
};

export default CustomerSearch; 