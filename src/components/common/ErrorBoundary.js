import React from 'react';
import styled from 'styled-components';
import { errorHandlingService } from '../../services/errorHandling';
import { ErrorSeverity, ErrorCategory } from '../../services/errorHandling';

const ErrorContainer = styled.div`
  padding: 20px;
  margin: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ErrorTitle = styled.h2`
  color: #dc3545;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 24px;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: #5C6AC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background: #4f5db3;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(92, 106, 196, 0.2);
  }
`;

const ErrorDetails = styled.pre`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  text-align: left;
  overflow-x: auto;
  margin-top: 16px;
  font-size: 12px;
  color: #666;
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      componentStack: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error handling service
    errorHandlingService.logError(
      error,
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM
    );

    this.setState({
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      componentStack: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer role="alert">
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </ErrorMessage>
          
          {process.env.NODE_ENV === 'development' && (
            <ErrorDetails>
              {this.state.error && this.state.error.toString()}
              {this.state.componentStack}
            </ErrorDetails>
          )}
          
          <RetryButton onClick={this.handleRetry}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 