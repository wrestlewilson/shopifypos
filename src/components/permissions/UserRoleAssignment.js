import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionManagementService from '../../services/permissions/PermissionManagementService';
import './UserRoleAssignment.css';

const UserRoleAssignment = () => {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Check if user has permission to manage user roles
  const canManageUserRoles = hasPermission('manage_user_roles');
  
  // Initialize permission management service
  const permissionService = new PermissionManagementService();
  
  // Fetch users and roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await permissionService.initialize();
        
        // Fetch all users
        const usersData = await permissionService.getAllUsers();
        setUsers(usersData);
        
        // Fetch all roles
        const rolesData = await permissionService.getAllRoles();
        setRoles(rolesData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching users and roles:', err);
        setError('Failed to load users and roles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch roles for selected user
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!selectedUser) return;
      
      try {
        setLoading(true);
        const rolesData = await permissionService.getUserRoles(selectedUser.id);
        setUserRoles(rolesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError('Failed to load user roles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRoles();
  }, [selectedUser]);
  
  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };
  
  // Handle role toggle
  const handleRoleToggle = (roleId) => {
    if (!canManageUserRoles) return;
    
    setUserRoles(prevRoles => {
      if (prevRoles.includes(roleId)) {
        return prevRoles.filter(id => id !== roleId);
      } else {
        return [...prevRoles, roleId];
      }
    });
  };
  
  // Save user roles
  const saveUserRoles = async () => {
    if (!selectedUser || !canManageUserRoles) return;
    
    try {
      setSaving(true);
      await permissionService.updateUserRoles(selectedUser.id, userRoles);
      setError(null);
      alert('User roles updated successfully');
    } catch (err) {
      console.error('Error saving user roles:', err);
      setError('Failed to save user roles');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading && users.length === 0) return <div>Loading users and roles...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="user-role-assignment">
      <h2>User Role Assignment</h2>
      
      {!canManageUserRoles && (
        <div className="permission-warning">
          You do not have permission to manage user roles. View only mode.
        </div>
      )}
      
      <div className="user-role-container">
        <div className="users-list">
          <h3>Users</h3>
          
          <ul>
            {users.map(user => (
              <li 
                key={user.id} 
                className={selectedUser && selectedUser.id === user.id ? 'selected' : ''}
                onClick={() => handleUserSelect(user)}
              >
                {user.firstName} {user.lastName} ({user.email})
              </li>
            ))}
          </ul>
        </div>
        
        <div className="user-roles">
          <h3>Roles for {selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'No User Selected'}</h3>
          
          {selectedUser ? (
            <>
              <div className="roles-grid">
                {roles.map(role => (
                  <div key={role.id} className="role-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        disabled={!canManageUserRoles}
                      />
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
              
              {canManageUserRoles && (
                <div className="save-roles">
                  <button 
                    onClick={saveUserRoles} 
                    disabled={saving}
                    className="primary"
                  >
                    {saving ? 'Saving...' : 'Save Roles'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>Select a user to view and edit their roles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRoleAssignment; 