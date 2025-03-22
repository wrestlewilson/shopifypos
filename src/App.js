import React from 'react';
import Header from './components/common/Header';
import { StoreProvider } from './contexts/StoreContext';
import TransactionWidget from './components/transactions/TransactionWidget';
import ReportingDashboard from './components/reports/ReportingDashboard';
import './App.css';

function App() {
  return (
    <StoreProvider>
      <div className="App">
        <Header />
        <div className="main-content">
          <TransactionWidget />
          <ReportingDashboard />
        </div>
      </div>
    </StoreProvider>
  );
}

export default App; 