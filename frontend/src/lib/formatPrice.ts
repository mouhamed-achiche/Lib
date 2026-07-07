export function formatPrice(value: number | string | null | undefined, currency = "DT") {
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(2)} ${currency}`;
}

export function effectivePrice(product: {
  price: number;
  sale_price?: number | null;
  originalPrice?: number | null;
}) {
  if (product.sale_price != null) return Number(product.sale_price);
  if (product.originalPrice != null && product.originalPrice < product.price) {
    return Number(product.originalPrice);
  }
  return Number(product.price);
}
