/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

const validator = require('validator');

/**
 * Sanitize string input
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters (basic XSS prevention)
  // Note: For full XSS protection, use DOMPurify on frontend and proper escaping on backend
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers like onclick=
  
  return sanitized;
}

/**
 * Sanitize email
 */
function sanitizeEmail(input) {
  if (typeof input !== 'string') return input;
  const email = input.trim().toLowerCase();
  return validator.isEmail(email) ? email : '';
}

/**
 * Sanitize phone number
 */
function sanitizePhone(input) {
  if (typeof input !== 'string') return input;
  // Keep only digits
  return input.replace(/\D/g, '');
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Different sanitization based on key name
        if (key.toLowerCase().includes('email')) {
          sanitized[key] = sanitizeEmail(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitized[key] = sanitizePhone(value);
        } else if (key.toLowerCase().includes('password')) {
          // Don't sanitize passwords - they're hashed anyway
          sanitized[key] = value;
        } else {
          sanitized[key] = sanitizeString(value);
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Middleware to sanitize specific fields (for order notes, etc.)
 */
function sanitizeUserContent(req, res, next) {
  if (req.body) {
    // Sanitize notes, comments, descriptions
    const textFields = ['notes', 'comment', 'description', 'message', 'address'];
    textFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = sanitizeString(req.body[field]);
      }
    });
  }
  
  next();
}

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  sanitizeRequestBody,
  sanitizeUserContent
};
