import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuditLoggingService } from '../5_security_audit_logging';

// Error types
export const ErrorTypes = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  SERVER: 'server',
  CLIENT: 'client',
  UNKNOWN: 'unknown'
};

// Error Context
const ErrorContext = createContext(null);

// Error Provider Component
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const auditService = new AuditLoggingService();
  
  // Initialize audit service
  useEffect(() => {
    auditService.initialize().catch(err => {
      console.error('Failed to initialize audit service:', err);
    });
  }, []);
  
  // Add error to the errors list
  const addError = (error) => {
    const errorObj = formatError(error);
    
    // Log error to audit log
    auditService.logSystemEvent('error_occurred', {
      errorType: errorObj.type,
      errorMessage: errorObj.message,
      errorCode: errorObj.code,
      errorStack: errorObj.stack,
      errorSource: errorObj.source
    }).catch(err => {
      console.error('Failed to log error to audit log:', err);
    });
    
    // Add error to state
    setErrors(prevErrors => [...prevErrors, errorObj]);
    
    // If it's a critical error, set it as global error
    if (errorObj.critical) {
      setGlobalError(errorObj);
    }
    
    return errorObj.id;
  };
  
  // Remove error from the errors list
  const removeError = (errorId) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== errorId));
    
    // If removing the global error, clear it
    if (globalError && globalError.id === errorId) {
      setGlobalError(null);
    }
  };
  
  // Clear all errors
  const clearErrors = () => {
    setErrors([]);
    setGlobalError(null);
  };
  
  // Format error object
  const formatError = (error) => {
    // Generate unique error ID
    const errorId = `error-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Default error object
    const defaultError = {
      id: errorId,
      message: 'An unknown error occurred',
      type: ErrorTypes.UNKNOWN,
      timestamp: new Date(),
      code: 'ERR_UNKNOWN',
      source: 'client',
      critical: false,
      stack: null,
      data: null
    };
    
    // If error is a string, use it as message
    if (typeof error === 'string') {
      return {
        ...defaultError,
        message: error
      };
    }
    
    // If error is an Error object
    if (error instanceof Error) {
      return {
        ...defaultError,
        message: error.message,
        stack: error.stack,
        type: determineErrorType(error),
        code: error.code || defaultError.code
      };
    }
    
    // If error is a network error (from axios or fetch)
    if (error.isAxiosError || error.status || error.statusText) {
      const status = error.status || error.response?.status;
      const statusText = error.statusText || error.response?.statusText;
      const responseData = error.response?.data;
      
      return {
        ...defaultError,
        message: responseData?.message || `${status}: ${statusText}` || error.message || 'Network request failed',
        type: ErrorTypes.NETWORK,
        code: `HTTP_${status || 'ERROR'}`,
        critical: status >= 500,
        data: responseData
      };
    }
    
    // If error is an object with custom properties
    if (typeof error === 'object') {
      return {
        ...defaultError,
        ...error,
        id: error.id || errorId,
        timestamp: error.timestamp || defaultError.timestamp
      };
    }
    
    return defaultError;
  };
  
  // Determine error type based on error object
  const determineErrorType = (error) => {
    // Check for validation errors
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return ErrorTypes.VALIDATION;
    }
    
    // Check for authentication errors
    if (error.name === 'AuthenticationError' || 
        error.message.includes('authentication') || 
        error.message.includes('login') || 
        error.message.includes('token')) {
      return ErrorTypes.AUTHENTICATION;
    }
    
    // Check for authorization errors
    if (error.name === 'AuthorizationError' || 
        error.message.includes('authorization') || 
        error.message.includes('permission') || 
        error.message.includes('access')) {
      return ErrorTypes.AUTHORIZATION;
    }
    
    // Check for network errors
    if (error.name === 'NetworkError' || 
        error.message.includes('network') || 
        error.message.includes('connection')) {
      return ErrorTypes.NETWORK;
    }
    
    // Check for server errors
    if (error.name === 'ServerError' || 
        error.message.includes('server')) {
      return ErrorTypes.SERVER;
    }
    
    return ErrorTypes.CLIENT;
  };
  
  // Global error handler for unhandled errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      event.preventDefault();
      addError({
        message: event.error?.message || 'Unhandled error occurred',
        type: ErrorTypes.CLIENT,
        critical: true,
        stack: event.error?.stack,
        source: event.filename || 'window'
      });
    };
    
    // Handle unhandled promise rejections
    const handlePromiseRejection = (event) => {
      event.preventDefault();
      addError({
        message: event.reason?.message || 'Unhandled promise rejection',
        type: ErrorTypes.CLIENT,
        critical: true,
        stack: event.reason?.stack,
        source: 'promise'
      });
    };
    
    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);
  
  return (
    <ErrorContext.Provider value={{
      errors,
      globalError,
      addError,
      removeError,
      clearErrors
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook to use error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    
    // If error context is available, add the error
    if (this.context && this.context.addError) {
      this.context.addError({
        message: error.message,
        type: ErrorTypes.CLIENT,
        critical: true,
        stack: error.stack,
        source: 'component',
        data: errorInfo
      });
    }
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error);
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unknown error occurred'}</p>
          {this.props.showReset !== false && (
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </button>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Set context for ErrorBoundary
ErrorBoundary.contextType = ErrorContext;

// Error Alert Component
export const ErrorAlert = ({ error, onClose }) => {
  const { removeError } = useError();
  
  const handleClose = () => {
    if (onClose) {
      onClose(error.id);
    } else {
      removeError(error.id);
    }
  };
  
  // Determine alert style based on error type
  const getAlertStyle = () => {
    switch (error.type) {
      case ErrorTypes.VALIDATION:
        return 'error-alert-validation';
      case ErrorTypes.AUTHENTICATION:
      case ErrorTypes.AUTHORIZATION:
        return 'error-alert-auth';
      case ErrorTypes.NETWORK:
        return 'error-alert-network';
      case ErrorTypes.SERVER:
        return 'error-alert-server';
      default:
        return 'error-alert-default';
    }
  };
  
  return (
    <div className={`error-alert ${getAlertStyle()}`}>
      <div className="error-alert-content">
        <div className="error-alert-header">
          <h4>{error.code || 'Error'}</h4>
          <button className="error-alert-close" onClick={handleClose}>×</button>
        </div>
        <div className="error-alert-body">
          <p>{error.message}</p>
          {error.data && (
            <details>
              <summary>Details</summary>
              <pre>{JSON.stringify(error.data, null, 2)}</pre>
            </details>
          )}
        </div>
        <div className="error-alert-footer">
          <small>{new Date(error.timestamp).toLocaleString()}</small>
        </div>
      </div>
    </div>
  );
};

// Global Error Display Component
export const GlobalErrorDisplay = () => {
  const { errors, removeError, clearErrors } = useError();
  
  if (errors.length === 0) {
    return null;
  }
  
  return (
    <div className="global-error-display">
      {errors.map(error => (
        <ErrorAlert key={error.id} error={error} onClose={removeError} />
      ))}
      {errors.length > 1 && (
        <button className="clear-all-errors" onClick={clearErrors}>
          Clear All
        </button>
      )}
    </div>
  );
};

// API Error Handler
export const handleApiError = (error, defaultMessage = 'An error occurred while processing your request') => {
  // Extract error details from API response
  if (error.response && error.response.data) {
    const { message, code, details } = error.response.data;
    
    return {
      message: message || defaultMessage,
      type: determineErrorTypeFromStatus(error.response.status),
      code: code || `HTTP_${error.response.status}`,
      critical: error.response.status >= 500,
      data: details || error.response.data
    };
  }
  
  // Handle network errors
  if (error.request) {
    return {
      message: 'Network error: Unable to connect to the server',
      type: ErrorTypes.NETWORK,
      code: 'NETWORK_ERROR',
      critical: true
    };
  }
  
  // Handle other errors
  return {
    message: error.message || defaultMessage,
    type: ErrorTypes.UNKNOWN,
    code: error.code || 'UNKNOWN_ERROR',
    critical: true,
    stack: error.stack
  };
};

// Determine error type from HTTP status
const determineErrorTypeFromStatus = (status) => {
  if (status >= 400 && status < 500) {
    if (status === 401) {
      return ErrorTypes.AUTHENTICATION;
    }
    if (status === 403) {
      return ErrorTypes.AUTHORIZATION;
    }
    if (status === 422) {
      return ErrorTypes.VALIDATION;
    }
    return ErrorTypes.CLIENT;
  }
  
  if (status >= 500) {
    return ErrorTypes.SERVER;
  }
  
  return ErrorTypes.UNKNOWN;
};

// Form Validation Error Handler
export const handleFormValidationErrors = (errors, setFieldErrors) => {
  // Convert errors to field error format
  const fieldErrors = {};
  
  if (Array.isArray(errors)) {
    // Handle array of validation errors
    errors.forEach(error => {
      if (error.field) {
        fieldErrors[error.field] = error.message;
      }
    });
  } else if (typeof errors === 'object') {
    // Handle object of validation errors
    Object.keys(errors).forEach(field => {
      fieldErrors[field] = errors[field];
    });
  }
  
  // Set field errors
  setFieldErrors(fieldErrors);
  
  return fieldErrors;
};

// Try-Catch Wrapper for Async Functions
export const tryCatch = async (fn, errorHandler) => {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error);
    }
    throw error;
  }
};

// Higher-Order Component for Error Handling
export const withErrorHandling = (WrappedComponent, options = {}) => {
  return (props) => {
    const { addError } = useError();
    const [componentError, setComponentError] = useState(null);
    
    // Handle component error
    const handleComponentError = (error) => {
      const formattedError = {
        message: error.message || 'An error occurred in the component',
        type: ErrorTypes.CLIENT,
        source: WrappedComponent.name,
        ...options
      };
      
      // Add error to global context
      const errorId = addError(formattedError);
      
      // Set local component error
      setComponentError({ ...formattedError, id: errorId });
      
      // Call onError prop if provided
      if (props.onError) {
        props.onError(formattedError);
      }
    };
    
    // Clear component error
    const clearComponentError = () => {
      setComponentError(null);
    };
    
    // If component has error and no custom error UI is provided
    if (componentError && !options.customErrorUI) {
      return (
        <div className="component-error">
          <h3>Error in {WrappedComponent.name}</h3>
          <p>{componentError.message}</p>
          <button onClick={clearComponentError}>Retry</button>
        </div>
      );
    }
    
    // Render wrapped component with error handling props
    return (
      <ErrorBoundary
        onError={handleComponentError}
        fallback={options.customErrorUI}
      >
        <WrappedComponent
          {...props}
          onError={handleComponentError}
          error={componentError}
          clearError={clearComponentError}
        />
      </ErrorBoundary>
    );
  };
};

export default {
  ErrorProvider,
  useError,
  ErrorBoundary,
  ErrorAlert,
  GlobalErrorDisplay,
  handleApiError,
  handleFormValidationErrors,
  tryCatch,
  withErrorHandling,
  ErrorTypes
}; 