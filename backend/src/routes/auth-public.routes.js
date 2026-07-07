const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { getJwtSecret } = require("../config/jwt");
const usersRepo = require("../repositories/users.repository");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
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
  body("phone").optional().trim().isMobilePhone().withMessage("Please provide a valid phone number."),
  body("address").optional().trim().isLength({ min: 5 }).withMessage("Address must be at least 5 characters long."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { name, email, password, phone, address, city } = req.body;
      const user = await usersRepo.registerUser({ name, email, password, phone, address, city });
      const token = signToken(user);

      res.status(201).json({
        success: true,
        data: { token, user },
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
      res.json({ success: true, data: { token, user: safe } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
