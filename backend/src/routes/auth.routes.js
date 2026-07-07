const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const { csrfMiddleware } = require("../middleware/csrfProtection");
const { getJwtSecret, getRefreshSecret } = require("../config/jwt");
const usersRepo = require("../repositories/users.repository");
const refreshTokensRepo = require("../repositories/refreshTokens.repository");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

// Password validation: at least 10 chars, 1 uppercase, 1 number, 1 special char
const validatePassword = body("password")
  .isLength({ min: 10 })
  .withMessage("Password must be at least 10 characters long.")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter.")
  .matches(/[0-9]/)
  .withMessage("Password must contain at least one number.")
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage("Password must contain at least one special character (!@#$%^&*).");

const validateEmail = body("email")
  .isEmail()
  .normalizeEmail()
  .withMessage("Please provide a valid email address.");

router.post(
  "/register",
  validateEmail,
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters long."),
  validatePassword,
  body("phone").trim().isLength({ min: 8 }).withMessage("Phone number must be at least 8 characters."),
  body("address").trim().isLength({ min: 5 }).withMessage("Address must be at least 5 characters long."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { name, email, password, phone, address, city } = req.body;
      const user = await usersRepo.registerUser({ name, email, password, phone, address, city });
      const token = signToken(user);
      const refreshToken = await refreshTokensRepo.createRefreshToken(user.id);

      res.status(201).json({
        success: true,
        data: { token, refreshToken, user },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  validateEmail,
  body("password").notEmpty().withMessage("Password is required."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await usersRepo.getUserByEmail(email);

      if (!user || !bcrypt.compareSync(password || "", user.passwordHash || user.password)) {
        // Generic message to prevent user enumeration
        return res.status(401).json({ success: false, message: "Invalid email or password." });
      }

      const safe = usersRepo.toPublicUser(user);
      const token = signToken(safe);
      const refreshToken = await refreshTokensRepo.createRefreshToken(user.id);
      res.json({ success: true, data: { token, refreshToken, user: safe } });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", auth, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

router.patch(
  "/me",
  auth,
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").optional().isEmail().normalizeEmail().withMessage("Please provide a valid email."),
  body("phone").optional().trim().isMobilePhone().withMessage("Please provide a valid phone number."),
  body("address").optional().trim().isLength({ min: 5 }).withMessage("Address must be at least 5 characters."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const user = await usersRepo.updateUser(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/change-password",
  auth,
  body("currentPassword").notEmpty().withMessage("Current password is required."),
  validatePassword,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await usersRepo.changePassword(req.user.id, currentPassword, newPassword);
      
      // Revoke all refresh tokens on password change
      await refreshTokensRepo.revokeAllUserTokens(req.user.id);
      
      res.json({ success: true, data: { user } });
    } catch (error) {
      next(error);
    }
  }
);

// Refresh token endpoint
router.post(
  "/refresh",
  body("refreshToken").notEmpty().withMessage("Refresh token is required."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { refreshToken } = req.body;

      // Verify the refresh token JWT
      try {
        const payload = jwt.verify(refreshToken, getRefreshSecret());
        
        if (payload.type !== 'refresh') {
          return res.status(401).json({ success: false, message: "Invalid refresh token." });
        }

        // Get user
        const user = await usersRepo.getUserById(payload.sub);
        if (!user) {
          return res.status(401).json({ success: false, message: "Invalid session." });
        }

        // Generate new tokens
        const safe = usersRepo.toPublicUser(user);
        const newToken = signToken(safe);
        const newRefreshToken = await refreshTokensRepo.createRefreshToken(user.id);

        // Revoke old refresh token
        await refreshTokensRepo.revokeRefreshToken(refreshToken);

        res.json({ success: true, data: { token: newToken, refreshToken: newRefreshToken, user: safe } });
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, message: "Refresh token expired." });
        }
        return res.status(401).json({ success: false, message: "Invalid refresh token." });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Logout endpoint
router.post(
  "/logout",
  auth,
  body("refreshToken").optional(),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      // Revoke the refresh token if provided
      if (refreshToken) {
        await refreshTokensRepo.revokeRefreshToken(refreshToken);
      }
      
      // Revoke all refresh tokens for the user
      await refreshTokensRepo.revokeAllUserTokens(req.user.id);

      res.json({ success: true, message: "Logged out successfully." });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
