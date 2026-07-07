/** Map MySQL rows to API shapes used by the frontend. */

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    createdAt: row.created_at,
  };
}

function mapCategoryRow(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon ?? null,
    parentId: row.parent_id ? String(row.parent_id) : null,
    parentName: row.parent_name ?? null,
    sortOrder: row.sort_order ?? 0,
  };
}

function mapBrandRow(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    logoUrl: row.logo_url ?? null,
  };
}

function mapProductRow(row, images = []) {
  const price = Number(row.price);
  const salePrice = row.sale_price != null ? Number(row.sale_price) : null;
  const originalPrice = row.original_price != null ? Number(row.original_price) : null;
  const badge = row.badge && row.badge !== "none" ? row.badge : null;

  return {
    id: String(row.id),
    slug: row.slug,
    title: row.name,
    name: row.name,
    description: row.description ?? "",
    price,
    sale_price: salePrice,
    originalPrice: originalPrice,
    currency: "DT",
    image: row.image_url ?? "",
    image_url: row.image_url ?? "",
    categoryId: row.category_id ? String(row.category_id) : null,
    categorySlug: row.category_slug ?? null,
    categoryName: row.category_name ?? null,
    brandId: row.brand_id ? String(row.brand_id) : null,
    brandSlug: row.brand_slug ?? null,
    brand: row.brand_name ?? null,
    brand_name: row.brand_name ?? null,
    stock: row.stock_qty ?? 0,
    stock_qty: row.stock_qty ?? 0,
    promotionEndDate: row.promotion_end_date ?? null,
    promotionType: row.promotion_type ?? "none",
    badge: badge
      ? {
          label: badge === "in_stock" ? "In Stock" : badge.charAt(0).toUpperCase() + badge.slice(1),
          tone: badge === "sale" || badge === "bestseller" ? "red" : "muted",
        }
      : null,
    images: images.map((img) => ({
      id: String(img.id),
      url: img.image_url,
      alt: img.alt_text ?? "",
      sortOrder: img.sort_order ?? 0,
    })),
  };
}

function mapOrderRow(row, items = []) {
  return {
    id: row.external_id ?? `order-${row.id}`,
    dbId: row.id,
    orderNumber: row.order_number,
    customerId: row.user_id ? String(row.user_id) : null,
    userId: row.user_id ? String(row.user_id) : null,
    customerName: row.shipping_name ?? "",
    phone: row.shipping_phone ?? "",
    address: row.shipping_address ?? "",
    shippingAddress: row.shipping_address ?? "",
    notes: row.notes ?? "",
    status: row.status,
    statusUpdatedAt: row.status_updated_at ?? row.updated_at ?? row.created_at,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping_cost ?? 0),
    total: Number(row.total),
    createdAt: row.created_at,
    customerEmail: row.customer_email ?? null,
    items: items.map((item) => ({
      id: String(item.id),
      productId: item.product_id ? String(item.product_id) : null,
      name: item.product_name,
      image: item.product_img ?? "",
      price: Number(item.unit_price),
      quantity: item.quantity,
      total: Number(item.subtotal),
    })),
  };
}

module.exports = {
  mapUserRow,
  mapCategoryRow,
  mapBrandRow,
  mapProductRow,
  mapOrderRow,
};
