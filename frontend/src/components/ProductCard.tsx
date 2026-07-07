import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { wishlistApi } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import type { Product } from "@/lib/catalog";
import { useLanguage } from "@/lib/language";
import PromoCountdown from "@/components/PromoCountdown";

const getLocalizedBadge = (label: string, t: any) => {
  const lower = label.toLowerCase();
  if (lower.startsWith("exclusive")) return label;
  if (lower === "bestseller" || lower === "best-seller") return t("bestseller");
  if (lower === "sale" || lower === "promo") return t("sale");
  if (lower === "new") return t("new");
  if (lower === "premium") return t("premium");
  return label;
};

/** Generic book/pen placeholder shown when a product image fails to load */
function ImagePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-muted-gray text-outline gap-2 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-12 h-12 opacity-40"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="12" y1="7" x2="16" y2="7" />
        <line x1="12" y1="11" x2="16" y2="11" />
        <line x1="12" y1="15" x2="14" y2="15" />
      </svg>
      <span className="text-[11px] font-medium tracking-wider uppercase opacity-50">Image indisponible</span>
    </div>
  );
}

export function TrendingCard({ product }: { product: Product }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const buyNow = async () => {
    await add(product);
    navigate("/checkout");
  };

  return (
    <div className="flex flex-col group cursor-pointer">
      <Link
        to={`/product/${product.slug}`}
        className="relative w-full aspect-square bg-muted-gray rounded-lg border border-outline-variant mb-3 overflow-hidden flex items-center justify-center"
      >
        {/* Orange badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded z-10">
            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
          </div>
        )}

        {/* Promo countdown */}
        {product.promotionEndDate && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-oxford-red/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md">
              <PromoCountdown endDate={product.promotionEndDate} />
            </div>
          </div>
        )}
        
        {/* Shopping cart icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            add(product);
          }}
          className="absolute bottom-2 left-2 bg-white rounded-full p-2 shadow-md z-10 hover:bg-gray-100 transition-colors"
          type="button"
        >
          <ShoppingCart className="w-4 h-4 text-academic-blue" />
        </button>

        {imgError || !product.image ? (
          <ImagePlaceholder />
        ) : (
          <img
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={product.image}
            onError={() => setImgError(true)}
          />
        )}
      </Link>
      <Link
        to={`/product/${product.slug}`}
        className="text-[14px] text-academic-blue mb-2 line-clamp-2 group-hover:text-oxford-red transition-colors font-medium"
      >
        {product.title}
      </Link>
      <div className="flex items-center gap-2">
        {product.originalPrice && (
          <span className="text-[12px] text-on-surface-variant line-through">
            {formatPrice(product.originalPrice, product.currency ?? "DT")}
          </span>
        )}
        <span className="text-[16px] font-bold text-oxford-red">
          {formatPrice(product.price, product.currency ?? "DT")}
        </span>
      </div>
    </div>
  );
}

export function CatalogCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [imgError, setImgError] = useState(false);

  const buyNow = async () => {
    await add(product);
    navigate("/checkout");
  };

  const toggleWishlist = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!currentUser) {
      toast.error("Please sign in to use the wishlist.");
      return;
    }
    try {
      await wishlistApi.toggle(product.id);
      toast.success("Wishlist updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update wishlist");
    }
  };

  return (
    <div className="group flex flex-col bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-academic-blue transition-colors">
      {/* Image wrapper */}
      <div className="relative bg-muted-gray aspect-square w-full overflow-hidden flex items-center justify-center">
        {/* Wishlist button — absolutely positioned */}
        <button
          aria-label="Add to wishlist"
          className="absolute top-2 right-2 z-10 p-1.5 bg-surface/80 backdrop-blur-sm rounded-full text-on-surface-variant hover:text-oxford-red transition-colors"
          onClick={toggleWishlist}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">favorite</span>
        </button>
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {imgError || !product.image ? (
            <ImagePlaceholder />
          ) : (
            <img
              alt={product.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              src={product.image}
              onError={() => setImgError(true)}
            />
          )}
        </Link>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        {product.brand && (
          <span className="text-[11px] text-on-surface-variant mb-1 uppercase tracking-wider font-medium">
            {product.brand}
          </span>
        )}
        <Link
          to={`/product/${product.slug}`}
          className="text-[14px] text-academic-blue font-semibold mb-2 line-clamp-2 leading-tight"
        >
          {product.title}
        </Link>
        <div className="mt-auto flex flex-col gap-1">
          {product.originalPrice && (
            <span className="text-[11px] text-on-surface-variant line-through">
              {formatPrice(product.originalPrice, product.currency ?? "DT")}
            </span>
          )}
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <span className="font-headline text-[20px] font-bold text-oxford-red">
                {formatPrice(product.price, product.currency ?? "DT")}
              </span>
              {product.originalPrice && (
                <span className="text-[11px] font-bold text-oxford-red bg-oxford-red/10 px-1.5 py-0.5 rounded">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => add(product)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-outline-variant px-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-academic-blue transition-colors hover:bg-surface-container"
              type="button"
            >
              {t("addToCart")}
            </button>
            <button
              onClick={buyNow}
              className="inline-flex h-9 items-center justify-center rounded-md bg-oxford-red px-2 text-[10px] font-semibold uppercase tracking-[0.05em] text-white transition-opacity hover:opacity-90"
              type="button"
            >
              {t("checkout")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
