import { createAuthenticatedClient } from '../shopify/auth';

class PermissionManagementService {
  constructor() {
    this.client = null;
  }
  
  // Initialize the authenticated client
  async initialize() {
    this.client = await createAuthenticatedClient();
  }
  
  // Get all available permissions
  async getAllPermissions() {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get('/api/permissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw error;
    }
  }
  
  // Get all available roles
  async getAllRoles() {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get('/api/roles');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
  
  // Get permissions for a specific role
  async getRolePermissions(roleId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(`/api/roles/${roleId}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  }
  
  // Update permissions for a role
  async updateRolePermissions(roleId, permissions) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.put(`/api/roles/${roleId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  }
  
  // Create a new role
  async createRole(roleName, permissions) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.post('/api/roles', { name: roleName, permissions });
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }
  
  // Delete a role
  async deleteRole(roleId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.delete(`/api/roles/${roleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
  
  // Get all users
  async getAllUsers() {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  // Get user roles
  async getUserRoles(userId) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.get(`/api/users/${userId}/roles`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  }
  
  // Update user roles
  async updateUserRoles(userId, roles) {
    if (!this.client) await this.initialize();
    
    try {
      const response = await this.client.put(`/api/users/${userId}/roles`, { roles });
      return response.data;
    } catch (error) {
      console.error('Error updating user roles:', error);
      throw error;
    }
  }
}

export default PermissionManagementService; 