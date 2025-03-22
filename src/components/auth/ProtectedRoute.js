import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { currentUser, loading, hasPermission, hasRole } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!currentUser) {
    // Redirect to login page
    return <LoginForm />;
  }
  
  // Check for required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required permission: {requiredPermission}</p>
      </div>
    );
  }
  
  // Check for required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>This page requires {requiredRole} role.</p>
        <p>Your roles: {currentUser.roles.join(', ')}</p>
      </div>
    );
  }
  
  return children;
};

export default ProtectedRoute; 