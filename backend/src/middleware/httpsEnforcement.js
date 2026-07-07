/**
 * HTTPS Enforcement Middleware
 * Redirects HTTP to HTTPS in production
 */

function requireHTTPS(req, res, next) {
  // Only enforce in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  
  // Check if the request is already HTTPS
  if (req.secure || req.protocol === 'https') {
    return next();
  }
  
  // Check for X-Forwarded-Proto header (behind proxy/load balancer)
  if (req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  
  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  return res.redirect(301, httpsUrl);
}

module.exports = requireHTTPS;
