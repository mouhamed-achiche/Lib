const express = require("express");
const adminRepo = require("../repositories/admin.repository");
const getPool = require("../config/db");
const { mapProductRow } = require("../lib/mappers");

const router = express.Router();

// Public: get all active homepage sections with products
router.get("/sections", async (req, res) => {
  try {
    const sections = await adminRepo.listHomepageSections();
    const activeSections = sections
      .filter((s) => s.is_active)
      .sort((a, b) => a.order - b.order);

    // Collect all unique product IDs
    const allProductIds = [...new Set(activeSections.flatMap(s => s.productIds))];

    // Fetch all products in a single batch
    const productsMap = new Map();
    if (allProductIds.length > 0) {
      const pool = getPool();
      const placeholders = allProductIds.map(() => '?').join(', ');
      const [rows] = await pool.query(
        `SELECT p.*, c.slug AS category_slug, c.name AS category_name,
                b.slug AS brand_slug, b.name AS brand_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id IN (${placeholders}) AND p.is_active = 1`,
        allProductIds
      );
      rows.forEach(row => {
        productsMap.set(String(row.id), mapProductRow(row));
      });
    }

    // Map products back to sections
    const sectionsWithProducts = activeSections.map(section => ({
      ...section,
      products: section.productIds
        .map(id => productsMap.get(id))
        .filter(p => p !== undefined)
    }));

    res.json({ success: true, data: { sections: sectionsWithProducts } });
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
