import React, { useEffect, useState } from 'react';
import Header from './components/common/Header';
import { StoreProvider } from './contexts/StoreContext';
import TransactionWidget from './components/transactions/TransactionWidget';
import ReportingDashboard from './components/reports/ReportingDashboard';
import { ShopifyApp } from './services/shopify/appBridge';
import { initializeAuth, verifyAuthentication } from './services/shopify/auth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize authentication
        initializeAuth();
        
        // Verify authentication status
        const authenticated = await verifyAuthentication();
        setIsAuthenticated(authenticated);
        
        if (!authenticated) {
          console.warn('Authentication failed, running in development mode');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        // Continue in development mode
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading application...</p>
      </div>
    );
  }

  const appContent = (
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

  // If we're in a Shopify environment, wrap with ShopifyApp
  if (window.location.search.includes('shopify')) {
    return <ShopifyApp>{appContent}</ShopifyApp>;
  }

  // Otherwise, render directly
  return appContent;
}

export default App; 