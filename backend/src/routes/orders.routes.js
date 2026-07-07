const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const ordersRepo = require("../repositories/orders.repository");
const { encodeObject } = require("../lib/outputEncoder");

const router = express.Router();

router.post(
  "/guest",
  body("customerName").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("phone").trim().isLength({ min: 8 }).withMessage("Phone number is required."),
  body("address").trim().isLength({ min: 5 }).withMessage("Address must be at least 5 characters."),
  body("items").isArray().withMessage("Items must be an array."),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: "Validation failed.", errors: errors.array() });
      }

      const { customerName, name, phone, address, items } = req.body || {};
      if (!String(customerName ?? name ?? "").trim() || !String(phone ?? "").trim() || !String(address ?? "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Name, phone, and delivery address are required.",
        });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Order must include at least one item." });
      }
      const order = await ordersRepo.createGuestOrder(req.body || {});
      res.status(201).json({ success: true, data: { order: encodeObject(order) } });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/track", async (req, res, next) => {
  try {
    const { reference, orderNumber, phone } = req.body || {};
    const order = await ordersRepo.findOrderByReference(reference ?? orderNumber, phone);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, data: { order: encodeObject(order) } });
  } catch (error) {
    next(error);
  }
});

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const items = await ordersRepo.getUserOrders(req.user.id);
    res.json({ success: true, data: { items: items.map(item => encodeObject(item)) } });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await ordersRepo.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    // Users can only access their own orders (both userId and customerId should match)
    if (order.userId && order.userId !== req.user.id && order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    res.json({ success: true, data: { order: encodeObject(order) } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const order = await ordersRepo.createOrder(req.user.id, req.body || {});
    res.status(201).json({ success: true, data: { order: encodeObject(order) } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
