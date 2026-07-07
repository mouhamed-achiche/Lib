const express = require("express");
const productsRepo = require("../repositories/products.repository");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await productsRepo.getBrands();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
