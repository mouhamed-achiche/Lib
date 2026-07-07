const express = require("express");
const auth = require("../middleware/auth");
const getPool = require("../config/db");
const productsRepo = require("../repositories/products.repository");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT product_id FROM wishlist_items WHERE user_id = ?",
      [req.user.id]
    );
    const productIds = rows.map(r => r.product_id);
    const items = [];
    for (const productId of productIds) {
      const product = await productsRepo.getProductByIdOrSlug(productId);
      if (product) items.push(product);
    }
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:productId", async (req, res) => {
  try {
    const product = await productsRepo.getProductByIdOrSlug(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    
    const pool = getPool();
    const [existing] = await pool.query(
      "SELECT id FROM wishlist_items WHERE user_id = ? AND product_id = ?",
      [req.user.id, product.id]
    );
    
    if (existing.length) {
      // Remove from wishlist
      await pool.query(
        "DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?",
        [req.user.id, product.id]
      );
    } else {
      // Add to wishlist
      await pool.query(
        "INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)",
        [req.user.id, product.id]
      );
    }
    
    // Return updated wishlist
    const [rows] = await pool.query(
      "SELECT product_id FROM wishlist_items WHERE user_id = ?",
      [req.user.id]
    );
    const productIds = rows.map(r => r.product_id);
    const items = [];
    for (const productId of productIds) {
      const p = await productsRepo.getProductByIdOrSlug(productId);
      if (p) items.push(p);
    }
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:productId", async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      "DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?",
      [req.user.id, req.params.productId]
    );
    
    const [rows] = await pool.query(
      "SELECT product_id FROM wishlist_items WHERE user_id = ?",
      [req.user.id]
    );
    const productIds = rows.map(r => r.product_id);
    const items = [];
    for (const productId of productIds) {
      const product = await productsRepo.getProductByIdOrSlug(productId);
      if (product) items.push(product);
    }
    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
