const rateLimit = require("express-rate-limit");

// General API rate limiter: 500 requests per 70 minutes
const apiLimiter = rateLimit({
  windowMs: 70 * 60 * 1000,
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT === "true",
});

// Strict login rate limiter: 10 attempts per 70 minutes
const loginLimiter = rateLimit({
  windowMs: 70 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip,
});

// Register rate limiter: 9 per 70 minutes per IP
const registerLimiter = rateLimit({
  windowMs: 70 * 60 * 1000,
  max: 9,
  message: { success: false, message: "Too many registration attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
};
