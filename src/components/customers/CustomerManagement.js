import React, { useState } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import CustomerProfile from './CustomerProfile';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

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
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new customer
  const createNewCustomer = async (customerData) => {
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      const response = await client.post('/api/customers', customerData);
      return response.data;
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-management">
      <h2>Customer Management</h2>
      
      <div className="search-section">
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
                    <td>{customer.firstName} {customer.lastName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || 'N/A'}</td>
                    <td>${customer.storeCredit?.toFixed(2) || '0.00'}</td>
                    <td>
                      <button onClick={() => setSelectedCustomer(customer.id)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {selectedCustomer && (
        <CustomerProfile customerId={selectedCustomer} />
      )}
    </div>
  );
};

export default CustomerManagement; 