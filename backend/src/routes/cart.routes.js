const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const cartRepo = require("../repositories/cart.repository");

const router = express.Router();

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const data = await cartRepo.serializeCart(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/items",
  body("productId").notEmpty().withMessage("productId is required."),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be a positive integer."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { productId, quantity = 1 } = req.body || {};
      const data = await cartRepo.addItem(req.user.id, productId, quantity);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  "/items/:itemId",
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const quantity = Number(req.body?.quantity ?? 1);
      const data = await cartRepo.updateItem(req.user.id, req.params.itemId, quantity);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/items/:itemId", async (req, res, next) => {
  try {
    const data = await cartRepo.removeItem(req.user.id, req.params.itemId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const data = await cartRepo.clearCart(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
