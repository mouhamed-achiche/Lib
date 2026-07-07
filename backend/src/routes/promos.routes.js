const express = require("express");
const adminRepo = require("../repositories/admin.repository");
const getPool = require("../config/db");

const router = express.Router();

// Public: get the active featured promotion announcement with countdown
router.get("/active", async (req, res, next) => {
  try {
    const now = new Date();
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT * FROM promotions 
       WHERE is_active = 1 AND show_announcement = 1 
       AND start_date <= ? AND end_date > ?
       ORDER BY created_at DESC LIMIT 1`,
      [now.toISOString(), now.toISOString()]
    );
    
    const promo = rows[0] ? {
      id: String(rows[0].id),
      code: rows[0].code,
      title: rows[0].title,
      description: rows[0].description,
      discount_type: rows[0].discount_type,
      discount_value: Number(rows[0].discount_value),
      start_date: rows[0].start_date,
      end_date: rows[0].end_date,
      show_announcement: Boolean(rows[0].show_announcement),
      announcement_text: rows[0].announcement_text ?? "",
    } : null;

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
