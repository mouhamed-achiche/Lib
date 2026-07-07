const express = require("express");
const adminRepo = require("../repositories/admin.repository");
const store = require("../data/store");
const { hasDbConfig } = require("../config/db");

const router = express.Router();

// Public: get the active featured promotion announcement with countdown
router.get("/active", async (req, res, next) => {
  try {
    const now = new Date();
    let promo = null;

    // Always use in-memory store for now (SQLite NOW() function not supported)
    const promos = store.promotions || [];
    promo = promos.find((p) => {
      if (!p.is_active || !p.show_announcement) return false;
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      return start <= now && end > now;
    }) || null;

    res.json({ success: true, data: { promo } });
  } catch (error) {
    next(error);
  }
});

// Public: validate a promo code at checkout
router.post("/validate", async (req, res, next) => {
  try {
    res.json({ success: true, data: { valid: false } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
