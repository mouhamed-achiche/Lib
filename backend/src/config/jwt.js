const INSECURE_SECRETS = new Set([
  "ibn_sina_dev_secret",
  "your-secure-random-secret-key-minimum-32-characters-long",
]);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32 || INSECURE_SECRETS.has(secret)) {
    throw new Error("JWT_SECRET must be set to a unique secret with at least 32 characters.");
  }

  return secret;
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!secret || secret.length < 32 || INSECURE_SECRETS.has(secret)) {
    throw new Error("JWT_REFRESH_SECRET must be set to a unique secret with at least 32 characters.");
  }

  return secret;
}

module.exports = { getJwtSecret, getRefreshSecret };
