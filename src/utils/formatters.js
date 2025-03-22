import { ValidationError } from '../services/errorHandling';

export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    throw new ValidationError('Amount must be a number');
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date) => {
  if (!(date instanceof Date)) {
    throw new ValidationError('Date must be a Date object');
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

export const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  if (start > end) {
    throw new ValidationError('Start date must be before end date');
  }

  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
  if (end - start > maxRange) {
    throw new ValidationError('Date range cannot exceed 1 year');
  }

  return true;
};

export const formatNumber = (number) => {
  if (typeof number !== 'number') {
    throw new ValidationError('Value must be a number');
  }

  return new Intl.NumberFormat('en-US').format(number);
};

export const formatPercentage = (value) => {
  if (typeof value !== 'number') {
    throw new ValidationError('Value must be a number');
  }

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}; 