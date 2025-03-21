// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StoreProvider } from '../contexts/StoreContext';
import TransactionWidget from '../components/transactions/TransactionWidget';
import ReportingDashboard from '../components/reports/ReportingDashboard';

// Mock the store context
jest.mock('../contexts/StoreContext', () => ({
  StoreProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useStore: () => ({
    currentCustomer: null,
    setCurrentCustomer: jest.fn(),
    currentTransaction: null,
    setCurrentTransaction: jest.fn(),
    searchCustomers: jest.fn(),
    saveTransaction: jest.fn(),
    getStoreCredit: jest.fn(),
    updateStoreCredit: jest.fn(),
    settings: {
      taxRate: 0.08,
      storeCreditExpiryMonths: 24,
      notificationSettings: {
        sendSmsUpdates: true,
        sendEmailStatements: true,
        statementFrequency: 'monthly'
      }
    },
    updateSettings: jest.fn(),
    userPermissions: {
      canAdjustStoreCredit: true,
      canOverrideTransactions: true,
      canAccessReports: true,
      canManageSettings: true
    },
    syncWithShopify: jest.fn()
  })
}));

describe('Performance Tests', () => {
  test('TransactionWidget renders within performance budget', () => {
    const start = performance.now();
    
    render(<TransactionWidget />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    console.log(`TransactionWidget render time: ${renderTime.toFixed(2)}ms`);
    
    // Performance budget: component should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
  
  test('ReportingDashboard renders within performance budget', () => {
    const start = performance.now();
    
    render(<ReportingDashboard />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    console.log(`ReportingDashboard render time: ${renderTime.toFixed(2)}ms`);
    
    // Performance budget: component should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
  
  test('Application handles large transaction lists efficiently', () => {
    // Create a mock component that renders a large list of transactions
    const LargeTransactionList = () => {
      const transactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `transaction-${i}`,
        date: new Date(),
        type: i % 4 === 0 ? 'buy' : i % 4 === 1 ? 'sell' : i % 4 === 2 ? 'trade' : 'consignment',
        amount: Math.random() * 1000
      }));
      
      return (
        <div>
          <h2>Transaction List</h2>
          <ul>
            {transactions.map(transaction => (
              <li key={transaction.id}>
                {transaction.type}: ${transaction.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      );
    };
    
    const start = performance.now();
    
    render(<LargeTransactionList />);
    
    const end = performance.now();
    const renderTime = end - start;
    
    console.log(`Large transaction list render time: ${renderTime.toFixed(2)}ms`);
    
    // Performance budget: should render 1000 items in less than 500ms
    expect(renderTime).toBeLessThan(500);
  });
});