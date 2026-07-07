const getPool = require("../config/db");

function mapDealFromDb(dbDeal) {
  if (!dbDeal) return null;
  return {
    id: dbDeal.id,
    productId: Number(dbDeal.product_id),
    title: dbDeal.title,
    ref: dbDeal.ref,
    description: dbDeal.description,
    originalPrice: dbDeal.original_price,
    discount: dbDeal.discount,
    salePrice: dbDeal.sale_price,
    expiryTimestamp: dbDeal.expiry_timestamp,
    is_active: dbDeal.is_active === 1,
    created_at: dbDeal.created_at,
    updated_at: dbDeal.updated_at,
  };
}

async function getAllDeals() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT * FROM deals ORDER BY created_at DESC"
  );
  return rows.map(mapDealFromDb);
}

async function getDealById(id) {
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM deals WHERE id = ?", [id]);
  return mapDealFromDb(rows[0]);
}

async function createDeal(dealData) {
  const pool = getPool();
  const id = dealData.id || `deal-${Date.now()}`;
  const now = new Date().toISOString();

  const [result] = await pool.query(
    `INSERT INTO deals (id, product_id, title, ref, description, original_price, discount, sale_price, expiry_timestamp, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      dealData.productId,
      dealData.title,
      dealData.ref || null,
      dealData.description || null,
      dealData.originalPrice,
      dealData.discount || null,
      dealData.salePrice,
      dealData.expiryTimestamp,
      dealData.is_active !== undefined ? (dealData.is_active ? 1 : 0) : 1,
      now,
      now,
    ]
  );

  return getDealById(id);
}

async function updateDeal(id, updates) {
  const pool = getPool();
  const now = new Date().toISOString();

  const fields = [];
  const values = [];

  if (updates.productId !== undefined) {
    fields.push("product_id = ?");
    values.push(updates.productId);
  }
  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.ref !== undefined) {
    fields.push("ref = ?");
    values.push(updates.ref);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.originalPrice !== undefined) {
    fields.push("original_price = ?");
    values.push(updates.originalPrice);
  }
  if (updates.discount !== undefined) {
    fields.push("discount = ?");
    values.push(updates.discount);
  }
  if (updates.salePrice !== undefined) {
    fields.push("sale_price = ?");
    values.push(updates.salePrice);
  }
  if (updates.expiryTimestamp !== undefined) {
    fields.push("expiry_timestamp = ?");
    values.push(updates.expiryTimestamp);
  }
  if (updates.is_active !== undefined) {
    fields.push("is_active = ?");
    values.push(updates.is_active ? 1 : 0);
  }

  fields.push("updated_at = ?");
  values.push(now);
  values.push(id);

  if (fields.length === 1) {
    return getDealById(id);
  }

  await pool.query(
    `UPDATE deals SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getDealById(id);
}

async function deleteDeal(id) {
  const pool = getPool();
  const [result] = await pool.query("DELETE FROM deals WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

async function getActiveDeals() {
  const pool = getPool();
  const now = Date.now();
  const [rows] = await pool.query(
    "SELECT * FROM deals WHERE is_active = 1 AND expiry_timestamp > ? ORDER BY created_at DESC",
    [now]
  );
  return rows.map(mapDealFromDb);
}

module.exports = {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getActiveDeals,
};
