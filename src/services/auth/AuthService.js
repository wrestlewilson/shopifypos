import { initializeAuth, verifyAuthentication } from '../shopify/auth';

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.authState = {
      isAuthenticated: false,
      isLoading: true,
      error: null
    };
    this.listeners = new Set();
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.isInitialized = true;
      this.authState.isLoading = true;
      this.notifyListeners();

      // Initialize Shopify authentication
      await initializeAuth();
      
      // Verify authentication status
      const authenticated = await verifyAuthentication();
      
      this.authState = {
        isAuthenticated: authenticated,
        isLoading: false,
        error: null
      };
    } catch (error) {
      this.authState = {
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      };
      console.error('Authentication initialization failed:', error);
    } finally {
      this.notifyListeners();
    }
  }

  getAuthState() {
    return { ...this.authState };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getAuthState()));
  }

  async refreshAuth() {
    try {
      this.authState.isLoading = true;
      this.notifyListeners();

      const authenticated = await verifyAuthentication();
      
      this.authState = {
        isAuthenticated: authenticated,
        isLoading: false,
        error: null
      };
    } catch (error) {
      this.authState = {
        isAuthenticated: false,
        isLoading: false,
        error: error.message
      };
      console.error('Authentication refresh failed:', error);
    } finally {
      this.notifyListeners();
    }
  }

  clearAuth() {
    this.authState = {
      isAuthenticated: false,
      isLoading: false,
      error: null
    };
    this.notifyListeners();
  }
}

export const authService = new AuthService(); 