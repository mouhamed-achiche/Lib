import type { Product, ProductBadge } from "@/lib/catalog";

const DEFAULT_OFFER_PERCENT = 20;

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function discountPercent(price: number, originalPrice: number) {
  if (originalPrice <= 0 || price >= originalPrice) return DEFAULT_OFFER_PERCENT;
  return Math.max(1, Math.round(((originalPrice - price) / originalPrice) * 100));
}

function promoBadge(percent: number): ProductBadge {
  return {
    label: `Exclusive -${percent}%`,
    tone: "red",
  };
}

export function withExclusiveOffer<T extends Record<string, any>>(product: T): T & Product {
  const salePrice = product.sale_price != null ? toNumber(product.sale_price) : null;
  const currentPrice = salePrice ?? toNumber(product.price);
  const existingOriginalPrice =
    product.originalPrice != null
      ? toNumber(product.originalPrice)
      : product.original_price != null
        ? toNumber(product.original_price)
        : null;
  const originalPrice =
    existingOriginalPrice && existingOriginalPrice > currentPrice
      ? existingOriginalPrice
      : null;
  const percent = originalPrice ? discountPercent(currentPrice, originalPrice) : 0;

  return {
    ...product,
    id: String(product.id ?? product.slug),
    slug: String(product.slug ?? product.id),
    title: String(product.title ?? product.name ?? ""),
    price: currentPrice,
    originalPrice,
    currency: product.currency ?? "DT",
    image: product.image ?? product.image_url ?? "",
    categorySlug: product.categorySlug ?? product.category_slug ?? null,
    brand: product.brand ?? product.brand_name ?? null,
    featured: Boolean(product.featured ?? product.is_featured),
    offerPercent: percent,
  } as T & Product;
}

export function withExclusiveOffers<T extends Record<string, any>>(products: T[] = []) {
  return products.map(withExclusiveOffer);
}
