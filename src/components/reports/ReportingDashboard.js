import React from 'react';
import { useStore } from '../../contexts/StoreContext';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    color: #666;
  }

  input, select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
`;

const SummaryCard = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;

  h4 {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .amount {
    margin: 8px 0 0;
    font-size: 24px;
    font-weight: bold;
    color: #5C6AC4;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &.primary {
    background: #5C6AC4;
    color: white;

    &:hover {
      background: #4f5db3;
    }
  }

  &.secondary {
    background: #f4f6f8;
    color: #5C6AC4;
    border: 1px solid #5C6AC4;

    &:hover {
      background: #eef0f4;
    }
  }
`;

const ReportingDashboard = () => {
  const { settings, userPermissions } = useStore();
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [transactionType, setTransactionType] = React.useState('all');
  const [location, setLocation] = React.useState('all');
  
  // Mock report data
  const reportData = {
    storeCreditIssued: 1250.75,
    tradeCreditUsed: 875.50,
    cashPayouts: 2340.25,
    taxableTransactions: 45,
    nonTaxableTransactions: 12
  };
  
  const handleGenerateReport = () => {
    // In a real implementation, this would fetch report data based on filters
    alert('This would generate a report based on the selected filters');
  };
  
  const handleExport = (format) => {
    // In a real implementation, this would export the report in the specified format
    alert(`This would export the report in ${format} format`);
  };
  
  return (
    <DashboardContainer>
      <h2>Reporting Dashboard</h2>
      
      <div className="report-filters">
        <h3>Report Filters</h3>
        <FiltersGrid>
          <FormGroup>
            <label>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <label>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <label>Transaction Type</label>
            <select 
              value={transactionType} 
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="trade">Trade</option>
              <option value="consignment">Consignment</option>
            </select>
          </FormGroup>
          
          <FormGroup>
            <label>Location</label>
            <select 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="all">All Locations</option>
              <option value="main">Main Store</option>
              <option value="downtown">Downtown</option>
              <option value="westside">West Side</option>
            </select>
          </FormGroup>
        </FiltersGrid>
        
        <Button onClick={handleGenerateReport} className="primary">Generate Report</Button>
      </div>
      
      <SummaryGrid>
        <SummaryCard>
          <h4>Store Credit Issued</h4>
          <p className="amount">${reportData.storeCreditIssued.toFixed(2)}</p>
        </SummaryCard>
        
        <SummaryCard>
          <h4>Trade Credit Used</h4>
          <p className="amount">${reportData.tradeCreditUsed.toFixed(2)}</p>
        </SummaryCard>
        
        <SummaryCard>
          <h4>Cash Payouts</h4>
          <p className="amount">${reportData.cashPayouts.toFixed(2)}</p>
        </SummaryCard>
        
        <SummaryCard>
          <h4>Taxable Transactions</h4>
          <p className="amount">{reportData.taxableTransactions}</p>
        </SummaryCard>
        
        <SummaryCard>
          <h4>Non-Taxable Transactions</h4>
          <p className="amount">{reportData.nonTaxableTransactions}</p>
        </SummaryCard>
      </SummaryGrid>
      
      <ButtonGroup>
        <Button onClick={() => handleExport('csv')} className="secondary">Export CSV</Button>
        <Button onClick={() => handleExport('pdf')} className="secondary">Export PDF</Button>
        <Button onClick={() => handleExport('excel')} className="secondary">Export Excel</Button>
      </ButtonGroup>
    </DashboardContainer>
  );
};

export default ReportingDashboard; 