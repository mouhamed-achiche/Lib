import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/formatPrice";
import { withExclusiveOffer, withExclusiveOffers } from "@/lib/productOffers";
import PromoCountdown from "@/components/PromoCountdown.tsx";

export default function ProductDetail() {
  const { slug } = useParams();
  const { add } = useCart();
  const navigate = useNavigate();

  const productQuery = useQuery({
    queryKey: ["product", slug],
    retry: false,
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await productsApi.getBySlug(slug);
      return withExclusiveOffer(data.item);
    },
    enabled: Boolean(slug),
  });

  const product = productQuery.data ?? null;

  const relatedQuery = useQuery({
    queryKey: ["related-products", product?.categorySlug, product?.slug],
    retry: false,
    queryFn: async () => {
      if (!product?.categorySlug) return [];
      const { data } = await productsApi.getAll({ category: product.categorySlug, limit: 5 });
      return withExclusiveOffers(data.items).filter((item) => item.slug !== product.slug).slice(0, 4);
    },
    enabled: Boolean(product?.categorySlug),
  });

  const related = relatedQuery.data ?? [];

  if (!slug) {
    return null;
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="py-12 text-center text-on-surface-variant">This product could not be found.</div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="py-8">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <Link to="/catalog" className="hover:text-academic-blue">
            Catalog
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-academic-blue">{product.title}</span>
        </div>
      </div>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface">
          <img alt={product.title} className="h-full w-full object-cover" src={product.image} />
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            {product.brand ?? "IBN SINA Collection"}
          </p>
          <h1 className="mt-3 font-headline text-3xl font-bold tracking-tight text-academic-blue">
            {product.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-on-surface-variant">
            {product.description ?? "A clean, practical piece selected for the IBN SINA catalog."}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <span className="font-headline text-3xl font-bold text-academic-blue">
              {formatPrice(product.price, product.currency ?? "DT")}
            </span>
            {product.originalPrice ? (
              <span className="text-[14px] text-on-surface-variant line-through">
                {formatPrice(product.originalPrice, product.currency ?? "DT")}
              </span>
            ) : null}
            {product.badge ? (
              <span className="rounded bg-oxford-red px-2 py-1 text-[11px] font-bold uppercase text-white">
                {product.badge.label}
              </span>
            ) : null}
          </div>

          {product.promotionEndDate && (
            <div className="mt-4 rounded-xl bg-gradient-to-r from-oxford-red via-red-600 to-red-700 px-6 py-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <span className="material-symbols-outlined text-white text-2xl">local_offer</span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Limited Time Offer</p>
                    <p className="text-white/80 text-sm">Don't miss out on this deal!</p>
                  </div>
                </div>
                <PromoCountdown endDate={product.promotionEndDate} />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => add(product)}
              className="inline-flex items-center justify-center rounded-md bg-oxford-red px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
              type="button"
            >
              Add to cart
            </button>
            <button
              onClick={() => {
                add(product);
                navigate("/checkout");
              }}
              className="inline-flex items-center justify-center rounded-md border border-outline-variant px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-academic-blue transition-colors hover:bg-surface-container"
              type="button"
            >
              Buy now
            </button>
          </div>

          <div className="mt-8 grid gap-3 rounded-xl border border-outline-variant bg-surface p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">Stock</p>
              <p className="mt-1 text-[16px] font-semibold text-academic-blue">{product.stock ?? 0} available</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">Category</p>
              <p className="mt-1 text-[16px] font-semibold text-academic-blue">{product.categorySlug ?? "general"}</p>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-headline text-2xl font-semibold text-academic-blue">Related items</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <Link key={item.slug} to={`/product/${item.slug}`} className="rounded-xl border border-outline-variant p-3">
                <img alt={item.title} className="aspect-square w-full rounded-md object-cover" src={item.image} />
                <p className="mt-3 text-[14px] font-semibold text-academic-blue">{item.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
