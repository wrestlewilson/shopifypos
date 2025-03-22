import React from 'react';
import styled from 'styled-components';
import { uxService } from '../../services/ux';

// Loading Components
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #5C6AC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.div`
  margin-top: 16px;
  color: #666;
  font-size: 14px;
`;

export const LoadingIndicator = ({ message = 'Loading...' }) => (
  <LoadingOverlay>
    <LoadingSpinner />
    <LoadingMessage>{message}</LoadingMessage>
  </LoadingOverlay>
);

// Error Components
const ErrorContainer = styled.div`
  padding: 16px;
  margin: 16px 0;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 4px;
  color: #c53030;
`;

const ErrorTitle = styled.h4`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
`;

const ErrorMessage = styled.p`
  margin: 0;
  font-size: 14px;
`;

const ErrorList = styled.ul`
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 14px;
`;

export const ErrorDisplay = ({ title, message, errors = [] }) => (
  <ErrorContainer role="alert">
    {title && <ErrorTitle>{title}</ErrorTitle>}
    {message && <ErrorMessage>{message}</ErrorMessage>}
    {errors.length > 0 && (
      <ErrorList>
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ErrorList>
    )}
  </ErrorContainer>
);

// Form Feedback Components
const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #4a5568;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${props => props.hasError ? '#e53e3e' : '#e2e8f0'};
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #5C6AC4;
    box-shadow: 0 0 0 2px rgba(92, 106, 196, 0.2);
  }

  &:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #e53e3e;
`;

const SuccessText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #38a169;
`;

const HelpText = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #718096;
`;

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  success,
  help,
  disabled = false,
  required = false,
  ...props
}) => (
  <FormGroup>
    <Label htmlFor={name}>
      {label}
      {required && <span style={{ color: '#e53e3e' }}> *</span>}
    </Label>
    <Input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      hasError={!!error}
      {...props}
    />
    {error && <ErrorText>{error}</ErrorText>}
    {success && <SuccessText>{success}</SuccessText>}
    {help && <HelpText>{help}</HelpText>}
  </FormGroup>
);

// Success Message Component
const SuccessContainer = styled.div`
  padding: 16px;
  margin: 16px 0;
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 4px;
  color: #2f855a;
`;

const SuccessTitle = styled.h4`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
`;

const SuccessMessage = styled.p`
  margin: 0;
  font-size: 14px;
`;

export const SuccessDisplay = ({ title, message }) => (
  <SuccessContainer role="status">
    {title && <SuccessTitle>{title}</SuccessTitle>}
    {message && <SuccessMessage>{message}</SuccessMessage>}
  </SuccessContainer>
);

// Tooltip Component
const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipContent = styled.div`
  position: absolute;
  z-index: 1000;
  padding: 8px 12px;
  background: #2d3748;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;

  ${props => {
    switch (props.position) {
      case 'top':
        return `
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        `;
      case 'bottom':
        return `
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        `;
      case 'left':
        return `
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        `;
      case 'right':
        return `
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        `;
      default:
        return '';
    }
  }}

  &::before {
    content: '';
    position: absolute;
    border: 4px solid transparent;
    ${props => {
      switch (props.position) {
        case 'top':
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-top-color: #2d3748;
          `;
        case 'bottom':
          return `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-bottom-color: #2d3748;
          `;
        case 'left':
          return `
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-left-color: #2d3748;
          `;
        case 'right':
          return `
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-right-color: #2d3748;
          `;
        default:
          return '';
      }
    }}
  }
`;

export const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <TooltipContainer
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <TooltipContent position={position}>
          {content}
        </TooltipContent>
      )}
    </TooltipContainer>
  );
};

// Confirmation Dialog Component
const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DialogTitle = styled.h3`
  margin: 0 0 16px;
  font-size: 18px;
  color: #2d3748;
`;

const DialogMessage = styled.p`
  margin: 0 0 24px;
  font-size: 14px;
  color: #4a5568;
`;

const DialogButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(92, 106, 196, 0.2);
  }

  &.primary {
    background: #5C6AC4;
    color: white;
    border: none;

    &:hover {
      background: #4f5db3;
    }
  }

  &.secondary {
    background: white;
    color: #4a5568;
    border: 1px solid #e2e8f0;

    &:hover {
      background: #f7fafc;
    }
  }
`;

export const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <DialogOverlay>
      <DialogContent role="dialog" aria-labelledby="dialog-title">
        <DialogTitle id="dialog-title">{title}</DialogTitle>
        <DialogMessage>{message}</DialogMessage>
        <DialogButtons>
          <Button className="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button className="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogButtons>
      </DialogContent>
    </DialogOverlay>
  );
};

// Export all components
export default {
  LoadingIndicator,
  ErrorDisplay,
  FormField,
  SuccessDisplay,
  Tooltip,
  ConfirmationDialog
}; 