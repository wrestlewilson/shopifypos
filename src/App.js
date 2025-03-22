import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from './components/common/Header';
import { StoreProvider } from './contexts/StoreContext';
import TransactionWidget from './components/transactions/TransactionWidget';
import ReportingDashboard from './components/reports/ReportingDashboard';
import { ShopifyApp } from './services/shopify/appBridge';
import ErrorBoundary from './components/common/ErrorBoundary';
import { authService } from './services/auth/AuthService';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@components/layout/Layout';
import { PrivateRoute } from '@components/common/PrivateRoute';
import { routes } from '@constants/routes';
import { React } from 'react';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f8f9fa;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #5C6AC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  padding: 20px;
  margin: 20px;
  background-color: #fff5f5;
  border: 1px solid #ff4444;
  border-radius: 4px;
  color: #d32f2f;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;

  &:hover {
    background-color: #b71c1c;
  }
`;

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('@pages/Dashboard'));
const Reports = React.lazy(() => import('@pages/Reports'));
const Inventory = React.lazy(() => import('@pages/Inventory'));
const Sales = React.lazy(() => import('@pages/Sales'));
const Settings = React.lazy(() => import('@pages/Settings'));
const Login = React.lazy(() => import('@pages/Login'));
const NotFound = React.lazy(() => import('@pages/NotFound'));

const App = () => {
  const [authState, setAuthState] = useState(authService.getAuthState());
  const [isShopifyLoading, setIsShopifyLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe(setAuthState);

    // Initialize authentication
    authService.initialize();

    // Check if we're in a Shopify environment
    const checkShopifyEnvironment = async () => {
      try {
        // Add any Shopify-specific initialization here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
      } catch (error) {
        console.error('Error checking Shopify environment:', error);
      } finally {
        setIsShopifyLoading(false);
      }
    };

    checkShopifyEnvironment();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRetry = async () => {
    await authService.refreshAuth();
  };

  if (authState.isLoading || isShopifyLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading application...</LoadingText>
      </LoadingContainer>
    );
  }

  if (authState.error) {
    return (
      <ErrorMessage>
        <p>Authentication Error: {authState.error}</p>
        <RetryButton onClick={handleRetry}>Retry Authentication</RetryButton>
      </ErrorMessage>
    );
  }

  const appContent = (
    <ErrorBoundary>
      <StoreProvider>
        <div className="App">
          <Header />
          <div className="main-content">
            {authState.isAuthenticated ? (
              <>
                <TransactionWidget />
                <ReportingDashboard />
              </>
            ) : (
              <div className="auth-message">
                <p>Please authenticate to access the application.</p>
              </div>
            )}
          </div>
        </div>
      </StoreProvider>
    </ErrorBoundary>
  );

  // If we're in a Shopify environment, wrap with ShopifyApp
  if (window.location.search.includes('shopify')) {
    return (
      <ErrorBoundary>
        <ShopifyApp>{appContent}</ShopifyApp>
      </ErrorBoundary>
    );
  }

  // Otherwise, render directly
  return appContent;
};

const AppRouter = () => {
  return (
    <Layout>
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {/* Public routes */}
          <Route path={routes.login} element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path={routes.dashboard}
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path={routes.reports}
            element={
              <PrivateRoute>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path={routes.inventory}
            element={
              <PrivateRoute>
                <Inventory />
              </PrivateRoute>
            }
          />
          <Route
            path={routes.sales}
            element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            }
          />
          <Route
            path={routes.settings}
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          
          {/* Redirect and 404 */}
          <Route path="/" element={<Navigate to={routes.dashboard} replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </Layout>
  );
};

export default AppRouter; 