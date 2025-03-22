import CryptoJS from 'crypto-js';
import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';

// Security configuration
const SECURITY_CONFIG = {
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  rateLimitWindow: 60 * 1000, // 1 minute
  maxRequestsPerWindow: 100,
  encryptionKey: process.env.REACT_APP_ENCRYPTION_KEY || 'your-secure-encryption-key'
};

// Security service
class SecurityService {
  constructor(config = SECURITY_CONFIG) {
    this.config = config;
    this.loginAttempts = new Map();
    this.rateLimits = new Map();
    this.sessions = new Map();
  }

  // Input sanitization
  sanitizeInput(input, type = 'text') {
    if (typeof input !== 'string') return input;

    switch (type) {
      case 'html':
        return DOMPurify.sanitize(input);
      case 'url':
        return DOMPurify.sanitize(input, { ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i });
      case 'email':
        return DOMPurify.sanitize(input, { ALLOWED_URI_REGEXP: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ });
      default:
        return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    }
  }

  // Token management
  generateTokens(userId) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    
    this.sessions.set(userId, {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + this.config.tokenExpiry,
      refreshExpiresAt: Date.now() + this.config.refreshTokenExpiry
    });

    return { accessToken, refreshToken };
  }

  generateAccessToken(userId) {
    const payload = {
      userId,
      exp: Math.floor(Date.now() / 1000) + (this.config.tokenExpiry / 1000),
      iat: Math.floor(Date.now() / 1000)
    };
    return this.encrypt(JSON.stringify(payload));
  }

  generateRefreshToken(userId) {
    const payload = {
      userId,
      exp: Math.floor(Date.now() / 1000) + (this.config.refreshTokenExpiry / 1000),
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4()
    };
    return this.encrypt(JSON.stringify(payload));
  }

  validateToken(token) {
    try {
      const decrypted = this.decrypt(token);
      const payload = JSON.parse(decrypted);
      
      if (payload.exp * 1000 < Date.now()) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Session management
  createSession(userId, userData) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      userData,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expiresAt: Date.now() + this.config.tokenExpiry
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastActivity = Date.now();
    return session;
  }

  invalidateSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  // Rate limiting
  checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;
    
    const requests = this.rateLimits.get(identifier) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.config.maxRequestsPerWindow) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimits.set(identifier, recentRequests);
    return true;
  }

  // Login attempt tracking
  trackLoginAttempt(identifier, success) {
    if (success) {
      this.loginAttempts.delete(identifier);
      return true;
    }

    const attempts = this.loginAttempts.get(identifier) || {
      count: 0,
      lastAttempt: Date.now()
    };

    attempts.count++;
    attempts.lastAttempt = Date.now();

    if (attempts.count >= this.config.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + this.config.lockoutDuration;
    }

    this.loginAttempts.set(identifier, attempts);

    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      return false;
    }

    return true;
  }

  // Data encryption
  encrypt(data) {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.config.encryptionKey
    ).toString();
  }

  decrypt(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.config.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // CSRF protection
  generateCSRFToken() {
    const token = uuidv4();
    return this.encrypt(token);
  }

  validateCSRFToken(token, storedToken) {
    try {
      const decryptedToken = this.decrypt(token);
      const decryptedStoredToken = this.decrypt(storedToken);
      return decryptedToken === decryptedStoredToken;
    } catch (error) {
      return false;
    }
  }

  // Sensitive data handling
  maskSensitiveData(data, fields) {
    const masked = { ...data };
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '********';
      }
    });
    return masked;
  }

  // Cleanup expired sessions and rate limits
  cleanup() {
    const now = Date.now();

    // Cleanup sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }

    // Cleanup rate limits
    for (const [identifier, requests] of this.rateLimits.entries()) {
      const windowStart = now - this.config.rateLimitWindow;
      const recentRequests = requests.filter(time => time > windowStart);
      
      if (recentRequests.length === 0) {
        this.rateLimits.delete(identifier);
      } else {
        this.rateLimits.set(identifier, recentRequests);
      }
    }

    // Cleanup login attempts
    for (const [identifier, attempts] of this.loginAttempts.entries()) {
      if (attempts.lockedUntil && attempts.lockedUntil < now) {
        this.loginAttempts.delete(identifier);
      }
    }
  }
}

// Create singleton instance
export const securityService = new SecurityService();

// Security hooks
export const useSecurity = () => {
  const [session, setSession] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      const currentSession = securityService.getSession(sessionId);
      if (currentSession) {
        setSession(currentSession);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('sessionId');
      }
    }
  }, []);

  const login = React.useCallback(async (credentials) => {
    const sanitizedCredentials = {
      username: securityService.sanitizeInput(credentials.username, 'email'),
      password: credentials.password // Password should be hashed before reaching this point
    };

    if (!securityService.trackLoginAttempt(sanitizedCredentials.username, false)) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    try {
      // Your authentication logic here
      const userData = await authenticateUser(sanitizedCredentials);
      const sessionId = securityService.createSession(userData.id, userData);
      localStorage.setItem('sessionId', sessionId);
      setSession(securityService.getSession(sessionId));
      setIsAuthenticated(true);
      securityService.trackLoginAttempt(sanitizedCredentials.username, true);
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = React.useCallback(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      securityService.invalidateSession(sessionId);
      localStorage.removeItem('sessionId');
      setSession(null);
      setIsAuthenticated(false);
    }
  }, []);

  return {
    session,
    isAuthenticated,
    login,
    logout,
    securityService
  };
};

// Export security utilities
export default {
  securityService,
  useSecurity
}; 