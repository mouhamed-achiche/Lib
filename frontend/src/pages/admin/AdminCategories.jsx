import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, categoriesApi } from "@/lib/api";

const emptyForm = { name: "", slug: "", description: "" };

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let loadedCategories = [];
    let apiSuccess = false;

    const token = window.localStorage.getItem("ibn_sina_token");
    if (token) {
      try {
        const response = await adminApi.getCategories();
        loadedCategories = response.data?.items ?? [];
        apiSuccess = true;
      } catch (error) {
        console.warn("Could not load categories from API, falling back to local data:", error);
      }
    }

    if (!apiSuccess) {
      try {
        const pubCatRes = await categoriesApi.getAll().catch(() => null);
        if (pubCatRes && pubCatRes.data?.items) {
          loadedCategories = pubCatRes.data.items.map((c) => ({
            id: String(c.id || c.slug),
            name: c.name,
            slug: c.slug,
            description: c.description || "",
          }));
          apiSuccess = true;
        }

        if (!apiSuccess) {
          const catalog = await import("@/lib/catalog");
          const localCategories = catalog.categories || [];
          loadedCategories = localCategories.map((c) => ({
            id: c.slug,
            name: c.name,
            slug: c.slug,
            description: "",
          }));
        }
      } catch (err) {
        console.error("Local categories fallback failed:", err);
      }
    }

    setItems(loadedCategories);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? "",
      description: category.description ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, form);
        toast.success("Category updated");
      } else {
        await adminApi.createCategory(form);
        toast.success("Category created");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return;
    try {
      await adminApi.deleteCategory(category.id);
      toast.success("Category deleted");
      if (editingId === category.id) resetForm();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete category");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Manage Categories
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Organize shop catalogs by categories.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue"
            onClick={load}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
      </div>

      {showForm && (
        <form
          className="mt-6 rounded-xl border border-outline-variant bg-surface p-5"
          onSubmit={handleSubmit}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-lg font-semibold text-academic-blue">
              {editingId ? "Edit category" : "New category"}
            </h2>
            <button
              aria-label="Close form"
              className="rounded-full p-1 text-on-surface-variant hover:bg-muted-gray"
              onClick={resetForm}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                Name
              </span>
              <input
                className="mt-1 h-10 w-full rounded-md border border-outline-variant px-3 text-[14px] outline-none focus:border-academic-blue"
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                required
                type="text"
                value={form.name}
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
              className="rounded-md bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create category"}
            </button>
            <button
              className="rounded-md border border-outline-variant px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant"
              onClick={resetForm}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="mt-8">
        {loading ? (
          <p className="text-on-surface-variant">Loading categories...</p>
        ) : items.length ? (
          <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface">
            <table className="min-w-full text-left text-[14px]">
              <thead className="border-b border-outline-variant bg-muted-gray/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Name</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Slug</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Description</th>
                  <th className="px-4 py-3 font-semibold text-academic-blue">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((category) => (
                  <tr key={category.id} className="border-b border-outline-variant last:border-0">
                    <td className="px-4 py-3 font-medium text-academic-blue">{category.name}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{category.slug}</td>
                    <td className="max-w-xs px-4 py-3 text-on-surface-variant">
                      {category.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue"
                          onClick={() => startEdit(category)}
                          type="button"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-oxford-red/30 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-oxford-red"
                          onClick={() => handleDelete(category)}
                          type="button"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-on-surface-variant">No categories yet. Add your first category above.</p>
        )}
      </section>
    </div>
  );
}
