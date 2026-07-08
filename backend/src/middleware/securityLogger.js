/**
 * Security Logging Middleware
 * Logs security-relevant events for monitoring and audit trails
 */

const fs = require('fs');
const path = require('path');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOG_DIR = path.join(__dirname, '../../logs');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');

// File logging is not available on Vercel serverless (read-only filesystem)
if (!isServerless && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Log security event to file and console
 */
function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...details
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  // Write to file (skip on serverless — filesystem is read-only)
  if (!isServerless) {
    fs.appendFile(SECURITY_LOG, logLine, (err) => {
      if (err) console.error('Failed to write security log:', err);
    });
  }

  if (process.env.NODE_ENV === 'production' || isServerless) {
    console.log(`[SECURITY] ${event}:`, JSON.stringify(details));
  }
}

/**
 * Middleware to log authentication attempts
 */
function logAuthAttempt(req, res, next) {
  const { email } = req.body || {};
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  
  logSecurityEvent('AUTH_ATTEMPT', {
    email,
    ip,
    userAgent,
    path: req.path,
    method: req.method
  });
  
  // Store original json to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    if (data.success === false) {
      logSecurityEvent('AUTH_FAILURE', {
        email,
        ip,
        userAgent,
        reason: data.message || 'Unknown',
        path: req.path
      });
    } else if (data.success === true) {
      logSecurityEvent('AUTH_SUCCESS', {
        email,
        ip,
        userAgent,
        userId: data.data?.user?.id,
        path: req.path
      });
    }
    originalJson.call(this, data);
  };
  
  next();
}

/**
 * Middleware to log authorization failures
 */
function logAuthFailure(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  const userId = req.user?.id;
  
  logSecurityEvent('AUTH_FAILURE', {
    ip,
    userAgent,
    userId,
    path: req.path,
    method: req.method
  });
  
  next();
}

/**
 * Middleware to log admin actions
 */
function logAdminAction(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  logSecurityEvent('ADMIN_ACTION', {
    ip,
    userAgent,
    userId,
    userEmail,
    path: req.path,
    method: req.method,
    body: req.method === 'GET' ? undefined : JSON.stringify(req.body)
  });
  
  next();
}

/**
 * Middleware to log suspicious activity
 */
function logSuspiciousActivity(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');
  
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    ip,
    userAgent,
    path: req.path,
    method: req.method,
    headers: {
      'user-agent': req.get('user-agent'),
      'referer': req.get('referer'),
      'origin': req.get('origin')
    }
  });
  
  next();
}

module.exports = {
  logSecurityEvent,
  logAuthAttempt,
  logAuthFailure,
  logAdminAction,
  logSuspiciousActivity
};
