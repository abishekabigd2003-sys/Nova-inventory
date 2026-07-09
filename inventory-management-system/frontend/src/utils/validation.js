/**
 * Validation utility for the frontend application.
 * Contains standard regex checks for various input types.
 */

// Name: Alphabetic, spaces, dot, hyphen. No numbers or other special chars. Min 2, max 50.
export const validatePersonName = (name) => {
  if (!name || name.trim().length < 2) return 'Please enter a valid name. Minimum 2 characters.';
  if (name.trim().length > 50) return 'Name cannot exceed 50 characters.';
  const regex = /^[a-zA-Z\s.-]+$/;
  if (!regex.test(name)) return 'Please enter a valid name. (No numbers or special characters)';
  return '';
};

// Alphanumeric, spaces, basic punctuation allowed. Min 2, max 100.
export const validateEntityName = (name) => {
  if (!name || name.trim().length < 2) return 'Please enter a valid name. Minimum 2 characters.';
  if (name.trim().length > 100) return 'Name cannot exceed 100 characters.';
  const regex = /^[a-zA-Z0-9\s.,&()-]+$/;
  if (!regex.test(name)) return 'Please enter a valid name. (Invalid characters used)';
  return '';
};

// Email: Standard email pattern
export const validateEmail = (email) => {
  if (!email) return 'Please enter a valid email address.';
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return 'Please enter a valid email address.';
  return '';
};

// Phone: 10-15 digits, optional leading +. No letters/special chars.
export const validatePhone = (phone) => {
  if (!phone) return 'Please enter a valid phone number.';
  const regex = /^\+?[0-9]{7,15}$/;
  if (!regex.test(phone.replace(/[\s-]/g, ''))) return 'Please enter a valid phone number.';
  return '';
};

// Password: Min 8, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const validatePassword = (password) => {
  if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.';
  return '';
};

// Numeric: Valid positive numbers
export const validatePositiveNumber = (num, fieldName = 'Value') => {
  if (num === undefined || num === null || num === '') return `${fieldName} is required.`;
  const parsed = Number(num);
  if (isNaN(parsed) || parsed < 0) return `${fieldName} must be a positive number.`;
  return '';
};

// Numeric: Valid positive numbers (Optional)
export const validateOptionalPositiveNumber = (num, fieldName = 'Value') => {
  if (num === undefined || num === null || num === '') return ''; // Allow empty
  const parsed = Number(num);
  if (isNaN(parsed) || parsed < 0) return `${fieldName} must be a positive number.`;
  return '';
};

// Numeric: Strictly greater than zero
export const validateGreaterThanZero = (num, fieldName = 'Value') => {
  if (num === undefined || num === null || num === '') return `${fieldName} is required.`;
  const parsed = Number(num);
  if (isNaN(parsed) || parsed <= 0) return `${fieldName} must be greater than zero.`;
  return '';
};
