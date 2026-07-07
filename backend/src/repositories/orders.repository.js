const getPool = require("../config/db");
const { ORDER_STATUS, canTransitionTo, normalizeOrderStatus, normalizePhone, parseOrderReference } = require("../lib/orderStatus");
const { mapOrderRow } = require("../lib/mappers");
const productsRepo = require("./products.repository");

const FREE_SHIPPING = () => Number(process.env.FREE_SHIPPING_THRESHOLD || 200);
const SHIPPING_FLAT = 12;

async function generateOrderNumber(conn) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE strftime('%Y', created_at) = ?",
    [String(year)],
  );
  const seq = String(Number(rows[0].cnt) + 1).padStart(5, "0");
  return `IBN-${year}-${seq}`;
}

async function resolveOrderItems(items) {
  const resolved = [];
  for (const item of items) {
    const productId = item.productId ?? item.id;
    let product = null;
    if (productId) {
      product = await productsRepo.getProductByIdOrSlug(productId);
    }
    const quantity = Number(item.quantity ?? 1);
    const price = product ? Number(product.price) : Number(item.price ?? 0);
    const name = product ? product.title : item.name ?? item.title ?? "Item";
    resolved.push({
      productId: product ? product.id : item.productId ?? null,
      name,
      image: product?.image ?? item.image ?? "",
      price,
      quantity,
      total: Number((price * quantity).toFixed(2)),
    });
  }
  return resolved.filter((i) => i.quantity > 0);
}

async function createGuestOrder(payload) {
  const items = await resolveOrderItems(payload.items || []);
  if (!items.length) {
    const error = new Error("Order must include at least one item.");
    error.statusCode = 400;
    throw error;
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const shipping = subtotal >= FREE_SHIPPING() ? 0 : SHIPPING_FLAT;
  const total = Number((subtotal + shipping).toFixed(2));
  const now = new Date();

  const pool = getPool();
  try {
    const orderNumber = await generateOrderNumber(pool);
    const externalId = `order-${Date.now()}`;

    const [orderResult] = await pool.query(
      `INSERT INTO orders
        (user_id, order_number, external_id, status, subtotal, shipping_cost, tax, total,
         shipping_name, shipping_phone, shipping_address, shipping_city, notes, status_updated_at)
       VALUES (NULL, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        externalId,
        ORDER_STATUS.PENDING_APPROVAL_CALL,
        subtotal.toFixed(2),
        shipping.toFixed(2),
        total.toFixed(2),
        String(payload.customerName ?? payload.name ?? "").trim(),
        String(payload.phone ?? "").trim(),
        String(payload.address ?? payload.shippingAddress ?? "").trim(),
        String(payload.city ?? "").trim() || "",
        String(payload.notes ?? "").trim(),
        now,
      ],
    );

    const itemValues = items.map(item => [
      orderResult.insertId,
      item.productId,
      item.name,
      item.image,
      item.price,
      item.quantity,
      item.total
    ]);
    const placeholders = itemValues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = itemValues.flat();
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_img, unit_price, quantity, subtotal)
       VALUES ${placeholders}`,
      flatValues
    );

    return getOrderById(externalId);
  } catch (err) {
    throw err;
  }
}

async function createOrder(userId, payload = {}) {
  const items = await resolveOrderItems(
    Array.isArray(payload.items) && payload.items.length ? payload.items : [],
  );

  if (!items.length) {
    const error = new Error("Order must include at least one item.");
    error.statusCode = 400;
    throw error;
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const shipping = subtotal >= FREE_SHIPPING() ? 0 : SHIPPING_FLAT;
  const total = Number((subtotal + shipping).toFixed(2));
  const now = new Date();

  const pool = getPool();
  try {
    const orderNumber = await generateOrderNumber(pool);
    const externalId = `order-${Date.now()}`;

    const [orderResult] = await pool.query(
      `INSERT INTO orders
        (user_id, order_number, external_id, status, subtotal, shipping_cost, tax, total,
         shipping_name, shipping_phone, shipping_address, shipping_city, notes, status_updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        orderNumber,
        externalId,
        ORDER_STATUS.PENDING_APPROVAL_CALL,
        subtotal.toFixed(2),
        shipping.toFixed(2),
        total.toFixed(2),
        String(payload.customerName ?? payload.name ?? "").trim(),
        String(payload.phone ?? "").trim(),
        String(payload.address ?? payload.shippingAddress ?? "").trim(),
        String(payload.city ?? "").trim() || "",
        String(payload.notes ?? "").trim(),
        now,
      ],
    );

    const itemValues = items.map(item => [
      orderResult.insertId,
      item.productId,
      item.name,
      item.image,
      item.price,
      item.quantity,
      item.total
    ]);
    const placeholders = itemValues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = itemValues.flat();
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_img, unit_price, quantity, subtotal)
       VALUES ${placeholders}`,
      flatValues
    );

    await pool.query("DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)", [
      userId,
    ]);

    return getOrderById(externalId);
  } catch (err) {
    throw err;
  }
}

async function fetchOrderWithItems(whereClause, params) {
  const pool = getPool();
  const [orders] = await pool.query(
    `SELECT o.*, u.email AS customer_email
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE ${whereClause}`,
    params,
  );
  if (!orders.length) return null;

  const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [orders[0].id]);
  return mapOrderRow(orders[0], items);
}

async function getOrderById(orderId) {
  const id = parseOrderReference(orderId) || orderId;
  const pool = getPool();
  const [orders] = await pool.query(
    "SELECT o.*, u.email AS customer_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.external_id = ? OR o.id = ?",
    [id, Number.isNaN(Number(id.replace("order-", ""))) ? 0 : id.replace("order-", "")],
  );
  if (!orders.length) {
    const [byNum] = await pool.query(
      "SELECT o.*, u.email AS customer_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.external_id = ?",
      [id],
    );
    if (!byNum.length) return null;
    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [byNum[0].id]);
    return mapOrderRow(byNum[0], items);
  }
  const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [orders[0].id]);
  return mapOrderRow(orders[0], items);
}

