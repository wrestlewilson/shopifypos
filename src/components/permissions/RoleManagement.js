import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionManagementService from '../../services/permissions/PermissionManagementService';
import './RoleManagement.css';

const RoleManagement = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Check if user has permission to manage roles
  const canManageRoles = hasPermission('manage_roles');
  
  // Initialize permission management service
  const permissionService = new PermissionManagementService();
  
  // Fetch roles and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await permissionService.initialize();
        
        // Fetch all roles
        const rolesData = await permissionService.getAllRoles();
        setRoles(rolesData);
        
        // Fetch all permissions
        const permissionsData = await permissionService.getAllPermissions();
        setPermissions(permissionsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching roles and permissions:', err);
        setError('Failed to load roles and permissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch permissions for selected role
  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!selectedRole) return;
      
      try {
        setLoading(true);
        const permissionsData = await permissionService.getRolePermissions(selectedRole.id);
        setRolePermissions(permissionsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching role permissions:', err);
        setError('Failed to load role permissions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRolePermissions();
  }, [selectedRole]);
  
  // Handle role selection
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    if (!canManageRoles) return;
    
    setRolePermissions(prevPermissions => {
      if (prevPermissions.includes(permissionId)) {
        return prevPermissions.filter(id => id !== permissionId);
      } else {
        return [...prevPermissions, permissionId];
      }
    });
  };
  
  // Save role permissions
  const saveRolePermissions = async () => {
    if (!selectedRole || !canManageRoles) return;
    
    try {
      setSaving(true);
      await permissionService.updateRolePermissions(selectedRole.id, rolePermissions);
      setError(null);
      alert('Role permissions updated successfully');
    } catch (err) {
      console.error('Error saving role permissions:', err);
      setError('Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };
  
  // Create new role
  const createNewRole = async () => {
    if (!newRoleName.trim() || !canManageRoles) return;
    
    try {
      setSaving(true);
      const newRole = await permissionService.createRole(newRoleName, []);
      setRoles(prevRoles => [...prevRoles, newRole]);
      setNewRoleName('');
      setError(null);
      alert('New role created successfully');
    } catch (err) {
      console.error('Error creating new role:', err);
      setError('Failed to create new role');
    } finally {
      setSaving(false);
    }
  };
  
  // Delete role
  const deleteRole = async (roleId) => {
    if (!canManageRoles) return;
    
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      await permissionService.deleteRole(roleId);
      setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));
      if (selectedRole && selectedRole.id === roleId) {
        setSelectedRole(null);
        setRolePermissions([]);
      }
      setError(null);
      alert('Role deleted successfully');
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading && roles.length === 0) return <div>Loading roles and permissions...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="role-management">
      <h2>Role Management</h2>
      
      {!canManageRoles && (
        <div className="permission-warning">
          You do not have permission to manage roles. View only mode.
        </div>
      )}
      
      <div className="role-management-container">
        <div className="roles-list">
          <h3>Roles</h3>
          
          {canManageRoles && (
            <div className="new-role-form">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="New role name"
              />
              <button 
                onClick={createNewRole} 
                disabled={!newRoleName.trim() || saving}
                className="secondary"
              >
                Create Role
              </button>
            </div>
          )}
          
          <ul>
            {roles.map(role => (
              <li 
                key={role.id} 
                className={selectedRole && selectedRole.id === role.id ? 'selected' : ''}
                onClick={() => handleRoleSelect(role)}
              >
                <span>{role.name}</span>
                {canManageRoles && role.name !== 'Administrator' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRole(role.id);
                    }}
                    className="delete-button"
                    title="Delete Role"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="permissions-list">
          <h3>Permissions for {selectedRole ? selectedRole.name : 'No Role Selected'}</h3>
          
          {selectedRole ? (
            <>
              <div className="permissions-grid">
                {permissions.map(permission => (
                  <div key={permission.id} className="permission-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={rolePermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        disabled={!canManageRoles || selectedRole.name === 'Administrator'}
                      />
                      {permission.name}
                    </label>
                    <p className="permission-description">{permission.description}</p>
                  </div>
                ))}
              </div>
              
              {canManageRoles && selectedRole.name !== 'Administrator' && (
                <div className="save-permissions">
                  <button 
                    onClick={saveRolePermissions} 
                    disabled={saving}
                    className="primary"
                  >
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>Select a role to view and edit its permissions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement; 