const express = require("express");
const productsRepo = require("../repositories/products.repository");

const router = express.Router();

router.get("/best-selling", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 4);
    const items = await productsRepo.getBestSelling(limit);
    res.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const items = await productsRepo.searchProducts(req.query.q);
    res.json({ success: true, data: { items, total: items.length } });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const result = await productsRepo.listProducts(req.query);
    res.json({
      success: true,
      data: { items: result.items, total: result.total },
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const result = await productsRepo.getProductBySlug(req.params.slug);
    if (!result) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
