import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { validateSettings, validateTransaction, validateStoreCredit } from '../utils/validation';
import { shopifySyncService } from '../services/shopify/syncService';
import { ValidationError, ShopifyError } from '../services/errorHandling';

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
  const [loading, setLoading] = useState({
    settings: false,
    customer: false,
    transaction: false,
    storeCredit: false,
    sync: false
  });
  const [error, setError] = useState(null);

  // Load settings from local storage or API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(prev => ({ ...prev, settings: true }));
        setError(null);
        
        // Try to load from localStorage first
        const savedSettings = localStorage.getItem('storeSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          validateSettings(parsedSettings);
          setSettings(parsedSettings);
        }

        // Then try to load from API
        const response = await fetch('/api/settings');
        if (response.ok) {
          const apiSettings = await response.json();
          validateSettings(apiSettings);
          setSettings(apiSettings);
          localStorage.setItem('storeSettings', JSON.stringify(apiSettings));
        }
      } catch (error) {
        setError(error instanceof ValidationError ? error : new Error('Failed to load settings'));
        console.error('Error loading settings:', error);
      } finally {
        setLoading(prev => ({ ...prev, settings: false }));
      }
    };

    loadSettings();
  }, []);

  const searchCustomers = useCallback(async (query) => {
    try {
      setLoading(prev => ({ ...prev, customer: true }));
      setError(null);

      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search customers');
      }

      const customers = await response.json();
      return customers;
    } catch (error) {
      setError(error);
      console.error('Error searching customers:', error);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, customer: false }));
    }
  }, []);

  const saveTransaction = useCallback(async (transaction) => {
    try {
      setLoading(prev => ({ ...prev, transaction: true }));
      setError(null);

      validateTransaction(transaction);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      const savedTransaction = await response.json();
      setCurrentTransaction(savedTransaction);
      return savedTransaction;
    } catch (error) {
      setError(error instanceof ValidationError ? error : new Error('Failed to save transaction'));
      console.error('Error saving transaction:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, transaction: false }));
    }
  }, []);

  const getStoreCredit = useCallback(async (customerId) => {
    try {
      setLoading(prev => ({ ...prev, storeCredit: true }));
      setError(null);

      const response = await fetch(`/api/customers/${customerId}/store-credit`);
      if (!response.ok) {
        throw new Error('Failed to get store credit');
      }

      const storeCredit = await response.json();
      validateStoreCredit(storeCredit);
      return storeCredit;
    } catch (error) {
      setError(error instanceof ValidationError ? error : new Error('Failed to get store credit'));
      console.error('Error getting store credit:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, storeCredit: false }));
    }
  }, []);

  const updateStoreCredit = useCallback(async (storeCredit) => {
    try {
      setLoading(prev => ({ ...prev, storeCredit: true }));
      setError(null);

      validateStoreCredit(storeCredit);

      const response = await fetch(`/api/customers/${storeCredit.customerId}/store-credit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeCredit),
      });

      if (!response.ok) {
        throw new Error('Failed to update store credit');
      }

      const updatedStoreCredit = await response.json();
      return updatedStoreCredit;
    } catch (error) {
      setError(error instanceof ValidationError ? error : new Error('Failed to update store credit'));
      console.error('Error updating store credit:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, storeCredit: false }));
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      setLoading(prev => ({ ...prev, settings: true }));
      setError(null);

      validateSettings(newSettings);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
      return updatedSettings;
    } catch (error) {
      setError(error instanceof ValidationError ? error : new Error('Failed to update settings'));
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, settings: false }));
    }
  }, []);

  const syncWithShopify = useCallback(async (transactionId) => {
    try {
      setLoading(prev => ({ ...prev, sync: true }));
      setError(null);

      const result = await shopifySyncService.syncTransaction(transactionId);
      return result;
    } catch (error) {
      setError(error instanceof ShopifyError ? error : new Error('Failed to sync with Shopify'));
      console.error('Error syncing with Shopify:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, sync: false }));
    }
  }, []);

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
    updateUserPermissions: setUserPermissions,
    syncWithShopify,
    loading,
    error
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