import { securityService } from './index';
import { secureStorage } from './storage';
import { secureApiHandler } from './apiHandler';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.tokenRefreshTimeout = null;
  }

  // Initialize authentication
  async initialize() {
    try {
      const tokens = secureStorage.getAuthTokens();
      if (tokens) {
        await this.validateTokens(tokens);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.logout();
    }
  }

  // Login user
  async login(credentials) {
    try {
      // Sanitize credentials
      const sanitizedCredentials = {
        email: securityService.sanitizeInput(credentials.email, 'email'),
        password: credentials.password // Don't sanitize password
      };

      // Check login attempts
      if (securityService.isUserLocked(sanitizedCredentials.email)) {
        throw new Error('Account is temporarily locked. Please try again later.');
      }

      // Attempt login
      const response = await secureApiHandler.post('/auth/login', sanitizedCredentials);
      
      // Store tokens
      await this.handleLoginSuccess(response.data);
      
      // Reset login attempts
      securityService.resetLoginAttempts(sanitizedCredentials.email);
      
      return response.data;
    } catch (error) {
      // Record failed attempt
      securityService.recordLoginAttempt(credentials.email);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      // Clear tokens
      secureStorage.removeAuthTokens();
      
      // Clear session data
      secureStorage.clearSensitiveData();
      
      // Clear refresh timeout
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }
      
      // Reset state
      this.isAuthenticated = false;
      this.user = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      // Sanitize user data
      const sanitizedData = this.sanitizeUserData(userData);
      
      // Validate password strength
      if (!this.validatePasswordStrength(sanitizedData.password)) {
        throw new Error('Password does not meet security requirements');
      }
      
      // Attempt registration
      const response = await secureApiHandler.post('/auth/register', sanitizedData);
      
      // Store tokens if auto-login is enabled
      if (response.data.tokens) {
        await this.handleLoginSuccess(response.data);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Handle successful login
  async handleLoginSuccess(data) {
    try {
      // Store tokens
      await secureStorage.setAuthTokens(data.tokens);
      
      // Set user data
      this.user = data.user;
      this.isAuthenticated = true;
      
      // Setup token refresh
      this.setupTokenRefresh(data.tokens);
    } catch (error) {
      console.error('Login success handling error:', error);
      throw error;
    }
  }

  // Setup token refresh
  setupTokenRefresh(tokens) {
    try {
      // Clear existing timeout
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }
      
      // Calculate refresh time (5 minutes before expiry)
      const refreshTime = (tokens.expiresIn - 300) * 1000;
      
      // Set new timeout
      this.tokenRefreshTimeout = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    } catch (error) {
      console.error('Token refresh setup error:', error);
    }
  }

  // Refresh authentication token
  async refreshToken() {
    try {
      const tokens = secureStorage.getAuthTokens();
      if (!tokens) throw new Error('No tokens found');
      
      const response = await secureApiHandler.post('/auth/refresh', {
        refreshToken: tokens.refreshToken
      });
      
      await this.handleLoginSuccess(response.data);
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  // Validate tokens
  async validateTokens(tokens) {
    try {
      // Check token expiration
      if (this.isTokenExpired(tokens)) {
        await this.refreshToken();
        return;
      }
      
      // Validate token with server
      const response = await secureApiHandler.post('/auth/validate', {
        token: tokens.accessToken
      });
      
      // Update user data
      this.user = response.data.user;
      this.isAuthenticated = true;
      
      // Setup token refresh
      this.setupTokenRefresh(tokens);
    } catch (error) {
      console.error('Token validation error:', error);
      await this.logout();
      throw error;
    }
  }

  // Check if token is expired
  isTokenExpired(tokens) {
    return Date.now() >= tokens.expiresAt;
  }

  // Sanitize user data
  sanitizeUserData(data) {
    return {
      ...data,
      email: securityService.sanitizeInput(data.email, 'email'),
      name: securityService.sanitizeInput(data.name, 'text'),
      phone: data.phone ? securityService.sanitizeInput(data.phone, 'phone') : undefined
    };
  }

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  // Check if user has required permissions
  hasPermission(permission) {
    if (!this.user || !this.user.permissions) return false;
    return this.user.permissions.includes(permission);
  }

  // Check if user has required role
  hasRole(role) {
    if (!this.user || !this.user.roles) return false;
    return this.user.roles.includes(role);
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const sanitizedData = this.sanitizeUserData(profileData);
      const response = await secureApiHandler.put('/auth/profile', sanitizedData);
      
      // Update local user data
      this.user = {
        ...this.user,
        ...response.data
      };
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(oldPassword, newPassword) {
    try {
      // Validate new password strength
      if (!this.validatePasswordStrength(newPassword)) {
        throw new Error('New password does not meet security requirements');
      }
      
      const response = await secureApiHandler.post('/auth/change-password', {
        oldPassword,
        newPassword
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      const sanitizedEmail = securityService.sanitizeInput(email, 'email');
      const response = await secureApiHandler.post('/auth/forgot-password', {
        email: sanitizedEmail
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Validate new password strength
      if (!this.validatePasswordStrength(newPassword)) {
        throw new Error('New password does not meet security requirements');
      }
      
      const response = await secureApiHandler.post('/auth/reset-password', {
        token,
        newPassword
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export auth service
export default authService; 