import React, { useState, useEffect } from 'react';
import { createAuthenticatedClient } from '../../services/shopify/auth';
import './CreditRedemptionHistory.css';

const CreditRedemptionHistory = ({ customerId }) => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch customer's credit redemption history
  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get(`/api/customers/${customerId}/credit/redemptions`);
        setRedemptions(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load redemption history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRedemptionHistory();
  }, [customerId]);

  if (loading) return <div>Loading redemption history...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="redemption-history">
      <h3>Credit Redemption History</h3>
      
      {redemptions.length === 0 ? (
        <p>No redemption history found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction</th>
              <th>Amount</th>
              <th>Location</th>
              <th>Employee</th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((redemption) => (
              <tr key={redemption.id}>
                <td>{new Date(redemption.date).toLocaleDateString()}</td>
                <td>{redemption.transactionId}</td>
                <td>${redemption.amount.toFixed(2)}</td>
                <td>{redemption.location}</td>
                <td>{redemption.employeeName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CreditRedemptionHistory; 