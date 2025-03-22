import axios from 'axios';
import { useAuthenticatedFetch } from './appBridge';

// Base API configuration
const API_VERSION = '2023-10';
const BASE_URL = `/api/${API_VERSION}`;

// Create API client with authentication
const createApiClient = async () => {
  const authenticatedFetch = useAuthenticatedFetch();
  
  return {
    get: async (endpoint) => {
      const response = await authenticatedFetch(`${BASE_URL}${endpoint}`);
      return response.json();
    },
    post: async (endpoint, data) => {
      const response = await authenticatedFetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    }
  };
};

// Product synchronization
const syncProducts = async () => {
  try {
    const client = await createApiClient();
    const response = await client.get('/products/sync');
    return response;
  } catch (error) {
    console.error('Product synchronization failed:', error);
    throw error;
  }
};

// Customer synchronization
const syncCustomers = async () => {
  try {
    const client = await createApiClient();
    const response = await client.get('/customers/sync');
    return response;
  } catch (error) {
    console.error('Customer synchronization failed:', error);
    throw error;
  }
};

// Order synchronization
const syncOrders = async () => {
  try {
    const client = await createApiClient();
    const response = await client.get('/orders/sync');
    return response;
  } catch (error) {
    console.error('Order synchronization failed:', error);
    throw error;
  }
};

// Inventory synchronization
const syncInventory = async () => {
  try {
    const client = await createApiClient();
    const response = await client.get('/inventory/sync');
    return response;
  } catch (error) {
    console.error('Inventory synchronization failed:', error);
    throw error;
  }
};

// Full store synchronization
const syncAllData = async () => {
  try {
    await syncProducts();
    await syncCustomers();
    await syncOrders();
    await syncInventory();
    return { success: true, message: 'All data synchronized successfully' };
  } catch (error) {
    console.error('Full synchronization failed:', error);
    throw error;
  }
};

export { 
  syncProducts, 
  syncCustomers, 
  syncOrders, 
  syncInventory, 
  syncAllData 
}; 