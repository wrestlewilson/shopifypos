import React from 'react';
import Header from './components/common/Header';
import { StoreProvider } from './contexts/StoreContext';
import TransactionWidget from './components/transactions/TransactionWidget';
import ReportingDashboard from './components/reports/ReportingDashboard';
import { ShopifyApp } from './services/shopify/appBridge';
import './App.css';

function App() {
  return (
    <ShopifyApp>
      <StoreProvider>
        <div className="App">
          <Header />
          <div className="main-content">
            <TransactionWidget />
            <ReportingDashboard />
          </div>
        </div>
      </StoreProvider>
    </ShopifyApp>
  );
}

export default App; 