/**
 * Security utilities for frontend
 * Prevents XSS, sanitizes inputs, and validates data
 */

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} text - The text to sanitize
 * @returns {string} Sanitized text safe for display
 */
export function sanitizeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 10 chars, 1 uppercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} Validation result with details
 */
export function validatePassword(password) {
  const checks = {
    minLength: password.length >= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return {
    isValid: Object.values(checks).every(Boolean),
    checks,
  };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Prevent CSRF by ensuring API calls have proper headers
 * @param {object} headers - Existing headers
 * @returns {object} Headers with CSRF protection
 */
export function addCSRFHeaders(headers = {}) {
  return {
    ...headers,
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  };
}

/**
 * Check if a URL is safe (same origin or trusted)
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is safe
 */
export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    const current = new URL(window.location.origin);
    // Only allow same-origin URLs
    return parsed.origin === current.origin || url.startsWith("/");
  } catch {
    return false;
  }
}

/**
 * Escape special characters in user input
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeSpecialChars(str) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}
