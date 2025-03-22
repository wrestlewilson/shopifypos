import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

class UXService {
  constructor() {
    this.loadingStates = new Map();
    this.formStates = new Map();
    this.toastConfig = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };
  }

  // Loading State Management
  startLoading(componentId, message = 'Loading...') {
    const loadingId = uuidv4();
    this.loadingStates.set(componentId, {
      id: loadingId,
      message,
      startTime: Date.now(),
      isActive: true
    });
    return loadingId;
  }

  stopLoading(componentId) {
    const loadingState = this.loadingStates.get(componentId);
    if (loadingState) {
      loadingState.isActive = false;
      loadingState.endTime = Date.now();
    }
  }

  isLoading(componentId) {
    const loadingState = this.loadingStates.get(componentId);
    return loadingState?.isActive || false;
  }

  getLoadingMessage(componentId) {
    const loadingState = this.loadingStates.get(componentId);
    return loadingState?.message || 'Loading...';
  }

  // Form State Management
  initializeForm(formId, initialState = {}) {
    this.formStates.set(formId, {
      values: initialState,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      lastUpdated: Date.now()
    });
  }

  updateFormField(formId, field, value) {
    const formState = this.formStates.get(formId);
    if (!formState) return;

    formState.values[field] = value;
    formState.touched[field] = true;
    formState.lastUpdated = Date.now();
  }

  setFormError(formId, field, error) {
    const formState = this.formStates.get(formId);
    if (!formState) return;

    formState.errors[field] = error;
    formState.lastUpdated = Date.now();
  }

  clearFormError(formId, field) {
    const formState = this.formStates.get(formId);
    if (!formState) return;

    delete formState.errors[field];
    formState.lastUpdated = Date.now();
  }

  setFormSubmitting(formId, isSubmitting) {
    const formState = this.formStates.get(formId);
    if (!formState) return;

    formState.isSubmitting = isSubmitting;
    formState.lastUpdated = Date.now();
  }

  setFormValid(formId, isValid) {
    const formState = this.formStates.get(formId);
    if (!formState) return;

    formState.isValid = isValid;
    formState.lastUpdated = Date.now();
  }

  getFormState(formId) {
    return this.formStates.get(formId);
  }

  resetForm(formId) {
    this.formStates.delete(formId);
  }

  // Toast Notifications
  showSuccess(message, options = {}) {
    toast.success(message, {
      ...this.toastConfig,
      ...options,
      icon: '✅'
    });
  }

  showError(message, options = {}) {
    toast.error(message, {
      ...this.toastConfig,
      ...options,
      icon: '❌'
    });
  }

  showWarning(message, options = {}) {
    toast.warning(message, {
      ...this.toastConfig,
      ...options,
      icon: '⚠️'
    });
  }

  showInfo(message, options = {}) {
    toast.info(message, {
      ...this.toastConfig,
      ...options,
      icon: 'ℹ️'
    });
  }

  // Form Validation Feedback
  showFieldError(field, message) {
    this.showError(`${field}: ${message}`);
  }

  showFieldSuccess(field, message) {
    this.showSuccess(`${field}: ${message}`);
  }

  // Edge Case Handling
  handleNetworkError(error) {
    if (!navigator.onLine) {
      this.showError('You are offline. Please check your internet connection.');
    } else {
      this.showError('Network error occurred. Please try again.');
    }
  }

  handleServerError(error) {
    this.showError('Server error occurred. Please try again later.');
  }

  handleValidationError(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      this.showFieldError(field, message);
    });
  }

  handleTimeoutError() {
    this.showError('Request timed out. Please try again.');
  }

  // User Guidance
  showTooltip(element, message, position = 'top') {
    // Implementation depends on your tooltip library
    // This is a placeholder for the actual implementation
    console.log(`Show tooltip: ${message} at ${position} for element:`, element);
  }

  showHelpText(message) {
    this.showInfo(message, { autoClose: 10000 });
  }

  showConfirmation(message, onConfirm, onCancel) {
    // Implementation depends on your confirmation dialog library
    // This is a placeholder for the actual implementation
    console.log('Show confirmation:', message);
  }

  // Form State Persistence
  saveFormState(formId, state) {
    try {
      localStorage.setItem(`form_${formId}`, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving form state:', error);
    }
  }

  loadFormState(formId) {
    try {
      const state = localStorage.getItem(`form_${formId}`);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error loading form state:', error);
      return null;
    }
  }

  clearFormState(formId) {
    try {
      localStorage.removeItem(`form_${formId}`);
    } catch (error) {
      console.error('Error clearing form state:', error);
    }
  }

  // Accessibility
  announceMessage(message, priority = 'polite') {
    // Implementation depends on your screen reader library
    // This is a placeholder for the actual implementation
    console.log(`Announce message: ${message} with priority: ${priority}`);
  }

  focusElement(element) {
    if (element) {
      element.focus();
    }
  }

  // Cleanup
  cleanup() {
    this.loadingStates.clear();
    this.formStates.clear();
  }
}

// Create singleton instance
export const uxService = new UXService();

// UX hooks
export const useLoading = (componentId) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState('');

  React.useEffect(() => {
    const checkLoading = () => {
      setIsLoading(uxService.isLoading(componentId));
      setLoadingMessage(uxService.getLoadingMessage(componentId));
    };

    checkLoading();
    const interval = setInterval(checkLoading, 100);

    return () => clearInterval(interval);
  }, [componentId]);

  return { isLoading, loadingMessage };
};

export const useForm = (formId, initialState = {}) => {
  const [formState, setFormState] = React.useState(null);

  React.useEffect(() => {
    uxService.initializeForm(formId, initialState);
    const state = uxService.getFormState(formId);
    setFormState(state);

    const interval = setInterval(() => {
      const currentState = uxService.getFormState(formId);
      if (currentState?.lastUpdated !== formState?.lastUpdated) {
        setFormState(currentState);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      uxService.resetForm(formId);
    };
  }, [formId, initialState]);

  return formState;
};

// Export UX utilities
export default {
  uxService,
  useLoading,
  useForm
}; 