import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, brandsApi, productsApi, categoriesApi } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  price: "",
  originalPrice: "",
  promotionType: "none",
  promotionValue: "",
  promotionEndDate: "",
  promotionEndDateEnabled: false,
  stock: "",
  available: true,
  categorySlug: "",
  brandId: "",
  image: "",
};

function normalizeProduct(product) {
  return {
    id: String(product.id),
    slug: product.slug ?? "",
    title: product.title ?? product.name ?? "Untitled",
    description: product.description ?? "",
    price: Number(product.price ?? 0),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    salePrice: product.sale_price ? Number(product.sale_price) : null,
    stock: Number(product.stock ?? product.stock_qty ?? 0),
    available: product.available !== undefined ? Boolean(product.available) : (Number(product.stock ?? product.stock_qty ?? 0) > 0),
    categorySlug: product.categorySlug ?? product.category_slug ?? "",
    categoryName: product.category_name ?? product.categorySlug ?? "—",
    categoryId: product.category_id ? String(product.category_id) : "",
    brand: product.brand ?? product.brand_name ?? "",
    brandId: product.brandId ?? product.brand_id ? String(product.brandId ?? product.brand_id) : "",
    brandSlug: product.brandSlug ?? product.brand_slug ?? "",
    image: product.image ?? product.image_url ?? "",
    promotionEndDate: product.promotionEndDate ?? product.promotion_end_date ?? null,
    promotionType: product.promotionType ?? product.promotion_type ?? "none",
  };
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState({ inStock: false, outOfStock: false });

  // Sidebar accordions open states
  const [isOpenCategories, setIsOpenCategories] = useState(true);
  const [isOpenMarque, setIsOpenMarque] = useState(true);
  const [isOpenPrice, setIsOpenPrice] = useState(true);
  const [isOpenAvailability, setIsOpenAvailability] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // New Brand State
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);

  const handleAddNewBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Brand name cannot be empty.");
      return;
    }
    setAddingBrand(true);
    try {
      const response = await adminApi.createBrand({ name: newBrandName.trim() });
      const createdBrand = response.data?.item;
      if (createdBrand) {
        toast.success(`Brand "${createdBrand.name}" added successfully.`);
        setBrands((prev) => [...prev, createdBrand]);
        setForm((prev) => ({ ...prev, brandId: String(createdBrand.id) }));
        setNewBrandName("");
        setShowNewBrandInput(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add brand");
    } finally {
      setAddingBrand(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        id: String(category.id),
        slug: category.slug,
        name: category.name,
      })),
    [categories],
  );

  const load = useCallback(async () => {
    setLoading(true);
    let loadedProducts = [];
    let loadedCategories = [];
    let loadedBrands = [];
    let apiSuccess = false;

    const token = window.localStorage.getItem("ibn_sina_token");
    if (token) {
      try {
        const [productsResponse, categoriesResponse, brandsResponse] = await Promise.all([
          adminApi.getProducts(),
          adminApi.getCategories(),
          brandsApi.getAll().catch(() => ({ data: { items: [] } })),
        ]);
        loadedProducts = (productsResponse.data?.items ?? []).map((item) => normalizeProduct(item));
        loadedCategories = categoriesResponse.data?.items ?? [];
        loadedBrands = brandsResponse.data?.items ?? [];
        apiSuccess = true;
      } catch (error) {
        console.warn("Could not load products from API, falling back to local data:", error);
      }
    }

    if (!apiSuccess) {
      try {
        // First try to fetch from public endpoints so we get all 71 products/categories
        const [pubProdRes, pubCatRes] = await Promise.all([
          productsApi.getAll({ limit: 2000 }).catch(() => null),
          categoriesApi.getAll().catch(() => null),
        ]);

        if (pubProdRes && pubProdRes.data?.items) {
          loadedProducts = pubProdRes.data.items.map((item) => normalizeProduct(item));
          apiSuccess = true;
        }

        if (pubCatRes && pubCatRes.data?.items) {
          loadedCategories = pubCatRes.data.items.map((c) => ({
            id: String(c.id || c.slug),
            name: c.name,
            slug: c.slug,
          }));
        }

        // If even public API failed, fall back to local file
        if (!apiSuccess) {
          const catalog = await import("@/lib/catalog");
          const localProducts = catalog.products || [];
          const localCategories = catalog.categories || [];
          
          loadedProducts = localProducts.map((item) => normalizeProduct(item));
          loadedCategories = localCategories.map((c) => ({
            id: c.slug,
            name: c.name,
            slug: c.slug,
          }));
        }

        // Extract unique brands from loaded products
        const uniqueBrands = [...new Set(loadedProducts.map((p) => p.brand).filter(Boolean))].map((name, index) => ({
          id: String(index + 1),
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        }));
        loadedBrands = uniqueBrands;
      } catch (err) {
        console.error("Public API fallback / local data fallback failed:", err);
      }
    }

    setProducts(loadedProducts);
    setCategories(loadedCategories);
    setBrands(loadedBrands);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.categorySlug && categoryOptions.length) {
      setForm((prev) => ({ ...prev, categorySlug: categoryOptions[0].slug }));
    }
  }, [categoryOptions, form.categorySlug]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      categorySlug: categoryOptions[0]?.slug ?? "",
      brandId: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    const originalPrice = product.originalPrice || product.price;
    const salePrice = product.sale_price || product.salePrice || null;
    
    let promotionType = product.promotionType || "none";
    let promotionValue = "";
    
    if (salePrice && salePrice < originalPrice) {
      const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
      promotionValue = String(discountPercent);
    }

    setForm({
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: String(originalPrice),
      originalPrice: "",
      promotionType: promotionType,
      promotionValue: promotionValue,
      promotionEndDate: product.promotionEndDate || "",
      promotionEndDateEnabled: Boolean(product.promotionEndDate),
      stock: String(product.stock),
      available: product.available !== undefined ? product.available : (product.stock > 0),
      categorySlug: product.categorySlug || categoryOptions[0]?.slug || "",
      brandId: product.brandId || "",
      image: product.image,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Product name is required.");
      return;
    }

    const selectedCategory = categoryOptions.find((item) => item.slug === form.categorySlug);
    const originalPrice = Number(form.price);
    let salePrice = null;

    if (form.promotionType === "originalPrice" && form.promotionValue) {
      salePrice = Number(form.promotionValue);
    } else if (form.promotionType === "percentage" && form.promotionValue) {
      const discountPercent = Number(form.promotionValue);
      if (discountPercent > 0 && originalPrice > 0) {
        salePrice = Number((originalPrice * (1 - discountPercent / 100)).toFixed(2));
      }
    }

    const payload = {
      title: form.title.trim(),
      name: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      price: originalPrice,
      sale_price: salePrice,
      original_price: originalPrice,
      stock: Number(form.stock || 0),
      stock_qty: Number(form.stock || 0),
      available: Boolean(form.available),
      categorySlug: form.categorySlug,
      category_id: selectedCategory?.id,
      brand_id: form.brandId ? Number(form.brandId) : null,
      brandId: form.brandId ? String(form.brandId) : null,
      image: form.image.trim(),
      image_url: form.image.trim(),
      promotionEndDate: form.promotionEndDateEnabled ? form.promotionEndDate || null : null,
      promotion_end_date: form.promotionEndDateEnabled ? form.promotionEndDate || null : null,
      promotionType: form.promotionType,
      promotion_type: form.promotionType,
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateProduct(editingId, payload);
        toast.success("Product updated");
      } else {
        await adminApi.createProduct(payload);
        toast.success("Product created");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.title}"?`)) return;
    try {
      await adminApi.deleteProduct(product.id);
      toast.success("Product deleted");
      if (editingId === product.id) resetForm();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete product");
    }
  };

  const handleBrandChange = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName) ? prev.filter((b) => b !== brandName) : [...prev, brandName]
    );
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategorySlug("all");
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setAvailability({ inStock: false, outOfStock: false });
  };

  // Filtration logic
  const allCategorySearchProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategorySlug === "all" || product.categorySlug === selectedCategorySlug;
      const matchesSearch =
        !search.trim() ||
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.slug.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategorySlug, search]);

  const brandFacets = useMemo(() => {
    const counts = {};
    allCategorySearchProducts.forEach((product) => {
      const b = product.brand || "Other";
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allCategorySearchProducts]);

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

  const maxProductPrice = useMemo(() => {
    if (allCategorySearchProducts.length === 0) return 0;
    return Math.max(...allCategorySearchProducts.map((p) => p.price));
  }, [allCategorySearchProducts]);

  const visibleProducts = useMemo(() => {
    return allCategorySearchProducts.filter((product) => {
      // Brand filter
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand || "Other");

      // Price filter
      const priceVal = product.price;
      const matchesMinPrice = minPrice === "" || priceVal >= parseFloat(minPrice);
      const matchesMaxPrice = maxPrice === "" || priceVal <= parseFloat(maxPrice);

      // Availability filter
      const isInStock = (product.stock ?? 0) > 0;
      let matchesAvailability = true;
      if (availability.inStock && !availability.outOfStock) {
        matchesAvailability = isInStock;
      } else if (!availability.inStock && availability.outOfStock) {
        matchesAvailability = !isInStock;
      }

      return matchesBrand && matchesMinPrice && matchesMaxPrice && matchesAvailability;
    });
  }, [allCategorySearchProducts, selectedBrands, minPrice, maxPrice, availability]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Manage Products
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Add, edit, or remove catalog items.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue cursor-pointer"
            onClick={load}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white cursor-pointer"
            onClick={() => {
              setEditingId(null);
              setForm({
                ...emptyForm,
                categorySlug: categoryOptions[0]?.slug ?? "",
                brandId: "",
              });
              setShowForm(true);
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add product
          </button>
        </div>
      </div>

      {showForm && (
        <form
          className="mt-6 rounded-xl border border-outline-variant bg-surface p-5 animate-fade-in"
          onSubmit={handleSubmit}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-lg font-semibold text-academic-blue">
              {editingId ? "Edit product" : "New product"}
            </h2>
            <button
              aria-label="Close form"
              className="rounded-full p-1 text-on-surface-variant hover:bg-muted-gray cursor-pointer"
              onClick={resetForm}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Title
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                required
                type="text"
                value={form.title}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Slug
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="auto-generated if empty"
                type="text"
                value={form.slug}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Category
              </span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, categorySlug: event.target.value }))
                }
                required
                value={form.categorySlug}
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="block">
              <div className="flex justify-between items-center">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                  Brand
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewBrandInput(!showNewBrandInput)}
                  className="text-[12px] text-academic-blue font-semibold hover:underline cursor-pointer"
                >
                  {showNewBrandInput ? "Cancel" : "+ Add new brand"}
                </button>
              </div>
              
              {!showNewBrandInput ? (
                <select
                  className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, brandId: event.target.value }))
                  }
                  value={form.brandId}
                >
                  <option value="">No brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="New brand name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                  />
                  <button
                    type="button"
                    disabled={addingBrand}
                    onClick={handleAddNewBrand}
                    className="h-10 px-4 rounded-md bg-academic-blue text-white text-[12px] font-semibold uppercase tracking-[0.08em] disabled:opacity-60 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Price (DT)
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                min="0"
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                required
                step="0.01"
                type="number"
                value={form.price}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Promotion Type
              </span>
              <select
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, promotionType: event.target.value, promotionValue: "" }));
                }}
                value={form.promotionType}
              >
                <option value="none">No Promotion</option>
                <option value="originalPrice">Price After Promotion</option>
                <option value="percentage">Percentage Discount</option>
              </select>
            </label>
            {form.promotionType === "originalPrice" && (
              <label className="block">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                  Sale Price (DT)
                </span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                  min="0"
                  onChange={(event) => setForm((prev) => ({ ...prev, promotionValue: event.target.value }))}
                  placeholder="Enter sale price"
                  step="0.01"
                  type="number"
                  value={form.promotionValue}
                />
              </label>
            )}
            {form.promotionType === "percentage" && (
              <label className="block">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                  Discount Percentage (%)
                </span>
                <input
                  className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                  min="1"
                  max="99"
                  onChange={(event) => setForm((prev) => ({ ...prev, promotionValue: event.target.value }))}
                  placeholder="Enter discount percentage"
                  step="1"
                  type="number"
                  value={form.promotionValue}
                />
              </label>
            )}
            {(form.promotionType === "originalPrice" || form.promotionType === "percentage") && (
              <>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    checked={form.promotionEndDateEnabled}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, promotionEndDateEnabled: event.target.checked }))
                    }
                    type="checkbox"
                    className="accent-academic-blue"
                  />
                  <span className="text-[14px] text-on-surface-variant">Enable Promotion End Date</span>
                </label>
                {form.promotionEndDateEnabled && (
                  <label className="block">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Promotion End Date
                    </span>
                    <input
                      className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                      onChange={(event) => setForm((prev) => ({ ...prev, promotionEndDate: event.target.value }))}
                      type="datetime-local"
                      value={form.promotionEndDate}
                    />
                  </label>
                )}
              </>
            )}
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Stock
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                min="0"
                onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                type="number"
                value={form.stock}
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={form.available}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, available: event.target.checked }))
                }
                type="checkbox"
                className="accent-academic-blue"
              />
              <span className="text-[14px] text-on-surface-variant">Available</span>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Image URL
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                type="url"
                value={form.image}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Description
              </span>
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-outline-variant px-3 py-2 text-[14px] outline-none focus:border-academic-blue"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                value={form.description}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-md bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60 cursor-pointer"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create product"}
            </button>
            <button
              className="rounded-md border border-outline-variant px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant cursor-pointer"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Filters Sidebar + Products List */}
      <div className="grid gap-8 lg:grid-cols-[260px_1fr] mt-8">
        <aside className="space-y-6">
          {/* Filter Sidebar Container */}
          <div className="rounded-xl border border-outline-variant bg-surface p-4 text-[14px] text-on-surface-variant">
            
            {/* Search Input inside sidebar */}
            <div className="mb-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue block mb-1">
                Search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
                placeholder="Search name/slug..."
                type="search"
              />
            </div>

            {/* Total Count & Reset button */}
            <div className="flex items-center justify-between pb-4">
              <span className="text-[16px] text-academic-blue font-medium">
                {visibleProducts.length} {visibleProducts.length === 1 ? "produit" : "produits"}
              </span>
              <button
                onClick={handleResetFilters}
                className="text-[12px] font-semibold text-oxford-red hover:underline cursor-pointer"
              >
                Reset all
              </button>
            </div>

            <hr className="border-t border-outline-variant mb-4" />

            {/* Categories Section */}
            <div>
              <button
                onClick={() => setIsOpenCategories(!isOpenCategories)}
                className="flex w-full items-center justify-between font-bold text-academic-blue py-1"
              >
                <span>Category</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenCategories ? "expand_less" : "expand_more"}
                </span>
              </button>
              {isOpenCategories && (
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => setSelectedCategorySlug("all")}
                    className={`block w-full text-left rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-surface-container ${
                      selectedCategorySlug === "all" ? "bg-surface-container font-semibold text-academic-blue" : "text-on-surface-variant"
                    }`}
                  >
                    All categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.slug}
                      onClick={() => setSelectedCategorySlug(category.slug)}
                      className={`block w-full text-left rounded-md px-3 py-1.5 text-[13px] transition-colors hover:bg-surface-container ${
                        selectedCategorySlug === category.slug ? "bg-surface-container font-semibold text-academic-blue" : "text-on-surface-variant"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-t border-outline-variant my-4" />

            {/* Marque Section */}
            <div>
              <button
                onClick={() => setIsOpenMarque(!isOpenMarque)}
                className="flex w-full items-center justify-between font-bold text-academic-blue py-1"
              >
                <span>Marque</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenMarque ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpenMarque && (
                <div className="mt-3 space-y-2.5">
                  {brandFacets.length === 0 ? (
                    <span className="text-[12px] text-on-surface-variant/60">No brands found</span>
                  ) : (
                    (showAllBrands ? brandFacets : brandFacets.slice(0, 5)).map((brand) => (
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
                    ))
                  )}
                  {brandFacets.length > 5 && (
                    <button
                      onClick={() => setShowAllBrands(!showAllBrands)}
                      className="block text-[13px] font-semibold text-academic-blue underline mt-2 cursor-pointer text-left"
                    >
                      {showAllBrands ? "Show less" : "Show all"}
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
                <span>Price</span>
                <span className="material-symbols-outlined text-[20px]">
                  {isOpenPrice ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isOpenPrice && (
                <div className="mt-3 space-y-4">
                  <div className="flex items-start justify-between text-[13px] text-on-surface-variant/80">
                    <span className="leading-tight">
                      Le prix le plus élevé est de {maxProductPrice.toFixed(3)}
                    </span>
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="text-academic-blue underline font-semibold cursor-pointer shrink-0"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="De د.ت"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full h-10 rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue placeholder:text-on-surface-variant/50"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="À د.ت"
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
                <span>Availability</span>
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
                      <span>En stock</span>
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
                        className="h-4.5 w-4.5 rounded border border-outline-variant bg-surface accent-academic-blue focus:ring-0"
                      />
                      <span>En rupture de stock</span>
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

        <section className="space-y-4">
          {loading ? (
            <p className="text-on-surface-variant">Loading products...</p>
          ) : visibleProducts.length ? (
            visibleProducts.map((product) => (
              <article
                key={product.id}
                className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface p-4 sm:flex-row sm:items-center animate-fade-in hover:shadow-sm transition-shadow"
              >
                <img
                  alt={product.title}
                  className="h-20 w-20 rounded-md border border-outline-variant object-cover shrink-0"
                  src={
                    product.image ||
                    "https://images.unsplash.com/photo-1512820790801-83ca734da794?auto=format&fit=crop&w=200&q=80"
                  }
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold text-academic-blue truncate">{product.title}</h2>
                  <p className="mt-1 text-[13px] text-on-surface-variant">
                    {product.categoryName} {product.brand ? `· Brand: ${product.brand}` : ""} · {product.slug}
                  </p>
                  <p className="mt-2 text-[14px] text-on-surface-variant">
                    {formatPrice(product.price)} · Stock: {product.stock}
                    {product.featured ? " · Featured" : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue cursor-pointer"
                    onClick={() => startEdit(product)}
                    type="button"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-oxford-red/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-oxford-red cursor-pointer"
                    onClick={() => handleDelete(product)}
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-on-surface-variant text-center py-12">
              No products found matching the search or filters.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
