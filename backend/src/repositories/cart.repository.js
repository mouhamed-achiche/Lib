const getPool = require("../config/db");
const productsRepo = require("./products.repository");

const FREE_SHIPPING = () => Number(process.env.FREE_SHIPPING_THRESHOLD || 200);
const SHIPPING_FLAT = 12;

async function getOrCreateCartId(userId, conn) {
  const db = conn || getPool();
  let [rows] = await db.query("SELECT id FROM carts WHERE user_id = ?", [userId]);
  if (rows.length) return rows[0].id;

  const [result] = await db.query("INSERT INTO carts (user_id) VALUES (?)", [userId]);
  return result.insertId;
}

async function serializeCart(userId) {
  const pool = getPool();
  const cartId = await getOrCreateCartId(userId);
  const [rows] = await pool.query(
    `SELECT ci.id, ci.quantity, p.id AS product_id, p.slug, p.name, p.image_url, p.price, p.sale_price, b.name AS brand_name, p.stock_qty
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE ci.cart_id = ?
     ORDER BY ci.added_at DESC`,
    [cartId],
  );

  const items = rows.map((row) => {
    const price = row.sale_price != null ? Number(row.sale_price) : Number(row.price);
    return {
      id: String(row.id),
      productId: String(row.product_id),
      slug: row.slug,
      title: row.name,
      name: row.name,
      brand: row.brand_name,
      price,
      currency: "DT",
      image: row.image_url ?? "",
      quantity: row.quantity,
      stock: Number(row.stock_qty),
      total: Number((price * row.quantity).toFixed(2)),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= FREE_SHIPPING() ? 0 : SHIPPING_FLAT;

  return {
    items,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      shipping,
      total: Number((subtotal + shipping).toFixed(2)),
      freeShippingThreshold: FREE_SHIPPING(),
      amountToFreeShipping: Math.max(0, FREE_SHIPPING() - subtotal),
    },
  };
}

async function addItem(userId, productId, quantity = 1) {
  const product = await productsRepo.getProductByIdOrSlug(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const pool = getPool();
  const cartId = await getOrCreateCartId(userId);
  const [existing] = await pool.query(
    "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
    [cartId, product.id],
  );

  if (existing.length) {
    const newQty = existing[0].quantity + Number(quantity);
    await pool.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQty, existing[0].id]);
  } else {
    await pool.query("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)", [
      cartId,
      product.id,
      Math.max(1, Number(quantity)),
    ]);
  }

  return serializeCart(userId);
}

async function updateItem(userId, itemId, quantity) {
  const pool = getPool();
  const cartId = await getOrCreateCartId(userId);
  if (quantity <= 0) {
    await pool.query("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", [itemId, cartId]);
  } else {
    const [itemRow] = await pool.query(
      "SELECT product_id FROM cart_items WHERE id = ? AND cart_id = ?",
      [itemId, cartId]
    );
    if (!itemRow.length) {
      const error = new Error("Cart item not found.");
      error.statusCode = 404;
      throw error;
    }
    const [result] = await pool.query(
      "UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?",
      [quantity, itemId, cartId],
    );
    if (result.affectedRows === 0) {
      const error = new Error("Cart item not found.");
      error.statusCode = 404;
      throw error;
    }
  }
  return serializeCart(userId);
}

async function removeItem(userId, itemId) {
  const pool = getPool();
  const cartId = await getOrCreateCartId(userId);
  await pool.query("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", [itemId, cartId]);
  return serializeCart(userId);
}

async function clearCart(userId) {
  const pool = getPool();
  const [carts] = await pool.query("SELECT id FROM carts WHERE user_id = ?", [userId]);
  if (carts.length) {
    await pool.query("DELETE FROM cart_items WHERE cart_id = ?", [carts[0].id]);
  }
  return serializeCart(userId);
}

module.exports = {
  serializeCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
