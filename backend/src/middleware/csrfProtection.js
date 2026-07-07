/**
 * CSRF Protection Middleware
 * Implements simple CSRF protection for stateless JWT authentication
 */

const crypto = require('crypto');

const SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'default-csrf-secret-change-in-production';

// Generate CSRF token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify CSRF token from header
function verifyToken(token, sessionToken) {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

// Middleware to generate CSRF token
const csrfTokenMiddleware = (req, res, next) => {
  const token = generateToken();
  res.cookie('_csrf', token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });
  req.csrfToken = () => token;
  next();
};

// Middleware to validate CSRF token
const csrfMiddleware = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for login and register endpoints (can't have CSRF token before auth)
  const fullPath = req.originalUrl || req.path;
  if (fullPath.includes('/auth/login') || fullPath.includes('/auth/register')) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies._csrf;

  if (!token || !cookieToken || token !== cookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  }

  next();
};

// Export the middleware
module.exports = {
  csrfMiddleware,
  csrfTokenMiddleware,
  generateToken
};
