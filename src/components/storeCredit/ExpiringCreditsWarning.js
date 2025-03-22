import React, { useState, useEffect } from 'react';
import { StoreCreditExpirationService } from '../../services/storeCredit/expirationService';
import './ExpiringCreditsWarning.css';

const ExpiringCreditsWarning = ({ customerId }) => {
  const [expiringCredits, setExpiringCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchExpiringCredits = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const service = new StoreCreditExpirationService();
        await service.initialize();
        const credits = await service.getCustomerExpiringCredits(customerId);
        setExpiringCredits(credits);
      } catch (error) {
        console.error('Error fetching expiring credits:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpiringCredits();
  }, [customerId]);
  
  if (loading) return null;
  if (expiringCredits.length === 0) return null;
  
  return (
    <div className="expiring-credits-warning">
      <h3>⚠️ Store Credit Expiring Soon</h3>
      <p>You have store credit that will expire soon:</p>
      <ul>
        {expiringCredits.map(credit => (
          <li key={credit.id}>
            ${credit.amount.toFixed(2)} expires on {new Date(credit.expiryDate).toLocaleDateString()}
          </li>
        ))}
      </ul>
      <p>Use your credit before it expires!</p>
    </div>
  );
};

export default ExpiringCreditsWarning; 