const getPool = require("../config/db");
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
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM categories WHERE slug = ? AND is_active = 1",
    [slug],
  );
  return rows[0] ? mapCategoryRow(rows[0]) : null;
}

async function getBrands() {
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

  const [countRows] = await pool.query(
    `SELECT COUNT(*)::int AS total FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.is_active = 1 ${where}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);

  const offset = (Number(page) - 1) * Number(limit);
  const [rows] = await pool.query(
    `${PRODUCT_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );

  return {
    items: rows.map((row) => mapProductRow(row)),
    total: Number(total),
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
  const pool = getPool();
  const [rows] = await pool.query(`${PRODUCT_SELECT} AND p.slug = ?`, [slug]);
  if (!rows.length) return null;

  const images = await getProductImages(rows[0].id);
  return { item: mapProductRow(rows[0], images) };
}

async function getProductByIdOrSlug(identifier) {
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
