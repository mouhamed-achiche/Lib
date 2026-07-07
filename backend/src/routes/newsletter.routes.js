const express = require("express");
const getPool = require("../config/db");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  try {
    const pool = getPool();
    const [existing] = await pool.query("SELECT id FROM newsletter_subscribers WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: "Email already subscribed." });
    }

    const [result] = await pool.query("INSERT INTO newsletter_subscribers (email) VALUES (?)", [email]);
    res.status(201).json({ success: true, data: { id: String(result.insertId), email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
