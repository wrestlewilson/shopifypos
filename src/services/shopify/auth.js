import { ClientApplication } from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';
import axios from 'axios';

// Initialize authentication
const initializeAuth = () => {
  const app = new ClientApplication({
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
    host: new URL(window.location).searchParams.get('host'),
    forceRedirect: true
  });
  
  window.app = app;
  return app;
};

// Get session token for API requests
const getAuthToken = async () => {
  try {
    const app = window.app || initializeAuth();
    const sessionToken = await getSessionToken(app);
    return sessionToken;
  } catch (error) {
    console.error('Error getting session token:', error);
    throw error;
  }
};

// Create authenticated API client
const createAuthenticatedClient = async () => {
  const token = await getAuthToken();
  
  return axios.create({
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Verify authentication status
const verifyAuthentication = async () => {
  try {
    const client = await createAuthenticatedClient();
    const response = await client.get('/api/auth/verify');
    return response.data.authenticated;
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return false;
  }
};

export { initializeAuth, getAuthToken, createAuthenticatedClient, verifyAuthentication }; 