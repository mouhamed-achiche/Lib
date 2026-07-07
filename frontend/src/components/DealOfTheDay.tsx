import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/formatPrice";

interface DealOfTheDayData {
  id: string;
  title: string;
  ref: string;
  description: string;
  originalPrice: number;
  discount: string;
  salePrice: number;
  expiryTimestamp: string;
  image?: string;
  slug: string;
  currency?: string;
  stock?: number;
}

interface DealOfTheDayProps {
  deals?: DealOfTheDayData[];
  loading?: boolean;
}

export default function DealOfTheDay({ deals = [], loading }: DealOfTheDayProps) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, min: 0, sec: 0 });
  const [isExpired, setIsExpired] = useState(false);

  const deal = deals[currentDealIndex] || null;

  useEffect(() => {
    if (!deal) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(deal.expiryTimestamp).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, min: 0, sec: 0 });
        return;
      }

      setIsExpired(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, min: minutes, sec: seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deal]);

  const handleAddToCart = async () => {
    if (!deal) return;
    await add({
      id: deal.id,
      title: deal.title,
      price: deal.salePrice,
      originalPrice: deal.originalPrice,
      image: deal.image,
      slug: deal.slug,
      currency: deal.currency,
      stock: deal.stock,
    } as any);
  };

  const handleBuyNow = async () => {
    if (!deal) return;
    await handleAddToCart();
    navigate("/checkout");
  };

  if (loading) {
    return (
      <section className="mb-10 rounded-xl border border-outline-variant bg-surface p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted-gray rounded mb-4 w-48"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square bg-muted-gray rounded"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted-gray rounded"></div>
              <div className="h-4 bg-muted-gray rounded w-3/4"></div>
              <div className="h-20 bg-muted-gray rounded"></div>
              <div className="h-12 bg-muted-gray rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loading || !deals || deals.length === 0) {
    return null;
  }

  const isOutOfStock = deal.stock !== undefined && deal.stock <= 0;
  const isDisabled = isExpired || isOutOfStock;

  return (
    <section className="mb-10 rounded-xl border border-outline-variant bg-surface overflow-hidden">
      {/* Section Header */}
      <div className="bg-oxford-red px-4 py-3 flex items-center justify-between">
        <h2 className="font-headline text-[18px] font-bold uppercase tracking-[0.12em] text-white">
          Deal of the Day
        </h2>
        <span className="bg-white text-oxford-red text-[10px] font-bold px-2 py-1 rounded">
          ELU PRODUIT 2026
        </span>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image Section */}
          <div className="relative">
            <div className="relative aspect-square bg-muted-gray rounded-lg overflow-hidden">
              {deal.image ? (
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full text-outline">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-16 h-16 opacity-40"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span className="text-[11px] font-medium tracking-wider uppercase opacity-50 mt-2">
                    Image indisponible
                  </span>
                </div>
              )}

              {/* Navigation Arrows */}
              {deals.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                    onClick={() => setCurrentDealIndex((prev) => (prev === 0 ? deals.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="w-5 h-5 text-academic-blue" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                    onClick={() => setCurrentDealIndex((prev) => (prev === deals.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="w-5 h-5 text-academic-blue" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Title */}
              <h3 className="font-headline text-[24px] md:text-[28px] font-bold text-academic-blue mb-2">
                {deal.title}
              </h3>

              {/* Reference/SKU */}
              <p className="text-[12px] text-on-surface-variant mb-3">
                Ref: {deal.ref}
              </p>

              {/* Description */}
              <p className="text-[14px] text-on-surface mb-4 leading-relaxed">
                {deal.description}
              </p>

              {/* Pricing Block */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {deal.originalPrice > deal.salePrice && (
                    <span className="text-[16px] text-on-surface-variant line-through">
                      {formatPrice(deal.originalPrice, deal.currency ?? "DT")}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-oxford-red bg-oxford-red/10 px-2 py-1 rounded">
                    {deal.discount}
                  </span>
                </div>
                <p className="font-headline text-[32px] font-bold text-oxford-red">
                  {formatPrice(deal.salePrice, deal.currency ?? "DT")}
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="mb-6">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant mb-2">
                  Offer ends in:
                </p>
                <div className="flex gap-2 md:gap-3">
                  <div className="flex-1 bg-surface-container rounded-lg p-2 md:p-3 text-center">
                    <p className="font-headline text-[20px] md:text-[24px] font-bold text-academic-blue">
                      {String(timeLeft.days).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Day
                    </p>
                  </div>
                  <div className="flex-1 bg-surface-container rounded-lg p-2 md:p-3 text-center">
                    <p className="font-headline text-[20px] md:text-[24px] font-bold text-academic-blue">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Hours
                    </p>
                  </div>
                  <div className="flex-1 bg-surface-container rounded-lg p-2 md:p-3 text-center">
                    <p className="font-headline text-[20px] md:text-[24px] font-bold text-academic-blue">
                      {String(timeLeft.min).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Min
                    </p>
                  </div>
                  <div className="flex-1 bg-surface-container rounded-lg p-2 md:p-3 text-center">
                    <p className="font-headline text-[20px] md:text-[24px] font-bold text-academic-blue">
                      {String(timeLeft.sec).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Sec
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="space-y-2">
              <button
                onClick={handleBuyNow}
                disabled={isDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] transition-opacity ${
                  isDisabled
                    ? "bg-muted-gray text-on-surface-variant cursor-not-allowed"
                    : "bg-oxford-red text-white hover:opacity-90"
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {isOutOfStock ? "Out of Stock" : isExpired ? "Offer Expired" : "Add to Cart"}
              </button>
              {isOutOfStock && (
                <p className="text-center text-[12px] text-oxford-red">
                  This product is currently out of stock
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
