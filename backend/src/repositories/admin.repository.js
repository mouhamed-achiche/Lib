const getPool = require("../config/db");
const { ORDER_STATUS } = require("../lib/orderStatus");
const ordersRepo = require("./orders.repository");
const productsRepo = require("./products.repository");

async function getStats(query = {}) {
  const { period = "all", category } = query;
  const pool = getPool();
  let dateCondition = "";
  const params = [];
  if (period === "today") {
    dateCondition = " AND date(o.created_at) = date('now')";
  } else if (period === "7days") {
    dateCondition = " AND o.created_at >= datetime('now', '-7 days')";
  } else if (period === "30days") {
    dateCondition = " AND o.created_at >= datetime('now', '-30 days')";
  }

  let catCondition = "";
  let catJoin = "";
  if (category && category !== "all") {
    catJoin = " JOIN order_items oi2 ON o.id = oi2.order_id JOIN products p2 ON oi2.product_id = p2.id LEFT JOIN categories c2 ON p2.category_id = c2.id";
    catCondition = " AND (c2.slug = ? OR p2.category_id = ?)";
    params.push(category, category);
  }

  // Count orders and total revenue matching filters
  const [[orders]] = await pool.query(
    `SELECT COUNT(DISTINCT o.id) AS total, COALESCE(SUM(o.total), 0) AS revenue FROM orders o ${catJoin} WHERE 1=1 ${dateCondition} ${catCondition}`,
    params
  );

  const [[products]] = await pool.query(
    "SELECT COUNT(*) AS total FROM products WHERE is_active = 1",
  );
  const [[users]] = await pool.query(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'customer'",
  );

  const [[pending]] = await pool.query(
    `SELECT COUNT(DISTINCT o.id) AS total FROM orders o ${catJoin} WHERE o.status IN (?, ?) ${dateCondition} ${catCondition}`,
    [ORDER_STATUS.PENDING_APPROVAL_CALL, ORDER_STATUS.NO_ANSWER_ON_CALL, ...params]
  );
  const [[newsletter]] = await pool.query("SELECT COUNT(*) AS total FROM newsletter_subscribers");

  const [recentOrders] = await pool.query(`
    SELECT DISTINCT o.id, o.order_number, o.external_id, o.total, o.status, o.created_at,
           COALESCE(u.name, o.shipping_name) AS customer_name,
           COALESCE(u.email, '') AS customer_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ${catJoin}
    WHERE 1=1 ${dateCondition} ${catCondition}
    ORDER BY o.created_at DESC LIMIT 5
  `, params);

  // Top products matching date and category filters
  let topCatCondition = "";
  const topParams = [];
  if (category && category !== "all") {
    topCatCondition = " AND (c.slug = ? OR p.category_id = ?)";
    topParams.push(category, category);
  }
  let topDateCondition = "";
  if (period === "today") {
    topDateCondition = " AND date(o.created_at) = date('now')";
  } else if (period === "7days") {
    topDateCondition = " AND o.created_at >= datetime('now', '-7 days')";
  } else if (period === "30days") {
    topDateCondition = " AND o.created_at >= datetime('now', '-30 days')";
  }

  const [topProducts] = await pool.query(`
    SELECT p.name, SUM(oi.quantity) AS sold, SUM(oi.subtotal) AS revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1 ${topDateCondition} ${topCatCondition}
    GROUP BY oi.product_id
    ORDER BY sold DESC LIMIT 5
  `, [...topParams]);

  return {
    products: products.total,
    categories: (await productsRepo.getCategories()).length,
    users: users.total,
    orders: orders.total,
    newsletterSubscribers: newsletter.total,
    revenue: Number(orders.revenue || 0).toFixed(2),
    pendingOrders: pending.total,
    recentOrders,
    topProducts,
  };
}

async function getUsers() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, email, role, phone, address, city, created_at FROM users ORDER BY created_at DESC",
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    email: r.email,
    role: r.role,
    phone: r.phone,
    address: r.address,
    city: r.city,
    createdAt: r.created_at,
  }));
}

