const express = require("express");
const productsRepo = require("../repositories/products.repository");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await productsRepo.getCategories();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const item = await productsRepo.getCategoryBySlug(req.params.slug);
    if (!item) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
