import { useState, useEffect, useCallback } from "react";
import { adminApi, productsApi } from "@/lib/api";
import { Trash2, Edit2, Plus, GripVertical } from "lucide-react";

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    productIds: [],
    order: 1,
    is_active: true,
  });

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getHomepageSections();
      setSections(response.data?.items ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await productsApi.getAll({ limit: 100 });
      setProducts(response.data?.items ?? []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  useEffect(() => {
    loadSections();
    loadProducts();
  }, [loadSections, loadProducts]);

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      productIds: [],
      order: sections.length + 1,
      is_active: true,
    });
    setProductSearch("");
    setEditingId(null);
  };

  const handleEdit = (section) => {
    setFormData({
      title: section.title || "",
      slug: section.slug || "",
      description: section.description || "",
      productIds: section.productIds || [],
      order: section.order || 1,
      is_active: section.is_active !== undefined ? section.is_active : true,
    });
    setProductSearch("");
    setEditingId(section.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        productIds: formData.productIds,
        order: formData.order,
        is_active: formData.is_active,
      };

      if (editingId) {
        await adminApi.updateHomepageSection(editingId, payload);
      } else {
        await adminApi.createHomepageSection(payload);
      }

      await loadSections();
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error("Error submitting section:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      await adminApi.deleteHomepageSection(id);
      await loadSections();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleProductSelection = (productId) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter((id) => id !== productId)
        : [...prev.productIds, productId],
    }));
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Homepage Sections
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Manage product sections displayed on the home page.
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Section"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-[14px] text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-outline-variant bg-surface p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., Best Sellers"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., best-sellers"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-academic-blue">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
              rows="2"
              placeholder="Section description..."
            />
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-academic-blue">
              Order
            </label>
            <input
              type="number"
              min="1"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
            />
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-academic-blue mb-2">
              Products ({formData.productIds.length} selected)
            </label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="mb-2 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
            />
            <div className="max-h-96 overflow-y-auto rounded-md border border-outline-variant bg-surface p-3">
              {products.length === 0 ? (
                <p className="text-[14px] text-on-surface-variant">No products available</p>
              ) : (
                <div className="space-y-2">
                  {products
                    .filter((product) =>
                      product.title.toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-muted-gray p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.productIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 rounded border-outline-variant"
                        />
                        <span className="flex-1 text-[13px] text-academic-blue">{product.title}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-outline-variant"
              />
              <span className="text-[13px] font-semibold text-academic-blue">Active</span>
            </label>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              {editingId ? "Update Section" : "Create Section"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="flex-1 rounded-md border border-outline-variant px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="mt-6 text-on-surface-variant">Loading sections...</p>}

      {!loading && sections.length === 0 && !showForm && (
        <div className="mt-8 rounded-xl border border-outline-variant bg-surface p-8 text-center">
          <p className="text-[16px] text-on-surface-variant">No sections yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-block text-[13px] text-oxford-red"
          >
            Create your first section
          </button>
        </div>
      )}

      {!loading && sections.length > 0 && (
        <div className="mt-6 space-y-3">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div
                key={section.id}
                className="rounded-xl border border-outline-variant bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-on-surface-variant mt-1" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-headline text-[16px] font-semibold text-academic-blue">
                          {section.title}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                            section.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {section.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[11px] text-on-surface-variant bg-muted-gray px-2 py-1 rounded">
                          Order: {section.order}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-on-surface-variant">
                        Slug: {section.slug}
                      </p>
                      {section.description && (
                        <p className="mt-1 text-[13px] text-on-surface-variant">
                          {section.description}
                        </p>
                      )}
                      <p className="mt-2 text-[12px] text-on-surface-variant">
                        {section.productIds?.length || 0} products
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(section)}
                      className="rounded-md border border-outline-variant p-2 text-academic-blue transition-colors hover:bg-muted-gray"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(section.id)}
                      className="rounded-md border border-outline-variant p-2 text-oxford-red transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
