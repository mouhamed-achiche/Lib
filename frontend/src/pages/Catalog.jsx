import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CatalogCard } from "@/components/ProductCard";
import { CatalogCardSkeleton } from "@/components/ProductCardSkeleton";
import { categories } from "@/lib/catalog";
import { productsApi } from "@/lib/api";
import SortDropdown from "@/components/SortDropdown";
import { withExclusiveOffers } from "@/lib/productOffers";
import { useLanguage } from "@/lib/language";

const SORT_OPTIONS = [
  { value: "featured", labelKey: "sortFeatured" },
  { value: "relevant", labelKey: "sortRelevant" },
  { value: "bestseller", labelKey: "sortBestseller" },
  { value: "alpha-asc", labelKey: "sortAlphaAsc" },
  { value: "alpha-desc", labelKey: "sortAlphaDesc" },
  { value: "price-low", labelKey: "sortPriceLow" },
  { value: "price-high", labelKey: "sortPriceHigh" },
  { value: "date-asc", labelKey: "sortDateAsc" },
  { value: "date-desc", labelKey: "sortDateDesc" },
];


const DEFAULT_CATEGORY = "all";

export default function Catalog() {
  const { categorySlug } = useParams();
  const { t } = useLanguage();
  const activeCategory = categorySlug ?? DEFAULT_CATEGORY;
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // Filter states
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState({ inStock: false, outOfStock: false });

  // Sidebar accordions open states
  const [isOpenMarque, setIsOpenMarque] = useState(true);
  const [isOpenPrice, setIsOpenPrice] = useState(true);
  const [isOpenAvailability, setIsOpenAvailability] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", activeCategory],
    retry: false,
    queryFn: async () => {
      const params = activeCategory === DEFAULT_CATEGORY ? { limit: 2000 } : { category: activeCategory, limit: 2000 };
      const { data } = await productsApi.getAll(params);
      return withExclusiveOffers(data.items);
    },
    initialData: [],
  });

  const products = productsQuery.data ?? [];

  // Category and search filtered products (before sidebar brand/price/availability filtering)
  const allCategorySearchProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === "all" || product.categorySlug === activeCategory;
      const matchesSearch = !search.trim() || product.title.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  // Brand facets based on allCategorySearchProducts
  const brandFacets = useMemo(() => {
    const counts = allCategorySearchProducts.reduce((acc, product) => {
      const b = product.brand || "Other";
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allCategorySearchProducts]);

  // Availability facets based on allCategorySearchProducts
  const availabilityFacets = useMemo(() => {
    let inStockCount = 0;
    let outOfStockCount = 0;
    allCategorySearchProducts.forEach((product) => {
      if ((product.stock ?? 0) > 0) {
        inStockCount++;
      } else {
        outOfStockCount++;
      }
    });
    return { inStockCount, outOfStockCount };
  }, [allCategorySearchProducts]);

  // Max price based on allCategorySearchProducts
  const maxProductPrice = useMemo(() => {
    if (allCategorySearchProducts.length === 0) return 0;
    return Math.max(...allCategorySearchProducts.map((p) => p.price));
  }, [allCategorySearchProducts]);

  const sortFunctions = useMemo(() => ({
    "price-low": (a, b) => a.price - b.price,
    "price-high": (a, b) => b.price - a.price,
    "relevant": (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    "bestseller": (a, b) => {
      const aBest = a.badge?.label?.toLowerCase() === "bestseller" ? 1 : 0;
      const bBest = b.badge?.label?.toLowerCase() === "bestseller" ? 1 : 0;
      if (aBest !== bBest) return bBest - aBest;
      return (b.rating ?? 0) - (a.rating ?? 0);
    },
    "alpha-asc": (a, b) => a.title.localeCompare(b.title),
    "alpha-desc": (a, b) => b.title.localeCompare(a.title),
    "date-asc": (a, b) => (a.createdAt || a.id).localeCompare(b.createdAt || b.id),
    "date-desc": (a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id),
    "featured": (a, b) => {
      const aFeat = a.featured ? 1 : 0;
      const bFeat = b.featured ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return (b.rating ?? 0) - (a.rating ?? 0);
    },
  }), []);

  // Final visible products
  const visibleProducts = useMemo(() => {
    let items = allCategorySearchProducts.filter((product) => {
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand || "Other");
      const priceVal = product.price;
      const matchesMinPrice = minPrice === "" || priceVal >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || priceVal <= parseFloat(maxPrice);
      const isInStock = (product.stock ?? 0) > 0;
      let matchesAvailability = true;
      if (availability.inStock && !availability.outOfStock) {
        matchesAvailability = isInStock;
      } else if (!availability.inStock && availability.outOfStock) {
        matchesAvailability = !isInStock;
      }
      return matchesBrand && matchesMinPrice && matchesMaxPrice && matchesAvailability;
    });

    const sortFn = sortFunctions[sortBy];
    if (sortFn) {
      items = [...items].sort(sortFn);
    }

    return items;
  }, [allCategorySearchProducts, selectedBrands, minPrice, maxPrice, availability, sortBy, sortFunctions]);

  const handleBrandChange = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setAvailability({ inStock: false, outOfStock: false });
  };

  const categoryTitle =
    categories.find((category) => category.slug === activeCategory)?.name ?? t("allProducts");

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="py-8">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          <Link to="/" className="hover:text-academic-blue">
            {t("home")}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-academic-blue">{categoryTitle}</span>
        </div>
        <h1 className="mt-3 font-headline text-3xl font-bold tracking-tight text-academic-blue">
          {categoryTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-[16px] text-on-surface-variant">
          {t("browseSelection")}
        </p>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl border border-outline-variant bg-surface p-4 md:grid-cols-[1fr_auto_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
          placeholder={t("searchProducts")}
          type="search"
        />
        <SortDropdown
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS.map(opt => ({ ...opt, label: t(opt.labelKey) }))}
        />
        <button
          onClick={handleResetFilters}
          className="inline-flex h-11 items-center justify-center rounded-md border border-outline-variant px-4 text-[14px] font-medium text-academic-blue transition-colors hover:bg-surface-container cursor-pointer"
        >
          {t("reset")}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          {/* Category List */}
          <div className="rounded-xl border border-outline-variant bg-surface p-4">
            <h2 className="font-headline text-[18px] font-semibold text-academic-blue">{t("categories")}</h2>
            <div className="mt-3 space-y-1">
              <Link
                to="/catalog"
                className={`block rounded-md px-3 py-1.5 text-[14px] transition-colors hover:bg-surface-container ${activeCategory === "all" ? "bg-surface-container font-semibold text-academic-blue" : "text-on-surface-variant"
                  }`}
              >
                {t("allProducts")}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  to={category.to}
                  className={`block rounded-md px-3 py-1.5 text-[14px] transition-colors hover:bg-surface-container ${activeCategory === category.slug ? "bg-surface-container font-semibold text-academic-blue" : "text-on-surface-variant"
                    }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Filter Sidebar container */}
          <div className="rounded-xl border border-outline-variant bg-surface p-4 text-[14px] text-on-surface-variant">
            {/* Total count */}
            <div className="text-[16px] text-academic-blue font-medium pb-4">
              {visibleProducts.length} {visibleProducts.length === 1 ? t("product") : t("products")}
            </div>

            <hr className="border-t border-outline-variant mb-4" />

            {/* Marque Section */}
            <div>
              <button
                onClick={() => setIsOpenMarque(!isOpenMarque)}
                className="flex w-full items-center justify-between font-bold text-academic-blue py-1"
              >
                <span>{t("brand")}</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenMarque ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpenMarque && (
                <div className="mt-3 space-y-2.5">
                  {(showAllBrands ? brandFacets : brandFacets.slice(0, 5)).map((brand) => (
                    <label key={brand.name} className="flex items-center justify-between cursor-pointer select-none">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.name)}
                          onChange={() => handleBrandChange(brand.name)}
                          className="h-4.5 w-4.5 rounded border border-outline-variant bg-surface accent-academic-blue focus:ring-0"
                        />
                        <span>{brand.name}</span>
                      </div>
                      <span className="text-[12px] text-on-surface-variant/70">{brand.count}</span>
                    </label>
                  ))}
                  {brandFacets.length > 5 && (
                    <button
                      onClick={() => setShowAllBrands(!showAllBrands)}
                      className="block text-[13px] font-semibold text-academic-blue underline mt-2 cursor-pointer"
                    >
                      {showAllBrands ? t("showLess") : t("showAll")}
                    </button>
                  )}
                </div>
              )}
            </div>

            <hr className="border-t border-outline-variant my-4" />

            {/* Price Section */}
            <div>
              <button
                onClick={() => setIsOpenPrice(!isOpenPrice)}
                className="flex w-full items-center justify-between font-bold text-academic-blue py-1"
              >
                <span>{t("price")}</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenPrice ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpenPrice && (
                <div className="mt-3 space-y-4">
                  <div className="flex items-start justify-between text-[13px] text-on-surface-variant/80">
                    <span className="leading-tight">
                      {t("highestPrice")} {maxProductPrice.toFixed(3)} {t("currency")}
                    </span>
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="text-academic-blue underline font-semibold cursor-pointer shrink-0"
                    >
                      {t("reset")}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder={`${t("from")} ${t("currency")}`}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full h-10 rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue placeholder:text-on-surface-variant/50"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder={`${t("to")} ${t("currency")}`}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full h-10 rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue placeholder:text-on-surface-variant/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <hr className="border-t border-outline-variant my-4" />

            {/* Availability Section */}
            <div>
              <button
                onClick={() => setIsOpenAvailability(!isOpenAvailability)}
                className="flex w-full items-center justify-between font-bold text-academic-blue py-1"
              >
                <span>{t("availability")}</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenAvailability ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpenAvailability && (
                <div className="mt-3 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={availability.inStock}
                        onChange={() => setAvailability((prev) => ({ ...prev, inStock: !prev.inStock }))}
                        className="h-4.5 w-4.5 rounded border border-outline-variant bg-surface accent-academic-blue focus:ring-0"
                      />
                      <span>{t("inStock")}</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant/70">
                      {availabilityFacets.inStockCount}
                    </span>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={availability.outOfStock}
                        onChange={() => setAvailability((prev) => ({ ...prev, outOfStock: !prev.outOfStock }))}
                        className="h-4.5 w-4.5 rounded border border-outline-variant bg-surface accent-academic-blue focus:ring-0 animate-fade-in"
                      />
                      <span>{t("outOfStock")}</span>
                    </div>
                    <span className="text-[12px] text-on-surface-variant/70">
                      {availabilityFacets.outOfStockCount}
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] text-on-surface-variant">
              {productsQuery.isLoading ? t("loadingProducts") : `${t("showingProducts")} ${visibleProducts.length} ${t("products")}`}
            </p>
            <p className="text-[14px] text-on-surface-variant">
              {t("category")}: <span className="text-academic-blue">{categoryTitle}</span>
            </p>
          </div>

          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CatalogCardSkeleton key={i} />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              {t("noProductsMatch")}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <CatalogCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
