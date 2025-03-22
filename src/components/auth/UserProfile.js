import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  
  if (!currentUser) {
    return <div>Not logged in</div>;
  }
  
  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="avatar">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={`${currentUser.firstName} ${currentUser.lastName}`} />
          ) : (
            <div className="avatar-placeholder">
              {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <h3>{currentUser.firstName} {currentUser.lastName}</h3>
          <p className="user-role">{currentUser.roles.join(', ')}</p>
          <p className="user-email">{currentUser.email}</p>
        </div>
      </div>
      
      <div className="profile-actions">
        <button onClick={() => window.location.href = '/profile/edit'} className="secondary">
          Edit Profile
        </button>
        <button onClick={logout} className="secondary">
          Logout
        </button>
      </div>
      
      <div className="user-permissions">
        <h4>Your Permissions</h4>
        <ul>
          {currentUser.permissions.map(permission => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserProfile; 