async function findOrderByReference(reference, phone) {
  const order = await getOrderById(reference);
  if (!order) return null;
  if (normalizePhone(order.phone) !== normalizePhone(phone)) return null;
  return order;
}

async function getUserOrders(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT o.*, u.email AS customer_email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.user_id = ? ORDER BY o.created_at DESC",
    [userId],
  );

  if (!rows.length) return [];
  const orderIds = rows.map(r => r.id);
  const [allItems] = await pool.query(
    "SELECT * FROM order_items WHERE order_id IN (" + orderIds.map(() => '?').join(', ') + ")",
    orderIds
  );
  const itemsByOrderId = {};
  for (const item of allItems) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push(item);
  }
  return rows.map(row => mapOrderRow(row, itemsByOrderId[row.id] || []));
}

async function listAllOrders(status) {
  const pool = getPool();
  let sql = `SELECT o.*, u.email AS customer_email
             FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
  const params = [];
  if (status && status !== "all") {
    sql += " WHERE o.status = ?";
    params.push(status);
  }
  sql += " ORDER BY o.created_at DESC";

  const [rows] = await pool.query(sql, params);
  if (!rows.length) return [];
  const orderIds = rows.map(r => r.id);
  const [allItems] = await pool.query(
    "SELECT * FROM order_items WHERE order_id IN (" + orderIds.map(() => '?').join(', ') + ")",
    orderIds
  );
  const itemsByOrderId = {};
  for (const item of allItems) {
    if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
    itemsByOrderId[item.order_id].push(item);
  }
  return rows.map(row => mapOrderRow(row, itemsByOrderId[row.id] || []));
}

async function updateOrderStatus(orderId, nextStatus) {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const normalized = normalizeOrderStatus(nextStatus);
  if (!canTransitionTo(order.status, normalized)) {
    const error = new Error("Invalid status transition.");
    error.statusCode = 400;
    throw error;
  }

  const pool = getPool();
  try {
    // Decrement stock when order is approved and delivered
    if (normalized === ORDER_STATUS.APPROVED_DELIVERED && order.status !== ORDER_STATUS.APPROVED_DELIVERED) {
      for (const item of order.items || []) {
        if (item.productId) {
          await pool.query(
            "UPDATE products SET stock_qty = stock_qty - ? WHERE id = ? AND stock_qty >= ?",
            [item.quantity, item.productId, item.quantity]
          );
        }
      }
    }

    // Restore stock when order is returned after delivery
    if (normalized === ORDER_STATUS.RETURNED_AFTER_DELIVERY && order.status === ORDER_STATUS.APPROVED_DELIVERED) {
      for (const item of order.items || []) {
        if (item.productId) {
          await pool.query(
            "UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?",
            [item.quantity, item.productId]
          );
        }
      }
    }

    await pool.query(
      "UPDATE orders SET status = ?, status_updated_at = datetime('now') WHERE external_id = ? OR id = ?",
      [normalized, order.id, order.dbId ?? 0],
    );

    return getOrderById(order.id);
  } catch (err) {
    throw err;
  }
}

async function deleteOrder(orderId) {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const pool = getPool();
  try {
    // Delete order items first
    await pool.query("DELETE FROM order_items WHERE order_id = ?", [order.dbId ?? order.id]);
    
    // Delete the order
    await pool.query("DELETE FROM orders WHERE id = ?", [order.dbId ?? order.id]);
    
    return { success: true };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  createGuestOrder,
  createOrder,
  getOrderById,
  findOrderByReference,
  getUserOrders,
  listAllOrders,
  updateOrderStatus,
  deleteOrder,
};
