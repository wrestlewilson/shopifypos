import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuditLoggingService from '../../services/audit/AuditLoggingService';

const withAuditLogging = (WrappedComponent, options = {}) => {
  return (props) => {
    const { currentUser } = useAuth();
    const auditService = new AuditLoggingService();
    const mountTime = Date.now();
    
    // Log component mount
    React.useEffect(() => {
      if (options.logComponentAccess && currentUser) {
        auditService.logDataAccess(
          currentUser.id,
          options.resourceType || 'component',
          options.resourceId || WrappedComponent.name,
          'access',
          { componentProps: options.logProps ? props : undefined }
        );
      }
      
      return () => {
        // Log component unmount if needed
        if (options.logComponentExit && currentUser) {
          auditService.logDataAccess(
            currentUser.id,
            options.resourceType || 'component',
            options.resourceId || WrappedComponent.name,
            'exit',
            { duration: Date.now() - mountTime }
          );
        }
      };
    }, []);
    
    // Add audit logging methods to props
    const enhancedProps = {
      ...props,
      auditLog: {
        logEvent: (action, details) => {
          if (!currentUser) return;
          
          return auditService.logEvent({
            userId: currentUser.id,
            action,
            resourceType: options.resourceType || 'component',
            resourceId: options.resourceId || WrappedComponent.name,
            details
          });
        },
        logDataAccess: (resourceType, resourceId, action, details) => {
          if (!currentUser) return;
          
          return auditService.logDataAccess(
            currentUser.id,
            resourceType,
            resourceId,
            action,
            details
          );
        }
      }
    };
    
    return <WrappedComponent {...enhancedProps} />;
  };
};

export default withAuditLogging; 