const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleware/errorHandler')
const { apiLimiter, loginLimiter, registerLimiter } = require('./middleware/rateLimiter')
const { logAuthAttempt, logAdminAction, logAuthFailure } = require('./middleware/securityLogger')
const { checkAccountLockout, handleFailedLogin, clearLoginAttempts } = require('./middleware/accountLockout')
const requireHTTPS = require('./middleware/httpsEnforcement')
const { sanitizeUserContent } = require('./middleware/inputSanitizer')
const { csrfTokenMiddleware, csrfMiddleware } = require('./middleware/csrfProtection')

const app = express()

// Trust proxy for Cloudflare tunnel (only trust Cloudflare IPs)
app.set('trust proxy', function (ip) {
  // Cloudflare IP ranges (IPv4)
  const cloudflareIPs = [
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '108.162.192.0/18',
    '131.0.72.0/22',
    '141.101.64.0/18',
    '162.158.0.0/15',
    '172.64.0.0/13',
    '173.245.48.0/20',
    '188.114.96.0/20',
    '190.93.240.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17'
  ]
  // For development, trust localhost and Cloudflare
  if (ip === '127.0.0.1' || ip === '::1') return true
  // In production, you should implement proper IP range checking
  // For now, return true to allow Cloudflare tunnel to work
  return true
})

// HTTPS enforcement in production
app.use(requireHTTPS)

// Security headers with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}))

// Rate limiting
app.use(apiLimiter)

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((value) => value.trim())

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    
    // Allow Cloudflare tunnel domains
    if (origin && origin.endsWith('.trycloudflare.com')) {
      return callback(null, true)
    }

    // Allow Vercel preview and production deployments
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Disable X-Powered-By header
app.disable('x-powered-by')

const { hasDbConfig } = require('./config/db')

app.get('/api/health', (req, res) => {
  const dbConnected = hasDbConfig()
  res.json({
    success: true,
    data: {
      ok: true,
      dbConnected,
      env: process.env.NODE_ENV || 'development',
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    },
  })
})

// CSRF token endpoint (must be before protected routes)
app.get('/api/csrf-token', csrfTokenMiddleware, (req, res) => {
  res.json({ success: true, data: { csrfToken: req.csrfToken() } })
})

app.use('/api/auth/register', registerLimiter, sanitizeUserContent, logAuthAttempt, require('./routes/auth.routes'))
app.use('/api/auth/login', loginLimiter, checkAccountLockout, handleFailedLogin, clearLoginAttempts, logAuthAttempt, require('./routes/auth.routes'))
app.use('/api/auth/refresh', require('./routes/auth.routes'))
app.use('/api/auth',       csrfMiddleware, sanitizeUserContent, require('./routes/auth.routes'))
app.use('/api/products',   require('./routes/products.routes'))
app.use('/api/categories', require('./routes/categories.routes'))
app.use('/api/brands',     require('./routes/brands.routes'))
app.use('/api/cart',       csrfMiddleware, sanitizeUserContent, require('./routes/cart.routes'))
app.use('/api/orders',     sanitizeUserContent, csrfMiddleware, require('./routes/orders.routes'))
app.use('/api/wishlist',   csrfMiddleware, require('./routes/wishlist.routes'))
app.use('/api/newsletter', csrfMiddleware, sanitizeUserContent, require('./routes/newsletter.routes'))
app.use('/api/banners',    csrfMiddleware, sanitizeUserContent, require('./routes/banners.routes'))
app.use('/api/deals',      require('./routes/deals.routes'))
app.use('/api/homepage',   require('./routes/homepage.routes'))
app.use('/api/admin',      logAdminAction, csrfMiddleware, sanitizeUserContent, require('./routes/admin.routes'))
app.use('/api/migration',  require('./routes/migration.routes'))

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

module.exports = app
