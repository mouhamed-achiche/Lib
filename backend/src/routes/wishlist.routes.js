const express = require("express");
const auth = require("../middleware/auth");
const store = require("../data/store");

const router = express.Router();

router.use(auth);

router.get("/", (req, res) => {
  const items = store.getWishlist(req.user.id).map((productId) => store.getProductByIdOrSlug(productId)).filter(Boolean);
  res.json({ success: true, data: { items } });
});

router.post("/:productId", (req, res) => {
  const item = store.getProductByIdOrSlug(req.params.productId);
  if (!item) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }
  const wishlist = store.toggleWishlist(req.user.id, item.id);
  res.json({ success: true, data: { items: wishlist } });
});

router.delete("/:productId", (req, res) => {
  store.toggleWishlist(req.user.id, req.params.productId);
  res.json({ success: true, data: { items: store.getWishlist(req.user.id) } });
});

module.exports = router;
