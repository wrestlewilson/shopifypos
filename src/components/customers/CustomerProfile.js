import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './CustomerProfile.css';

const CustomerProfile = ({ customerId }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/customers/${customerId}`);
        setCustomer(response.data);
        setFormData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load customer profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Save customer profile changes
  const saveCustomerProfile = async () => {
    try {
      setLoading(true);
      const client = await createAuthenticatedClient();
      const response = await client.put(`/api/customers/${customerId}`, formData);
      setCustomer(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update customer profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading customer profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!customer) return <div>No customer found</div>;

  return (
    <div className="customer-profile">
      <h2>Customer Profile</h2>
      
      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); saveCustomerProfile(); }}>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="primary">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)} className="secondary">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-details">
          <p><strong>Name:</strong> {customer.firstName} {customer.lastName}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone || 'Not provided'}</p>
          <p><strong>Address:</strong> {customer.address || 'Not provided'}</p>
          <p><strong>Customer Since:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
          <p><strong>Store Credit Balance:</strong> ${customer.storeCredit?.toFixed(2) || '0.00'}</p>
          
          <button onClick={() => setIsEditing(true)} className="secondary">Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default CustomerProfile; 