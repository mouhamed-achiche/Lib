const crypto = require('crypto');
const getPool = require('../config/db');
const { hasDbConfig } = require('../config/db');

/**
 * Generate a secure random refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Calculate expiration date for refresh token (default 7 days)
 */
function getExpirationDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Create a refresh token for a user
 */
async function createRefreshToken(userId) {
  if (!hasDbConfig()) {
    // For in-memory store, return a token without persistence
    return generateRefreshToken();
  }

  const pool = getPool();
  const token = generateRefreshToken();
  const expiresAt = getExpirationDate(parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7);

  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt.toISOString()]
  );

  return token;
}

/**
 * Validate a refresh token and return the user ID if valid
 */
async function validateRefreshToken(token) {
  if (!hasDbConfig()) {
    // For in-memory store, just return true (simplified)
    return { userId: 1, valid: true };
  }

  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token = ?',
    [token]
  );

  if (!rows.length) {
    return { valid: false };
  }

  const refreshToken = rows[0];

  // Check if token is revoked
  if (refreshToken.revoked_at) {
    return { valid: false, reason: 'revoked' };
  }

  // Check if token is expired
  if (new Date(refreshToken.expires_at) < new Date()) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, userId: refreshToken.user_id };
}

/**
 * Revoke a refresh token
 */
async function revokeRefreshToken(token) {
  if (!hasDbConfig()) {
    return true;
  }

  const pool = getPool();
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE token = ?",
    [token]
  );

  return true;
}

/**
 * Revoke all refresh tokens for a user (e.g., on password change)
 */
async function revokeAllUserTokens(userId) {
  if (!hasDbConfig()) {
    return true;
  }

  const pool = getPool();
  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = datetime('now') WHERE user_id = ?",
    [userId]
  );

  return true;
}

/**
 * Clean up expired and revoked tokens (maintenance function)
 */
async function cleanupExpiredTokens() {
  if (!hasDbConfig()) {
    return 0;
  }

  const pool = getPool();
  const [result] = await pool.query(
    "DELETE FROM refresh_tokens WHERE expires_at < datetime('now') OR revoked_at IS NOT NULL"
  );

  return result.affectedRows || 0;
}

module.exports = {
  generateRefreshToken,
  getExpirationDate,
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};
