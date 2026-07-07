const express = require("express");
const adminRepo = require("../repositories/admin.repository");

const router = express.Router();

// Public endpoint to get active banners
router.get("/active", async (req, res, next) => {
  try {
    const banners = await adminRepo.listBanners();
    const activeBanners = (banners || []).filter((banner) => banner.is_active);
    res.json({ success: true, data: { items: activeBanners } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
