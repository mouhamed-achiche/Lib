const express = require("express");
const store = require("../data/store");

const router = express.Router();

router.post("/", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  const subscriber = store.addNewsletterSubscriber(email);
  res.status(201).json({ success: true, data: { subscriber } });
});

module.exports = router;
