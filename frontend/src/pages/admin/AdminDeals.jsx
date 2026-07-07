import { useState, useEffect, useCallback } from "react";
import { adminApi, productsApi } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import { Trash2, Edit2, Plus } from "lucide-react";

export default function AdminDeals() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    title: "",
    ref: "",
    description: "",
    originalPrice: "",
    discount: "",
    salePrice: "",
    expiryTimestamp: "",
    is_active: true,
  });

  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDeals();
      setDeals(response.data?.items ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data?.items ?? []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  useEffect(() => {
    loadDeals();
    loadProducts();
  }, [loadDeals, loadProducts]);

  const resetForm = () => {
    setFormData({
      productId: "",
      title: "",
      ref: "",
      description: "",
      originalPrice: "",
      discount: "",
      salePrice: "",
      expiryTimestamp: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (deal) => {
    setFormData({
      productId: deal.productId || "",
      title: deal.title || "",
      ref: deal.ref || "",
      description: deal.description || "",
      originalPrice: String(deal.originalPrice || ""),
      discount: deal.discount || "",
      salePrice: String(deal.salePrice || ""),
      expiryTimestamp: deal.expiryTimestamp?.split("T")[0] || "",
      is_active: deal.is_active !== undefined ? deal.is_active : true,
    });
    setEditingId(deal.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        productId: formData.productId,
        title: formData.title,
        ref: formData.ref,
        description: formData.description,
        originalPrice: Number(formData.originalPrice),
        discount: formData.discount,
        salePrice: Number(formData.salePrice),
        expiryTimestamp: formData.expiryTimestamp,
        is_active: formData.is_active,
      };

      if (editingId) {
        await adminApi.updateDeal(editingId, payload);
      } else {
        await adminApi.createDeal(payload);
      }

      await loadDeals();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    try {
      await adminApi.deleteDeal(id);
      await loadDeals();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        title: product.title,
        ref: product.ref || product.id,
        description: product.description || "",
        originalPrice: String(product.originalPrice || product.price || ""),
        salePrice: String(product.price || ""),
      });
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Deal of the Day
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Manage daily promotional deals with countdown timers.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) resetForm();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "New Deal"}
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
                Product *
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Reference
              </label>
              <input
                type="text"
                value={formData.ref}
                onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., 20317"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-academic-blue">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
              placeholder="e.g., SHOWER BODY LOTION MIRACLE"
            />
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
              placeholder="Product description..."
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Original Price *
              </label>
              <input
                type="number"
                required
                step="0.001"
                min="0"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., 18.900"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Discount Badge *
              </label>
              <input
                type="text"
                required
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., -11%"
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Sale Price *
              </label>
              <input
                type="number"
                required
                step="0.001"
                min="0"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
                placeholder="e.g., 16.900"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-semibold text-academic-blue">
                Expiry Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.expiryTimestamp}
                onChange={(e) => setFormData({ ...formData, expiryTimestamp: e.target.value })}
                className="mt-1 w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-[14px]"
              />
            </div>
            <div className="flex items-end">
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
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              {editingId ? "Update Deal" : "Create Deal"}
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

      {loading && (
        <p className="mt-6 text-on-surface-variant">Loading deals...</p>
      )}

      {!loading && deals.length === 0 && !showForm && (
        <div className="mt-8 rounded-xl border border-outline-variant bg-surface p-8 text-center">
          <p className="text-[16px] text-on-surface-variant">No deals yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-block text-[13px] text-oxford-red"
          >
            Create your first deal
          </button>
        </div>
      )}

      {!loading && deals.length > 0 && (
        <div className="mt-6 space-y-3">
          {deals.map((deal) => {
            const now = new Date();
            const expiry = new Date(deal.expiryTimestamp);
            const isExpired = expiry < now;
            const isActive = deal.is_active && !isExpired;

            return (
              <div
                key={deal.id}
                className="rounded-xl border border-outline-variant bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-headline text-[16px] font-semibold text-academic-blue">
                        {deal.title}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          isExpired
                            ? "bg-red-100 text-red-700"
                            : isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {isExpired ? "Expired" : isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {deal.ref && (
                      <p className="mt-1 text-[13px] text-on-surface-variant">Ref: {deal.ref}</p>
                    )}
                    {deal.description && (
                      <p className="mt-1 text-[13px] text-on-surface-variant">{deal.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
                      <span className="text-academic-blue">
                        Original: {formatPrice(deal.originalPrice, "DT")}
                      </span>
                      <span className="text-academic-blue font-bold text-oxford-red">
                        {deal.discount}
                      </span>
                      <span className="text-academic-blue font-bold text-oxford-red">
                        Sale: {formatPrice(deal.salePrice, "DT")}
                      </span>
                      <span className="text-academic-blue">
                        Expires: {new Date(deal.expiryTimestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(deal)}
                      className="rounded-md border border-outline-variant p-2 text-academic-blue transition-colors hover:bg-muted-gray"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      className="rounded-md border border-outline-variant p-2 text-oxford-red transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
