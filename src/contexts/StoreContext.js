import React, { createContext, useContext, useState } from 'react';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [settings, setSettings] = useState({
    taxRate: 0.08,
    storeCreditExpiryMonths: 24,
    notificationSettings: {
      sendSmsUpdates: true,
      sendEmailStatements: true,
      statementFrequency: 'monthly'
    }
  });
  const [userPermissions] = useState({
    canAdjustStoreCredit: true,
    canOverrideTransactions: true,
    canAccessReports: true,
    canManageSettings: true
  });

  const searchCustomers = async (query) => {
    // TODO: Implement customer search
    return [];
  };

  const saveTransaction = async (transaction) => {
    // TODO: Implement transaction saving
    return true;
  };

  const getStoreCredit = async (customerId) => {
    // TODO: Implement store credit retrieval
    return 0;
  };

  const updateStoreCredit = async (customerId, amount) => {
    // TODO: Implement store credit update
    return true;
  };

  const updateSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    return true;
  };

  const syncWithShopify = async () => {
    // TODO: Implement Shopify sync
    return true;
  };

  const value = {
    currentCustomer,
    setCurrentCustomer,
    currentTransaction,
    setCurrentTransaction,
    searchCustomers,
    saveTransaction,
    getStoreCredit,
    updateStoreCredit,
    settings,
    updateSettings,
    userPermissions,
    syncWithShopify
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}; 