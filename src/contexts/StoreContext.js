import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultSettings = {
  taxRate: 0.0,
  storeCreditExpiryMonths: 24,
  notificationSettings: {
    sendSmsUpdates: true,
    sendEmailStatements: true,
    statementFrequency: 'monthly'
  }
};

const defaultPermissions = {
  canAdjustStoreCredit: false,
  canOverrideTransactions: false,
  canAccessReports: false,
  canManageSettings: false
};

const StoreContext = createContext(undefined);

export const StoreProvider = ({ children }) => {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [userPermissions, setUserPermissions] = useState(defaultPermissions);

  // Load settings from local storage or API on mount
  useEffect(() => {
    // TODO: Implement loading settings from API or local storage
    // This would be replaced with actual API calls in the implementation
    console.log('Loading settings...');
  }, []);

  const searchCustomers = async (query) => {
    // TODO: Implement customer search via Shopify API
    console.log(`Searching for customers with query: ${query}`);
    return [];
  };

  const saveTransaction = async (transaction) => {
    // TODO: Implement transaction saving logic
    console.log('Saving transaction:', transaction);
    return true;
  };

  const getStoreCredit = async (customerId) => {
    // TODO: Implement store credit retrieval
    console.log(`Getting store credit for customer: ${customerId}`);
    return null;
  };

  const updateStoreCredit = async (storeCredit) => {
    // TODO: Implement store credit update logic
    console.log('Updating store credit:', storeCredit);
    return true;
  };

  const updateSettings = (newSettings) => {
    // TODO: Save settings to API or local storage
    setSettings(newSettings);
  };

  const syncWithShopify = async (transactionId) => {
    // TODO: Implement Shopify synchronization
    console.log(`Syncing transaction ${transactionId} with Shopify`);
    return true;
  };

  const updateUserPermissions = (newPermissions) => {
    setUserPermissions(newPermissions);
  };

  const value = {
    currentCustomer,
    setCurrentCustomer,
    searchCustomers,
    currentTransaction,
    setCurrentTransaction,
    saveTransaction,
    getStoreCredit,
    updateStoreCredit,
    settings,
    updateSettings,
    userPermissions,
    updateUserPermissions,
    syncWithShopify
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 