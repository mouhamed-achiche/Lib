/**
 * Account Lockout Middleware
 * Tracks failed login attempts and locks accounts after threshold
 */

const NodeCache = require('node-cache');
const { logSecurityEvent } = require('./securityLogger');

// Cache to store failed attempts (TTL: 15 minutes)
const failedAttemptsCache = new NodeCache({ stdTTL: 900 });

// Cache to store locked accounts (TTL: 30 minutes)
const lockedAccountsCache = new NodeCache({ stdTTL: 1800 });

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30; // minutes

/**
 * Check if account is locked
 */
function isAccountLocked(identifier) {
  return lockedAccountsCache.get(identifier);
}

/**
 * Lock account
 */
function lockAccount(identifier) {
  lockedAccountsCache.set(identifier, {
    lockedAt: new Date().toISOString(),
    attempts: failedAttemptsCache.get(identifier) || 0
  });
  
  logSecurityEvent('ACCOUNT_LOCKED', {
    identifier,
    attempts: failedAttemptsCache.get(identifier) || 0,
    lockoutDuration: LOCKOUT_DURATION
  });
}

/**
 * Record failed attempt
 */
function recordFailedAttempt(identifier) {
  const current = failedAttemptsCache.get(identifier) || 0;
  const newCount = current + 1;
  
  failedAttemptsCache.set(identifier, newCount);
  
  logSecurityEvent('FAILED_LOGIN_ATTEMPT', {
    identifier,
    attemptCount: newCount,
    maxAttempts: MAX_ATTEMPTS
  });
  
  // Lock account if threshold reached
  if (newCount >= MAX_ATTEMPTS) {
    lockAccount(identifier);
    return true; // Account was locked
  }
  
  return false;
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(identifier) {
  failedAttemptsCache.del(identifier);
  lockedAccountsCache.del(identifier);
}

/**
 * Middleware to check account lockout status
 */
function checkAccountLockout(req, res, next) {
  const { email } = req.body || {};
  
  if (!email) {
    return next();
  }
  
  const lockInfo = isAccountLocked(email);
  
  if (lockInfo) {
    const lockedAt = new Date(lockInfo.lockedAt);
    const unlockTime = new Date(lockedAt.getTime() + LOCKOUT_DURATION * 60000);
    const remainingTime = Math.ceil((unlockTime - new Date()) / 60000);
    
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked due to too many failed attempts. Please try again in ${remainingTime} minutes.`,
      lockedUntil: unlockTime.toISOString()
    });
  }
  
  next();
}

/**
 * Middleware to handle failed login attempts
 */
function handleFailedLogin(req, res, next) {
  const { email } = req.body || {};
  
  // Store original json to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    // If login failed, record the attempt
    if (data.success === false && email) {
      const wasLocked = recordFailedAttempt(email);
      
      if (wasLocked) {
        // Override response with lockout message
        return originalJson.call(this, {
          success: false,
          message: `Account temporarily locked due to too many failed attempts. Please try again in ${LOCKOUT_DURATION} minutes.`
        });
      }
    }
    
    originalJson.call(this, data);
  };
  
  next();
}

/**
 * Middleware to clear failed attempts on successful login
 */
function clearLoginAttempts(req, res, next) {
  const { email } = req.body || {};
  
  // Store original json to intercept response
  const originalJson = res.json;
  res.json = function(data) {
    // If login succeeded, clear the attempts
    if (data.success === true && email) {
      clearFailedAttempts(email);
    }
    
    originalJson.call(this, data);
  };
  
  next();
}

module.exports = {
  checkAccountLockout,
  handleFailedLogin,
  clearLoginAttempts,
  isAccountLocked,
  clearFailedAttempts
};
