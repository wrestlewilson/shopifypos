import { createContext, useContext, useState, useCallback } from 'react';

// Loading state categories
export const LoadingCategory = {
  API: 'api',
  AUTH: 'auth',
  FORM: 'form',
  FILE: 'file',
  SYNC: 'sync',
  SYSTEM: 'system'
};

// Loading state priorities
export const LoadingPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};

const LoadingContext = createContext(undefined);

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState(new Map());
  const [globalLoading, setGlobalLoading] = useState(false);

  // Start loading state
  const startLoading = useCallback((category, priority = LoadingPriority.MEDIUM) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.set(category, {
        isLoading: true,
        priority,
        startTime: Date.now()
      });
      return newStates;
    });

    // Update global loading state based on highest priority
    setGlobalLoading(true);
  }, []);

  // Stop loading state
  const stopLoading = useCallback((category) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(category);
      return newStates;
    });

    // Update global loading state
    setGlobalLoading(loadingStates.size > 1);
  }, [loadingStates.size]);

  // Check if specific category is loading
  const isLoading = useCallback((category) => {
    return loadingStates.has(category);
  }, [loadingStates]);

  // Get loading state for specific category
  const getLoadingState = useCallback((category) => {
    return loadingStates.get(category);
  }, [loadingStates]);

  // Get all active loading states
  const getActiveLoadingStates = useCallback(() => {
    return Array.from(loadingStates.entries()).map(([category, state]) => ({
      category,
      ...state
    }));
  }, [loadingStates]);

  // Clear all loading states
  const clearLoadingStates = useCallback(() => {
    setLoadingStates(new Map());
    setGlobalLoading(false);
  }, []);

  // Wrap async operation with loading state
  const withLoading = useCallback(async (category, operation, priority = LoadingPriority.MEDIUM) => {
    try {
      startLoading(category, priority);
      return await operation();
    } finally {
      stopLoading(category);
    }
  }, [startLoading, stopLoading]);

  // Check if any high priority operations are loading
  const hasHighPriorityLoading = useCallback(() => {
    return Array.from(loadingStates.values()).some(
      state => state.priority >= LoadingPriority.HIGH
    );
  }, [loadingStates]);

  // Get loading duration for specific category
  const getLoadingDuration = useCallback((category) => {
    const state = loadingStates.get(category);
    if (!state) return 0;
    return Date.now() - state.startTime;
  }, [loadingStates]);

  // Check if loading has exceeded timeout
  const hasLoadingTimeout = useCallback((category, timeout = 30000) => {
    const duration = getLoadingDuration(category);
    return duration > timeout;
  }, [getLoadingDuration]);

  const value = {
    globalLoading,
    startLoading,
    stopLoading,
    isLoading,
    getLoadingState,
    getActiveLoadingStates,
    clearLoadingStates,
    withLoading,
    hasHighPriorityLoading,
    getLoadingDuration,
    hasLoadingTimeout
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook for using loading state
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Loading spinner component
export const LoadingSpinner = ({ size = 'medium', color = '#5C6AC4' }) => {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <svg
      width={sizes[size]}
      height={sizes[size]}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2C17.523 2 22 6.477 22 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 4"
      />
    </svg>
  );
};

// Loading overlay component
export const LoadingOverlay = ({ children, isLoading, message = 'Loading...' }) => {
  if (!isLoading) return children;

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <LoadingSpinner size="large" />
        <p style={{ marginTop: '16px', color: '#666' }}>{message}</p>
      </div>
    </div>
  );
}; 