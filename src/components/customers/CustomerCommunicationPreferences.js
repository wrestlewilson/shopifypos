import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './CustomerCommunicationPreferences.css';

const CustomerCommunicationPreferences = ({ customerId }) => {
  const [preferences, setPreferences] = useState({
    email: {
      marketing: false,
      transactional: true,
      newsletter: false
    },
    sms: {
      marketing: false,
      transactional: false,
      alerts: false
    },
    frequency: 'monthly',
    optedOut: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch customer communication preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/customers/${customerId}/communication-preferences`);
        setPreferences(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load communication preferences');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [customerId]);

  // Handle checkbox changes
  const handleCheckboxChange = (category, type) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type]
      }
    }));
    
    // Clear any success message when changes are made
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle frequency change
  const handleFrequencyChange = (e) => {
    setPreferences(prev => ({
      ...prev,
      frequency: e.target.value
    }));
    
    // Clear any success message when changes are made
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Handle opt-out toggle
  const handleOptOutToggle = () => {
    setPreferences(prev => ({
      ...prev,
      optedOut: !prev.optedOut
    }));
    
    // Clear any success message when changes are made
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Save communication preferences
  const savePreferences = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const client = await createAuthenticatedClient();
      await client.put(`/api/customers/${customerId}/communication-preferences`, preferences);
      setSuccessMessage('Communication preferences saved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to save communication preferences');
      setSuccessMessage('');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading communication preferences...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="communication-preferences">
      <h2>Communication Preferences</h2>
      
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      
      <form onSubmit={savePreferences}>
        <div className="opt-out-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={!preferences.optedOut}
              onChange={handleOptOutToggle}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {preferences.optedOut ? 'Customer has opted out of all communications' : 'Customer has opted in to communications'}
          </span>
        </div>
        
        <fieldset disabled={preferences.optedOut}>
          <legend>Email Preferences</legend>
          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.email.marketing}
                onChange={() => handleCheckboxChange('email', 'marketing')}
                disabled={preferences.optedOut}
              />
              Marketing Emails
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={preferences.email.transactional}
                onChange={() => handleCheckboxChange('email', 'transactional')}
                disabled={preferences.optedOut}
              />
              Transaction Receipts
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={preferences.email.newsletter}
                onChange={() => handleCheckboxChange('email', 'newsletter')}
                disabled={preferences.optedOut}
              />
              Newsletter
            </label>
          </div>
        </fieldset>
        
        <fieldset disabled={preferences.optedOut}>
          <legend>SMS Preferences</legend>
          <div className="preference-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.sms.marketing}
                onChange={() => handleCheckboxChange('sms', 'marketing')}
                disabled={preferences.optedOut}
              />
              Marketing Messages
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={preferences.sms.transactional}
                onChange={() => handleCheckboxChange('sms', 'transactional')}
                disabled={preferences.optedOut}
              />
              Transaction Confirmations
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={preferences.sms.alerts}
                onChange={() => handleCheckboxChange('sms', 'alerts')}
                disabled={preferences.optedOut}
              />
              Store Credit Alerts
            </label>
          </div>
        </fieldset>
        
        <div className="form-group">
          <label htmlFor="frequency">Communication Frequency</label>
          <select
            id="frequency"
            value={preferences.frequency}
            onChange={handleFrequencyChange}
            disabled={preferences.optedOut}
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="primary" disabled={saving || preferences.optedOut}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
      
      <div className="communication-history">
        <h3>Recent Communications</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Channel</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* This would be populated with actual communication history */}
            <tr>
              <td>2025-03-15</td>
              <td>Transaction</td>
              <td>Email</td>
              <td>Your Receipt for Purchase #12345</td>
              <td>Delivered</td>
            </tr>
            <tr>
              <td>2025-03-01</td>
              <td>Marketing</td>
              <td>Email</td>
              <td>March Special Offers</td>
              <td>Opened</td>
            </tr>
            <tr>
              <td>2025-02-20</td>
              <td>Alert</td>
              <td>SMS</td>
              <td>Store Credit Expiring Soon</td>
              <td>Delivered</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerCommunicationPreferences; 