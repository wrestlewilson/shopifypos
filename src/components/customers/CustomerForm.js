import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';

const CustomerForm = ({ onComplete, onCancel }) => {
  const { addCustomer } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    storeCredit: 0,
    storeCreditExpiry: new Date('2025-12-31'),
    transactionHistory: []
  });
  const [error, setError] = useState(null);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone is required');
      return;
    }

    try {
      // For demo purposes, create a mock customer ID
      const customerId = `customer-${Date.now()}`;
      
      // Create customer object
      const customer = {
        id: customerId,
        ...formData,
        storeCredit: parseFloat(formData.storeCredit) || 0,
        storeCreditExpiry: new Date(formData.storeCreditExpiry),
        transactionHistory: []
      };

      // In a real implementation, this would call the API
      // await addCustomer(customer);
      
      // For demo purposes, just log the customer
      console.log('New customer:', customer);
      
      // Complete the form
      onComplete(customer);
    } catch (err) {
      setError('Error creating customer');
      console.error(err);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Create New Customer</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="storeCredit">Initial Store Credit</label>
          <input
            type="number"
            id="storeCredit"
            name="storeCredit"
            value={formData.storeCredit}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="storeCreditExpiry">Store Credit Expiry</label>
          <input
            type="date"
            id="storeCreditExpiry"
            name="storeCreditExpiry"
            value={formData.storeCreditExpiry.toISOString().split('T')[0]}
            onChange={handleChange}
          />
        </div>
        
        <div className="button-group">
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
          <button type="submit" className="primary">
            Create Customer
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm; 