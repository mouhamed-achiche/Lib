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
    
    if (allowedOrigins.includes(origin)) {
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
  res.json({ success: true, data: { ok: true, dbConnected: hasDbConfig() } })
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

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

module.exports = app
