import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuditLoggingService from '../../services/audit/AuditLoggingService';
import './AuditLogViewer.css';

const AuditLogViewer = () => {
  const { hasPermission } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resourceType: '',
    resourceId: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Check if user has permission to view audit logs
  const canViewAuditLogs = hasPermission('view_audit_logs');
  
  // Initialize audit logging service
  const auditService = new AuditLoggingService();
  
  // Fetch audit logs
  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!canViewAuditLogs) return;
      
      try {
        setLoading(true);
        await auditService.initialize();
        
        const response = await auditService.getAuditLogs({
          ...filters,
          page: pagination.currentPage
        });
        
        setAuditLogs(response.logs);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          totalItems: response.totalItems
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditLogs();
  }, [filters, pagination.currentPage, canViewAuditLogs]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resourceType: '',
      resourceId: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 20
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  if (!canViewAuditLogs) {
    return (
      <div className="audit-log-viewer">
        <h2>Audit Logs</h2>
        <div className="permission-error">
          You do not have permission to view audit logs.
        </div>
      </div>
    );
  }
  
  if (loading && auditLogs.length === 0) return <div>Loading audit logs...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="audit-log-viewer">
      <h2>Audit Logs</h2>
      
      <div className="audit-log-filters">
        <div className="filter-grid">
          <div className="filter-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Filter by user ID"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="action">Action</label>
            <select
              id="action"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="access">Access</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="resourceType">Resource Type</label>
            <select
              id="resourceType"
              name="resourceType"
              value={filters.resourceType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="customer">Customer</option>
              <option value="transaction">Transaction</option>
              <option value="store_credit">Store Credit</option>
              <option value="inventory">Inventory</option>
              <option value="authentication">Authentication</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="resourceId">Resource ID</label>
            <input
              type="text"
              id="resourceId"
              name="resourceId"
              value={filters.resourceId}
              onChange={handleFilterChange}
              placeholder="Filter by resource ID"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          
          <div className="filter-actions">
            <button onClick={resetFilters} className="secondary">Reset Filters</button>
          </div>
        </div>
      </div>
      
      {auditLogs.length === 0 ? (
        <div className="no-results">
          <p>No audit logs found matching your criteria.</p>
        </div>
      ) : (
        <div className="audit-log-table">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource Type</th>
                <th>Resource ID</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>{formatTimestamp(log.timestamp)}</td>
                  <td>{log.userId || 'System'}</td>
                  <td>{log.action}</td>
                  <td>{log.resourceType}</td>
                  <td>{log.resourceId || 'N/A'}</td>
                  <td>
                    <button 
                      className="view-details"
                      onClick={() => alert(JSON.stringify(log.details, null, 2))}
                    >
                      View Details
                    </button>
                  </td>
                  <td>{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={pagination.currentPage === 1}
        >
          First
        </button>
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)} 
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total items)
        </span>
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)} 
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </button>
        <button 
          onClick={() => handlePageChange(pagination.totalPages)} 
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Last
        </button>
      </div>
      
      <div className="export-options">
        <button className="secondary">Export CSV</button>
        <button className="secondary">Export PDF</button>
      </div>
    </div>
  );
};

export default AuditLogViewer; 