async function updateUserRole(userId, role) {
  if (!["customer", "staff"].includes(role)) {
    const error = new Error("Invalid role.");
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
  const [rows] = await pool.query(
    "SELECT id, name, email, role, phone, address, city FROM users WHERE id = ?",
    [userId],
  );
  return rows[0]
    ? {
        id: String(rows[0].id),
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
      }
    : null;
}

async function createProduct(data) {
  const pool = getPool();
  const slug =
    data.slug ||
    String(data.name || data.title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const [result] = await pool.query(
    `INSERT INTO products (name, slug, description, price, sale_price, original_price, stock_qty, available, category_id, brand_id, badge, image_url, promotion_end_date, promotion_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name || data.title,
      slug,
      data.description ?? null,
      data.price,
      data.sale_price ?? null,
      data.original_price ?? data.originalPrice ?? null,
      data.stock_qty ?? data.stock ?? 0,
      data.available !== undefined ? (data.available ? 1 : 0) : 1,
      data.category_id,
      data.brand_id ?? null,
      data.badge ?? "none",
      data.image_url ?? data.image ?? null,
      data.promotion_end_date ?? data.promotionEndDate ?? null,
      data.promotionType ?? "none",
    ],
  );

  return { id: String(result.insertId), slug, title: data.name || data.title };
}

async function updateProduct(id, data) {
  const pool = getPool();
  const allowed = [
    "name",
    "slug",
    "description",
    "price",
    "sale_price",
    "original_price",
    "stock_qty",
    "available",
    "category_id",
    "brand_id",
    "badge",
    "image_url",
    "is_active",
    "promotion_end_date",
    "promotion_type",
  ];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(key === "is_active" ? (data[key] ? 1 : 0) : data[key]);
    }
  }
  if (!updates.length) return { id };
  values.push(id);
  await pool.query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
  return { id };
}

async function deleteProduct(id) {
  const pool = getPool();
  await pool.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
  return true;
}

async function listProductsAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT p.*, c.name AS category_name, b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.is_active = 1
    ORDER BY p.created_at DESC
  `);
  return { items: rows, total: rows.length };
}

async function listCategoriesAdmin() {
  return productsRepo.getCategories();
}

async function createCategory(data) {
  const pool = getPool();
  const slug =
    data.slug ||
    String(data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const [result] = await pool.query(
    "INSERT INTO categories (name, slug, description, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)",
    [data.name, slug, data.description ?? null, data.icon ?? null, data.sort_order ?? 0],
  );

  return {
    id: String(result.insertId),
    slug,
    name: data.name,
    description: data.description ?? "",
  };
}

async function updateCategory(id, data) {
  const pool = getPool();
  const allowed = ["name", "slug", "description", "icon", "sort_order", "is_active"];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (!updates.length) {
    const error = new Error("No valid fields to update.");
    error.statusCode = 400;
    throw error;
  }
  values.push(id);
  await pool.query(`UPDATE categories SET ${updates.join(", ")} WHERE id = ?`, values);
  const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
  return rows[0]
    ? {
        id: String(rows[0].id),
        slug: rows[0].slug,
        name: rows[0].name,
        description: rows[0].description ?? "",
      }
    : null;
}

async function deleteCategory(id) {
  const pool = getPool();
  await pool.query("UPDATE categories SET is_active = 0 WHERE id = ?", [id]);
  return true;
}

async function listPromos() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT p.id, p.code, p.title, p.description, p.discount_type, p.discount_value,
           p.max_uses, p.used_count, p.start_date, p.end_date, p.is_active, p.created_at,
           p.show_announcement, p.announcement_text,
           u.name AS created_by_name
    FROM promotions p
    LEFT JOIN users u ON p.created_by = u.id
    ORDER BY p.created_at DESC
  `);
  return rows.map((row) => ({
    id: String(row.id),
    code: row.code,
    title: row.title,
    description: row.description,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value),
    max_uses: row.max_uses,
    used_count: row.used_count,
    start_date: row.start_date,
    end_date: row.end_date,
    is_active: row.is_active,
    show_announcement: Boolean(row.show_announcement),
    announcement_text: row.announcement_text ?? "",
    created_at: row.created_at,
    created_by_name: row.created_by_name,
  }));
}

async function createPromo(data, userId) {
  const pool = getPool();
  // Try inserting with new columns; fall back gracefully if columns don't exist yet
  let result;
  try {
    [result] = await pool.query(
      `INSERT INTO promotions (code, title, description, discount_type, discount_value, max_uses, start_date, end_date, is_active, show_announcement, announcement_text, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.code,
        data.title,
        data.description ?? null,
        data.discount_type || "percentage",
        data.discount_value,
        data.max_uses ?? null,
        data.start_date,
        data.end_date,
        data.is_active ? 1 : 0,
        data.show_announcement ? 1 : 0,
        data.announcement_text ?? null,
        userId,
      ],
    );
  } catch (err) {
    // Fallback if new columns not migrated yet
    if (err.code === "ER_BAD_FIELD_ERROR") {
      [result] = await pool.query(
        `INSERT INTO promotions (code, title, description, discount_type, discount_value, max_uses, start_date, end_date, is_active, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.code, data.title, data.description ?? null,
          data.discount_type || "percentage", data.discount_value,
          data.max_uses ?? null, data.start_date, data.end_date,
          data.is_active ? 1 : 0, userId,
        ],
      );
    } else {
      throw err;
    }
  }

  return {
    id: String(result.insertId),
    code: data.code,
    title: data.title,
    description: data.description,
    discount_type: data.discount_type || "percentage",
    discount_value: Number(data.discount_value),
    max_uses: data.max_uses,
    used_count: 0,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: data.is_active ? 1 : 0,
    show_announcement: data.show_announcement ? 1 : 0,
    announcement_text: data.announcement_text ?? null,
  };
}

async function updatePromo(id, data) {
  const pool = getPool();
  const allowed = ["code", "title", "description", "discount_type", "discount_value", "max_uses", "start_date", "end_date", "is_active", "show_announcement", "announcement_text"];
  const boolFields = new Set(["is_active", "show_announcement"]);
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(boolFields.has(key) ? (data[key] ? 1 : 0) : data[key]);
    }
  }
  if (!updates.length) return { id };
  values.push(id);
  try {
    await pool.query(`UPDATE promotions SET ${updates.join(", ")} WHERE id = ?`, values);
  } catch (err) {
    // Fallback: retry without new columns if not migrated
    if (err.code === "ER_BAD_FIELD_ERROR") {
      const safeAllowed = ["code", "title", "description", "discount_type", "discount_value", "max_uses", "start_date", "end_date", "is_active"];
      const safeUpdates = [];
      const safeValues = [];
      for (const key of safeAllowed) {
        if (data[key] !== undefined) {
          safeUpdates.push(`${key} = ?`);
          safeValues.push(key === "is_active" ? (data[key] ? 1 : 0) : data[key]);
        }
      }
      if (safeUpdates.length) {
        safeValues.push(id);
        await pool.query(`UPDATE promotions SET ${safeUpdates.join(", ")} WHERE id = ?`, safeValues);
      }
    } else {
      throw err;
    }
  }
  return { id };
}

async function deletePromo(id) {
  const pool = getPool();
  await pool.query("DELETE FROM promotions WHERE id = ?", [id]);
  return true;
}

async function createBrand(data) {
  const pool = getPool();
  const slug =
    data.slug ||
    String(data.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const [result] = await pool.query(
    "INSERT INTO brands (name, slug, is_active) VALUES (?, ?, 1)",
    [data.name, slug],
  );

  return {
    id: String(result.insertId),
    slug,
    name: data.name,
  };
}

async function listBanners() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT id, title, subtitle, image_url, link, is_active, sort_order, created_at
    FROM banners
    ORDER BY sort_order ASC, created_at DESC
  `);
  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    subtitle: row.subtitle,
    image_url: row.image_url,
    link: row.link,
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order),
    created_at: row.created_at,
  }));
}

