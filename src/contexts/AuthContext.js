import React, { useState, useEffect, createContext, useContext } from 'react';
import { createAuthenticatedClient } from '../services/shopify/auth';

// Create Authentication Context
const AuthContext = createContext(null);

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const client = await createAuthenticatedClient();
        const response = await client.get('/api/auth/current-user');
        
        if (response.data && response.data.user) {
          setCurrentUser(response.data.user);
        }
      } catch (err) {
        console.error('Error checking authentication status:', err);
        // Not setting error here as this is just a check
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const client = await createAuthenticatedClient(false); // No auth required for login
      const response = await client.post('/api/auth/login', {
        username,
        password
      });
      
      if (response.data && response.data.user) {
        setCurrentUser(response.data.user);
        // Store token in secure storage
        localStorage.setItem('auth_token', response.data.token);
        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Failed to login');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      const client = await createAuthenticatedClient();
      await client.post('/api/auth/logout');
      
      // Clear user and token
      setCurrentUser(null);
      localStorage.removeItem('auth_token');
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user data even if API call fails
      setCurrentUser(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
  };
  
  // Check if user has specific role
  const hasRole = (role) => {
    if (!currentUser || !currentUser.roles) return false;
    return currentUser.roles.includes(role);
  };
  
  // Provide auth context to children
  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      error,
      login,
      logout,
      hasPermission,
      hasRole,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 