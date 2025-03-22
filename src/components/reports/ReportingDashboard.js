import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { uxService } from '../../services/ux';
import UXComponents from '../common/UXComponents';

const {
  LoadingIndicator,
  ErrorDisplay,
  FormField,
  SuccessDisplay,
  Tooltip,
  ConfirmationDialog
} = UXComponents;

const DashboardContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 24px;
  color: #2d3748;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  background: #5C6AC4;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4f5db3;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(92, 106, 196, 0.2);
  }

  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
`;

const ReportGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
`;

const ReportCard = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const ReportTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  color: #2d3748;
`;

const ReportValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: #5C6AC4;
`;

const ReportDescription = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
  color: #718096;
`;

const ReportingDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '',
    reportType: '',
    category: ''
  });
  const [reports, setReports] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReports([
        {
          id: 1,
          title: 'Total Sales',
          value: '$12,345',
          description: 'Total sales for the selected period'
        },
        {
          id: 2,
          title: 'Average Order Value',
          value: '$123',
          description: 'Average order value for the selected period'
        },
        {
          id: 3,
          title: 'Number of Orders',
          value: '100',
          description: 'Total number of orders for the selected period'
        }
      ]);
    } catch (err) {
      setError({
        title: 'Error Loading Reports',
        message: 'Failed to load reports. Please try again later.',
        errors: [err.message]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteReport = async (report) => {
    setSelectedReport(report);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReports(prev => prev.filter(r => r.id !== selectedReport.id));
      setSuccess({
        title: 'Success',
        message: 'Report deleted successfully'
      });
    } catch (err) {
      setError({
        title: 'Error Deleting Report',
        message: 'Failed to delete report. Please try again later.',
        errors: [err.message]
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setSelectedReport(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return <LoadingIndicator message="Loading reports..." />;
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>Reporting Dashboard</Title>
        <Tooltip content="Generate a new report">
          <ActionButton>Generate Report</ActionButton>
        </Tooltip>
      </DashboardHeader>

      {error && <ErrorDisplay {...error} />}
      {success && <SuccessDisplay {...success} />}

      <FiltersContainer>
        <FormField
          label="Date Range"
          name="dateRange"
          type="select"
          value={filters.dateRange}
          onChange={handleFilterChange}
          help="Select the date range for the report"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </FormField>

        <FormField
          label="Report Type"
          name="reportType"
          type="select"
          value={filters.reportType}
          onChange={handleFilterChange}
          help="Select the type of report"
        >
          <option value="">All Types</option>
          <option value="sales">Sales</option>
          <option value="inventory">Inventory</option>
          <option value="customer">Customer</option>
        </FormField>

        <FormField
          label="Category"
          name="category"
          type="select"
          value={filters.category}
          onChange={handleFilterChange}
          help="Select the category"
        >
          <option value="">All Categories</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="online">Online</option>
        </FormField>
      </FiltersContainer>

      <ReportGrid>
        {reports.map(report => (
          <ReportCard key={report.id}>
            <ReportTitle>{report.title}</ReportTitle>
            <ReportValue>{report.value}</ReportValue>
            <ReportDescription>{report.description}</ReportDescription>
            <Tooltip content="Delete report">
              <ActionButton
                onClick={() => handleDeleteReport(report)}
                style={{ marginTop: '8px', background: '#e53e3e' }}
              >
                Delete
              </ActionButton>
            </Tooltip>
          </ReportCard>
        ))}
      </ReportGrid>

      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Report"
        message={`Are you sure you want to delete the report "${selectedReport?.title}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </DashboardContainer>
  );
};

export default ReportingDashboard; 