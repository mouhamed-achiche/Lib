import { useState, useEffect, useCallback } from "react";
import { adminApi, productsApi, categoriesApi } from "@/lib/api";
import { Trash2, Edit2, Plus, RefreshCw, X, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  title: "",
  subtitle: "",
  image_url: "",
  linkType: "none", // none, product, category, custom
  linkTarget: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bannersRes, productsRes, categoriesRes] = await Promise.all([
        adminApi.getBanners(),
        adminApi.getProducts({ limit: 1000 }).catch(() => ({ data: { items: [] } })),
        adminApi.getCategories().catch(() => ({ data: { items: [] } })),
      ]);

      setBanners(bannersRes.data?.items ?? []);
      setProducts(productsRes.data?.items ?? []);
      setCategories(categoriesRes.data?.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (banner) => {
    // Parse link to determine linkType and linkTarget
    let type = "none";
    let target = "";

    if (banner.link) {
      if (banner.link.startsWith("/product/")) {
        type = "product";
        target = banner.link.replace("/product/", "");
      } else if (banner.link.startsWith("/catalog/")) {
        type = "category";
        target = banner.link.replace("/catalog/", "");
      } else {
        type = "custom";
        target = banner.link;
      }
    }

    setFormData({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      image_url: banner.image_url ?? "",
      linkType: type,
      linkTarget: target,
      sort_order: banner.sort_order ?? 0,
      is_active: banner.is_active ?? true,
    });
    setEditingId(banner.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url.trim()) {
      toast.error("Photo URL is required.");
      return;
    }

    setSaving(true);

    // Compute direct link string
    let finalLink = "";
    if (formData.linkType === "product" && formData.linkTarget) {
      finalLink = `/product/${formData.linkTarget}`;
    } else if (formData.linkType === "category" && formData.linkTarget) {
      finalLink = `/catalog/${formData.linkTarget}`;
    } else if (formData.linkType === "custom" && formData.linkTarget) {
      finalLink = formData.linkTarget;
    }

    const payload = {
      title: formData.title.trim() || null,
      subtitle: formData.subtitle.trim() || null,
      image_url: formData.image_url.trim(),
      link: finalLink || null,
      sort_order: Number(formData.sort_order ?? 0),
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        await adminApi.updateBanner(editingId, payload);
        toast.success("Banner updated successfully");
      } else {
        await adminApi.createBanner(payload);
        toast.success("Banner created successfully");
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await adminApi.deleteBanner(id);
      toast.success("Banner deleted successfully");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete banner");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Homepage Banners
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Manage the promo bar slider images, links, and text.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue cursor-pointer"
            onClick={loadData}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData(emptyForm);
              setShowForm(!showForm);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white cursor-pointer"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Banner"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-outline-variant bg-surface p-6 animate-fade-in"
        >
          <h2 className="font-headline text-lg font-semibold text-academic-blue mb-4">
            {editingId ? "Edit Banner" : "New Banner Slide"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Title (Optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                placeholder="e.g., UP TO 50% OFF"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Subtitle (Optional)
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                placeholder="e.g., Premium Skincare Collection"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              Photo URL *
            </label>
            <input
              type="text"
              required
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
              placeholder="e.g., https://example.com/banner.jpg"
            />
            {formData.image_url && (
              <div className="mt-2 rounded-lg border border-outline-variant overflow-hidden max-h-40 max-w-lg bg-muted-gray">
                <img
                  src={formData.image_url}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Link Type
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData({ ...formData, linkType: e.target.value, linkTarget: "" })}
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
              >
                <option value="none">None</option>
                <option value="product">Link to Product</option>
                <option value="category">Link to Category</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>

            <div>
              {formData.linkType === "product" && (
                <>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    Target Product
                  </label>
                  <select
                    value={formData.linkTarget}
                    required
                    onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                  >
                    <option value="">Select a Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.title || p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {formData.linkType === "category" && (
                <>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    Target Category
                  </label>
                  <select
                    value={formData.linkTarget}
                    required
                    onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {formData.linkType === "custom" && (
                <>
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                    Custom Destination URL
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.linkTarget}
                    onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                    placeholder="e.g., /shop or https://external.com"
                  />
                </>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue bg-surface"
                placeholder="0"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant accent-academic-blue"
                />
                <span className="text-[14px] font-semibold text-academic-blue">Active (Show on Homepage)</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60 cursor-pointer"
            >
              {saving ? "Saving..." : editingId ? "Update Banner" : "Create Banner"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 rounded-md border border-outline-variant px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="mt-6 text-on-surface-variant">Loading banners...</p>
      ) : banners.length === 0 ? (
        <div className="mt-8 rounded-xl border border-outline-variant bg-surface p-8 text-center">
          <p className="text-[16px] text-on-surface-variant">No banners configured yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-block text-[13px] text-oxford-red font-semibold hover:underline cursor-pointer"
          >
            Create your first homepage slide
          </button>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-outline-variant bg-surface">
          <table className="min-w-full text-left text-[14px]">
            <thead className="border-b border-outline-variant bg-muted-gray/60">
              <tr>
                <th className="px-4 py-3 font-semibold text-academic-blue">Photo</th>
                <th className="px-4 py-3 font-semibold text-academic-blue">Details</th>
                <th className="px-4 py-3 font-semibold text-academic-blue">Link</th>
                <th className="px-4 py-3 font-semibold text-academic-blue">Order</th>
                <th className="px-4 py-3 font-semibold text-academic-blue">Status</th>
                <th className="px-4 py-3 font-semibold text-academic-blue">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => {
                let linkLabel = "None";
                if (banner.link) {
                  if (banner.link.startsWith("/product/")) linkLabel = `Product: ${banner.link.replace("/product/", "")}`;
                  else if (banner.link.startsWith("/catalog/")) linkLabel = `Category: ${banner.link.replace("/catalog/", "")}`;
                  else linkLabel = banner.link;
                }

                return (
                  <tr key={banner.id} className="border-b border-outline-variant last:border-0 hover:bg-muted-gray/10">
                    <td className="px-4 py-3">
                      <div className="h-12 w-24 rounded overflow-hidden border border-outline-variant bg-muted-gray shrink-0">
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title || "Banner"}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <ImageIcon className="h-full w-full p-2 text-on-surface-variant/40" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-academic-blue">{banner.title || "—"}</div>
                      {banner.subtitle && <div className="text-[12px] text-on-surface-variant mt-0.5">{banner.subtitle}</div>}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-[13px]">
                      <div className="flex items-center gap-1.5 max-w-[200px] truncate" title={banner.link}>
                        {banner.link ? (
                          <>
                            <LinkIcon className="h-3 w-3 shrink-0 text-academic-blue/60" />
                            <span>{linkLabel}</span>
                          </>
                        ) : (
                          <span className="text-on-surface-variant/40">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant font-medium">
                      {banner.sort_order}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          banner.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue cursor-pointer hover:bg-muted-gray/20"
                          onClick={() => handleEdit(banner)}
                          type="button"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-oxford-red/30 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-oxford-red cursor-pointer hover:bg-red-50"
                          onClick={() => handleDelete(banner.id)}
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
