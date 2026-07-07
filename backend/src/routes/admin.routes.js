const express = require("express");
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const adminRepo = require("../repositories/admin.repository");
const productsRepo = require("../repositories/products.repository");
const dealsRepo = require("../repositories/deals.repository");
const getPool = require("../config/db");
const { sanitizeRequestBody, sanitizeUserContent } = require("../middleware/inputSanitizer");
const { apiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(auth, isAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const data = await adminRepo.getStats(req.query || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const data = await adminRepo.listProductsAdmin();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/products", async (req, res, next) => {
  try {
    const item = await adminRepo.createProduct(req.body || {});
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const item = await adminRepo.updateProduct(req.params.id, req.body || {});
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    await adminRepo.deleteProduct(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const items = await adminRepo.listCategoriesAdmin();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const item = await adminRepo.createCategory(req.body || {});
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.patch("/categories/:id", async (req, res, next) => {
  try {
    const item = await adminRepo.updateCategory(req.params.id, req.body || {});
    if (!item) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    await adminRepo.deleteCategory(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (error) {
    next(error);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const items = await adminRepo.listAllOrders(req.query.status);
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await adminRepo.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }
    const order = await adminRepo.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, data: { order }, message: `Order status updated to ${order.status}` });
  } catch (error) {
    next(error);
  }
});

router.delete("/orders/:id", async (req, res, next) => {
  try {
    const result = await adminRepo.deleteOrder(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, data: { success: true }, message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const items = await adminRepo.getUsers();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body || {};
    const user = await adminRepo.updateUserRole(req.params.id, role);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.get("/newsletter", async (req, res, next) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC");
    res.json({ success: true, data: { items: rows } });
  } catch (error) {
    next(error);
  }
});

// Deal of the Day management
router.get("/deals", async (req, res, next) => {
  try {
    const items = await dealsRepo.getAllDeals();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post("/deals", async (req, res, next) => {
  try {
    const { productId, title, ref, description, originalPrice, discount, salePrice, expiryTimestamp, is_active } = req.body || {};
    
    if (!productId || !title || !originalPrice || !salePrice || !expiryTimestamp) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate that the product ID exists using the products repository (handles both DB and in-memory)
    const product = await productsRepo.getProductByIdOrSlug(productId);
    if (!product) {
      return res.status(400).json({ success: false, message: "Product not found." });
    }

    const deal = await dealsRepo.createDeal({
      productId: product.id,
      title,
      ref: ref || String(product.id),
      description: description || product.description,
      originalPrice: Number(originalPrice),
      discount: discount || "0%",
      salePrice: Number(salePrice),
      expiryTimestamp: new Date(expiryTimestamp),
      is_active: is_active !== undefined ? is_active : true,
    });

    res.status(201).json({ success: true, data: { item: deal } });
  } catch (error) {
    next(error);
  }
});

router.patch("/deals/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const updatedDeal = await dealsRepo.updateDeal(id, updates);
    if (!updatedDeal) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    res.json({ success: true, data: { item: updatedDeal } });
  } catch (error) {
    next(error);
  }
});

router.delete("/deals/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await dealsRepo.deleteDeal(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Deal not found." });
    }

    res.json({ success: true, data: { success: true }, message: "Deal deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Homepage sections management
router.get("/homepage-sections", async (req, res, next) => {
  try {
    const items = await adminRepo.listHomepageSections();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post("/homepage-sections", apiLimiter, sanitizeRequestBody, sanitizeUserContent, async (req, res, next) => {
  try {
    const { title, slug, description, productIds, order, is_active } = req.body || {};
    console.log("Creating homepage section:", { title, slug, productIds, order, is_active });

    if (!title || !slug) {
      return res.status(400).json({ success: false, message: "Title and slug are required." });
    }

    const item = await adminRepo.createHomepageSection({
      title,
      slug,
      description,
      productIds,
      order,
      is_active,
    });

    console.log("Created section:", item);
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    console.error("Error creating section:", error);
    next(error);
  }
});

router.patch("/homepage-sections/:id", apiLimiter, sanitizeRequestBody, sanitizeUserContent, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    
    const item = await adminRepo.updateHomepageSection(id, updates);
    if (!item) {
      return res.status(404).json({ success: false, message: "Section not found." });
    }

    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.delete("/homepage-sections/:id", apiLimiter, async (req, res, next) => {
  try {
    await adminRepo.deleteHomepageSection(req.params.id);
    res.json({ success: true, data: { success: true }, message: "Section deleted successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/brands", async (req, res, next) => {
  try {
    const item = await adminRepo.createBrand(req.body || {});
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.get("/banners", async (req, res, next) => {
  try {
    const items = await adminRepo.listBanners();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
});

router.post("/banners", async (req, res, next) => {
  try {
    const item = await adminRepo.createBanner(req.body || {});
    res.status(201).json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.patch("/banners/:id", async (req, res, next) => {
  try {
    const item = await adminRepo.updateBanner(req.params.id, req.body || {});
    if (!item) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }
    res.json({ success: true, data: { item } });
  } catch (error) {
    next(error);
  }
});

router.delete("/banners/:id", async (req, res, next) => {
  try {
    await adminRepo.deleteBanner(req.params.id);
    res.json({ success: true, data: { success: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
