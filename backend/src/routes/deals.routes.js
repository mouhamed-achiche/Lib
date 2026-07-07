const express = require("express");
const dealsRepo = require("../repositories/deals.repository");
const productsRepo = require("../repositories/products.repository");

const router = express.Router();

// Public: get all active deals of the day
router.get("/active", async (req, res, next) => {
  try {
    const activeDeals = await dealsRepo.getActiveDeals();

    // Enrich each deal with product data using products repository (handles both DB and in-memory)
    const enrichedDeals = await Promise.all(
      activeDeals.map(async (deal) => {
        if (deal.productId) {
          const product = await productsRepo.getProductByIdOrSlug(deal.productId);
          if (product) {
            return {
              ...deal,
              image: product.image || product.image_url,
              slug: product.slug,
              currency: product.currency || "DT",
              stock: product.stock || product.stock_qty,
            };
          }
        }
        return deal;
      })
    );

    res.json({ success: true, data: { deals: enrichedDeals } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