async function createBanner(data) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO banners (title, subtitle, image_url, link, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.title ?? null,
      data.subtitle ?? null,
      data.image_url,
      data.link ?? null,
      data.is_active ? 1 : 0,
      data.sort_order ?? 0,
    ]
  );
  return {
    id: String(result.insertId),
    ...data,
  };
}

async function updateBanner(id, data) {
  const pool = getPool();
  const allowed = ["title", "subtitle", "image_url", "link", "is_active", "sort_order"];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(key === "is_active" ? (data[key] ? 1 : 0) : data[key]);
    }
  }
  if (!updates.length) return { id };
  values.push(id);
  await pool.query(`UPDATE banners SET ${updates.join(", ")} WHERE id = ?`, values);
  return { id };
}

async function deleteBanner(id) {
  const pool = getPool();
  await pool.query("DELETE FROM banners WHERE id = ?", [id]);
  return true;
}

// Homepage sections functions
async function listHomepageSections() {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT s.*, 
           GROUP_CONCAT(sp.product_id) as product_ids
    FROM homepage_sections s
    LEFT JOIN homepage_section_products sp ON s.id = sp.section_id
    GROUP BY s.id
    ORDER BY s.order_num
  `);
  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    description: row.description,
    order: Number(row.order_num),
    is_active: Boolean(row.is_active),
    productIds: row.product_ids ? row.product_ids.split(',') : [],
    created_at: row.created_at,
  }));
}

async function createHomepageSection(data) {
  // Validate required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error('Title is required and must be a non-empty string');
  }
  if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
    throw new Error('Slug is required and must be a non-empty string');
  }
  if (data.title.length > 255) {
    throw new Error('Title must be less than 255 characters');
  }
  if (data.slug.length > 255) {
    throw new Error('Slug must be less than 255 characters');
  }
  if (data.description && data.description.length > 1000) {
    throw new Error('Description must be less than 1000 characters');
  }
  if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 1)) {
    throw new Error('Order must be a positive number');
  }
  if (data.productIds && !Array.isArray(data.productIds)) {
    throw new Error('Product IDs must be an array');
  }
  if (data.productIds && data.productIds.length > 100) {
    throw new Error('Cannot add more than 100 products to a section');
  }

  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO homepage_sections (title, slug, description, order_num, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.title.trim(),
      data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      data.description || null,
      data.order !== undefined ? data.order : 1,
      data.is_active ? 1 : 0,
    ]
  );
  const sectionId = result.insertId;
  
  // Insert product associations
  if (data.productIds && data.productIds.length > 0) {
    const validProductIds = data.productIds.filter(productId => {
      if (typeof productId !== 'string' || productId.trim().length === 0) {
        return false;
      }
      return true;
    });
    if (validProductIds.length === 0) {
      throw new Error('Invalid product ID');
    }
    const placeholders = validProductIds.map(() => '(?, ?)').join(', ');
    const flatValues = validProductIds.flatMap(productId => [sectionId, productId.trim()]);
    await pool.query(
      `INSERT INTO homepage_section_products (section_id, product_id) VALUES ${placeholders}`,
      flatValues
    );
  }
  
  return {
    id: String(sectionId),
    title: data.title.trim(),
    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    description: data.description || "",
    order: data.order !== undefined ? data.order : 1,
    is_active: data.is_active !== undefined ? data.is_active : true,
    productIds: data.productIds || [],
  };
}

async function updateHomepageSection(id, data) {
  // Validate data if provided
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new Error('Title must be a non-empty string');
    }
    if (data.title.length > 255) {
      throw new Error('Title must be less than 255 characters');
    }
  }
  if (data.slug !== undefined) {
    if (typeof data.slug !== 'string' || data.slug.trim().length === 0) {
      throw new Error('Slug must be a non-empty string');
    }
    if (data.slug.length > 255) {
      throw new Error('Slug must be less than 255 characters');
    }
  }
  if (data.description !== undefined && data.description.length > 1000) {
    throw new Error('Description must be less than 1000 characters');
  }
  if (data.order !== undefined && (typeof data.order !== 'number' || data.order < 1)) {
    throw new Error('Order must be a positive number');
  }
  if (data.productIds !== undefined) {
    if (!Array.isArray(data.productIds)) {
      throw new Error('Product IDs must be an array');
    }
    if (data.productIds.length > 100) {
      throw new Error('Cannot add more than 100 products to a section');
    }
  }

  const pool = getPool();
  const allowed = ["title", "slug", "description", "order_num", "is_active"];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    const dataKey = key === "order_num" ? "order" : key;
    if (data[dataKey] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(key === "is_active" ? (data[dataKey] ? 1 : 0) : (key === "title" ? data[dataKey].trim() : data[dataKey]));
    }
  }
  if (!updates.length) return { id };
  values.push(id);
  await pool.query(`UPDATE homepage_sections SET ${updates.join(", ")} WHERE id = ?`, values);
  
  // Update product associations if provided
  if (data.productIds !== undefined) {
    await pool.query("DELETE FROM homepage_section_products WHERE section_id = ?", [id]);
    const validProductIds = data.productIds.filter(productId => {
      if (typeof productId !== 'string' || productId.trim().length === 0) {
        return false;
      }
      return true;
    });
    if (validProductIds.length > 0) {
      const placeholders = validProductIds.map(() => '(?, ?)').join(', ');
      const flatValues = validProductIds.flatMap(productId => [id, productId.trim()]);
      await pool.query(
        `INSERT INTO homepage_section_products (section_id, product_id) VALUES ${placeholders}`,
        flatValues
      );
    }
  }
  
  return { id, ...data };
}

async function deleteHomepageSection(id) {
  const pool = getPool();
  await pool.query("DELETE FROM homepage_sections WHERE id = ?", [id]);
  return true;
}

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductsAdmin,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  listPromos,
  createPromo,
  updatePromo,
  deletePromo,
  listAllOrders: ordersRepo.listAllOrders,
  getOrderById: ordersRepo.getOrderById,
  updateOrderStatus: ordersRepo.updateOrderStatus,
  deleteOrder: ordersRepo.deleteOrder,
  createBrand,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  listHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
};
