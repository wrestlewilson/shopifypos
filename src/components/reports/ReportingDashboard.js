import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #5C6AC4;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  margin-top: 8px;
`;

const ReportingDashboard = () => {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    averageTransactionValue: 0,
    activeCustomers: 0
  });

  useEffect(() => {
    // TODO: Implement actual data fetching
    // This is just mock data for now
    setStats({
      totalTransactions: 150,
      totalRevenue: 25000,
      averageTransactionValue: 166.67,
      activeCustomers: 45
    });
  }, []);

  return (
    <DashboardContainer>
      <h2>Reporting Dashboard</h2>
      
      <StatsGrid>
        <StatCard>
          <StatValue>${stats.totalRevenue.toLocaleString()}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.totalTransactions}</StatValue>
          <StatLabel>Total Transactions</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>${stats.averageTransactionValue.toFixed(2)}</StatValue>
          <StatLabel>Average Transaction Value</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.activeCustomers}</StatValue>
          <StatLabel>Active Customers</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* TODO: Add charts and detailed reports */}
    </DashboardContainer>
  );
};

export default ReportingDashboard; 