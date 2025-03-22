import { createAuthenticatedClient } from '../shopify/auth';

class AuditLoggingService {
  constructor() {
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Log an audit event
  async logEvent(eventData) {
    if (!this.client) await this.initialize();
    
    try {
      // Add timestamp if not provided
      if (!eventData.timestamp) {
        eventData.timestamp = new Date().toISOString();
      }
      
      const response = await this.client.post('/api/audit/log', eventData);
      return response.data;
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Still return success to prevent blocking operations
      // but log to console for debugging
      return { success: false, error: error.message };
    }
  }
  
  // Get audit logs with filtering
  async getAuditLogs(filters = {}) {
    if (!this.client) await this.initialize();
    
    try {
      // Build query parameters
      let queryParams = '';
      if (filters.userId) queryParams += `userId=${filters.userId}&`;
      if (filters.action) queryParams += `action=${filters.action}&`;
      if (filters.resourceType) queryParams += `resourceType=${filters.resourceType}&`;
      if (filters.resourceId) queryParams += `resourceId=${filters.resourceId}&`;
      if (filters.startDate) queryParams += `startDate=${filters.startDate}&`;
      if (filters.endDate) queryParams += `endDate=${filters.endDate}&`;
      if (filters.page) queryParams += `page=${filters.page}&`;
      if (filters.pageSize) queryParams += `pageSize=${filters.pageSize}&`;
      
      // Remove trailing ampersand if exists
      if (queryParams.endsWith('&')) {
        queryParams = queryParams.slice(0, -1);
      }
      
      const url = `/api/audit/logs${queryParams ? `?${queryParams}` : ''}`;
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
  
  // Log user authentication events
  async logAuthEvent(userId, action, details = {}) {
    return this.logEvent({
      userId,
      action,
      resourceType: 'authentication',
      details
    });
  }
  
  // Log data access events
  async logDataAccess(userId, resourceType, resourceId, action, details = {}) {
    return this.logEvent({
      userId,
      action,
      resourceType,
      resourceId,
      details
    });
  }
  
  // Log system events
  async logSystemEvent(action, details = {}) {
    return this.logEvent({
      action,
      resourceType: 'system',
      details
    });
  }
}

export default AuditLoggingService; 