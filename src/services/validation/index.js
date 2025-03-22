import { ValidationError } from '../errorHandling';

// Validation rules
export const ValidationRules = {
  required: (value, message) => {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(message || 'This field is required');
    }
    return true;
  },

  email: (value, message) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(message || 'Please enter a valid email address');
    }
    return true;
  },

  minLength: (value, min, message) => {
    if (value.length < min) {
      throw new ValidationError(
        message || `This field must be at least ${min} characters long`
      );
    }
    return true;
  },

  maxLength: (value, max, message) => {
    if (value.length > max) {
      throw new ValidationError(
        message || `This field must not exceed ${max} characters`
      );
    }
    return true;
  },

  numeric: (value, message) => {
    if (isNaN(value) || value === '') {
      throw new ValidationError(message || 'Please enter a valid number');
    }
    return true;
  },

  min: (value, min, message) => {
    if (Number(value) < min) {
      throw new ValidationError(
        message || `Value must be greater than or equal to ${min}`
      );
    }
    return true;
  },

  max: (value, max, message) => {
    if (Number(value) > max) {
      throw new ValidationError(
        message || `Value must be less than or equal to ${max}`
      );
    }
    return true;
  },

  date: (value, message) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(message || 'Please enter a valid date');
    }
    return true;
  },

  dateRange: (startDate, endDate, message) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      throw new ValidationError(
        message || 'Start date must be before end date'
      );
    }
    return true;
  },

  phone: (value, message) => {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(value)) {
      throw new ValidationError(
        message || 'Please enter a valid phone number'
      );
    }
    return true;
  },

  url: (value, message) => {
    try {
      new URL(value);
      return true;
    } catch {
      throw new ValidationError(message || 'Please enter a valid URL');
    }
  },

  password: (value, message) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(value)) {
      throw new ValidationError(
        message || 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
    return true;
  },

  match: (value, target, message) => {
    if (value !== target) {
      throw new ValidationError(message || 'Values do not match');
    }
    return true;
  },

  custom: (value, validator, message) => {
    if (!validator(value)) {
      throw new ValidationError(message || 'Invalid value');
    }
    return true;
  }
};

// Form validation service
class ValidationService {
  constructor() {
    this.validationRules = new Map();
  }

  // Add validation rule
  addRule(field, rules) {
    this.validationRules.set(field, rules);
  }

  // Remove validation rule
  removeRule(field) {
    this.validationRules.delete(field);
  }

  // Validate single field
  validateField(field, value) {
    const rules = this.validationRules.get(field);
    if (!rules) return true;

    const errors = [];
    for (const rule of rules) {
      try {
        if (typeof rule === 'function') {
          rule(value);
        } else if (typeof rule === 'object') {
          const { validator, message } = rule;
          validator(value, message);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);
        } else {
          throw error;
        }
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }

    return true;
  }

  // Validate form
  validateForm(formData) {
    const errors = new Map();

    for (const [field, value] of Object.entries(formData)) {
      try {
        this.validateField(field, value);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.set(field, error.message);
        } else {
          throw error;
        }
      }
    }

    return {
      isValid: errors.size === 0,
      errors
    };
  }

  // Create validation schema
  createSchema(schema) {
    return (formData) => {
      const errors = new Map();

      for (const [field, rules] of Object.entries(schema)) {
        try {
          if (Array.isArray(rules)) {
            for (const rule of rules) {
              if (typeof rule === 'function') {
                rule(formData[field]);
              } else if (typeof rule === 'object') {
                const { validator, message } = rule;
                validator(formData[field], message);
              }
            }
          } else if (typeof rules === 'function') {
            rules(formData[field]);
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            errors.set(field, error.message);
          } else {
            throw error;
          }
        }
      }

      return {
        isValid: errors.size === 0,
        errors
      };
    };
  }

  // Clear validation rules
  clearRules() {
    this.validationRules.clear();
  }
}

// Create singleton instance
export const validationService = new ValidationService();

// Export validation hook
export const useValidation = () => {
  return {
    validateField: validationService.validateField.bind(validationService),
    validateForm: validationService.validateForm.bind(validationService),
    createSchema: validationService.createSchema.bind(validationService),
    addRule: validationService.addRule.bind(validationService),
    removeRule: validationService.removeRule.bind(validationService),
    clearRules: validationService.clearRules.bind(validationService)
  };
}; 