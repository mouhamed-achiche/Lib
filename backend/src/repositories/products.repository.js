const getPool = require("../config/db");
const { hasDbConfig } = require("../config/db");
const store = require("../data/store");
const { mapCategoryRow, mapBrandRow, mapProductRow } = require("../lib/mappers");

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name,
         b.slug AS brand_slug, b.name AS brand_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE p.is_active = 1
`;

async function getCategories() {
  if (!hasDbConfig()) {
    return store.categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? "",
    }));
  }

  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT c.*, p.name AS parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.is_active = 1
    ORDER BY c.sort_order, c.name
  `);
  return rows.map(mapCategoryRow);
}

async function getCategoryBySlug(slug) {
  if (!hasDbConfig()) return store.getCategoryBySlug(slug);

  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM categories WHERE slug = ? AND is_active = 1",
    [slug],
  );
  return rows[0] ? mapCategoryRow(rows[0]) : null;
}

async function getBrands() {
  if (!hasDbConfig()) return store.brands;

  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM brands WHERE is_active = 1 ORDER BY name",
  );
  return rows.map(mapBrandRow);
}

async function getProductImages(productId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order",
    [productId],
  );
  return rows;
}

async function listProducts(query = {}) {
  if (!hasDbConfig()) {
    let items = [...store.products];
    const { category, brand, search } = query;

    if (category && category !== "all") {
      items = items.filter((p) => p.categorySlug === category);
    }
    if (brand) {
      items = items.filter((p) => p.brandSlug === brand || p.brand === brand);
    }
    if (search) {
      const term = String(search).toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          (p.description || "").toLowerCase().includes(term),
      );
    }

    const page = Number(query.page || 1);
    const limit = Number(query.limit || 200);
    const total = items.length;
    const offset = (page - 1) * limit;
    items = items.slice(offset, offset + limit);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  const pool = getPool();
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    sort = "newest",
    page = 1,
    limit = 12,
    search,
  } = query;

  let where = "";
  const params = [];

  if (category && category !== "all") {
    if (Number.isNaN(Number(category))) {
      where += " AND c.slug = ?";
    } else {
      where += " AND p.category_id = ?";
    }
    params.push(category);
  }
  if (brand) {
    where += Number.isNaN(Number(brand)) ? " AND b.slug = ?" : " AND p.brand_id = ?";
    params.push(brand);
  }
  if (minPrice) {
    where += " AND p.price >= ?";
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    where += " AND p.price <= ?";
    params.push(Number(maxPrice));
  }
  if (search) {
    where += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const orderMap = {
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    newest: "p.created_at DESC",
    name_asc: "p.name ASC",
  };
  const orderBy = orderMap[sort] || orderMap.newest;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.is_active = 1 ${where}`,
    params,
  );

  const offset = (Number(page) - 1) * Number(limit);
  const [rows] = await pool.query(
    `${PRODUCT_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );

  return {
    items: rows.map((row) => mapProductRow(row)),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
}


async function searchProducts(q) {
  if (!q || String(q).trim().length < 2) return [];
  const result = await listProducts({ search: q, limit: 10, page: 1 });
  return result.items;
}

async function getProductBySlug(slug) {
  if (!hasDbConfig()) {
    const item = store.getProductByIdOrSlug(slug);
    return item ? { item } : null;
  }

  const pool = getPool();
  const [rows] = await pool.query(`${PRODUCT_SELECT} AND p.slug = ?`, [slug]);
  if (!rows.length) return null;

  const images = await getProductImages(rows[0].id);
  return { item: mapProductRow(rows[0], images) };
}

async function getProductByIdOrSlug(identifier) {
  if (!hasDbConfig()) return store.getProductByIdOrSlug(identifier);

  const pool = getPool();
  const isNumeric = !Number.isNaN(Number(identifier));
  const [rows] = await pool.query(
    `${PRODUCT_SELECT} AND ${isNumeric ? "p.id = ?" : "p.slug = ?"}`,
    [identifier],
  );
  if (!rows.length) return null;

  const images = await getProductImages(rows[0].id);
  return mapProductRow(rows[0], images);
}

async function getBestSelling(limit = 4) {
  if (!hasDbConfig()) {
    const productSales = {};
    store.orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const prodId = item.productId || item.id;
        const quantity = Number(item.quantity || 0);
        productSales[prodId] = (productSales[prodId] || 0) + quantity;
      });
    });

    const sortedProducts = [...store.products].sort((a, b) => {
      const soldA = productSales[a.id] || 0;
      const soldB = productSales[b.id] || 0;
      return soldB - soldA;
    });

    return sortedProducts.slice(0, limit);
  }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.*, c.slug AS category_slug, c.name AS category_name,
            b.slug AS brand_slug, b.name AS brand_name,
            COALESCE(SUM(oi.quantity), 0) AS sold_qty
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN order_items oi ON p.id = oi.product_id
     WHERE p.is_active = 1
     GROUP BY p.id
     ORDER BY sold_qty DESC, p.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows.map((row) => mapProductRow(row));
}

module.exports = {
  getCategories,
  getCategoryBySlug,
  getBrands,
  listProducts,
  getBestSelling,
  searchProducts,
  getProductBySlug,
  getProductByIdOrSlug,
};
