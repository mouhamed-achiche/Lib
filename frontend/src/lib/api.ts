type ApiRecord = Record<string, string | number | boolean | null | undefined>;
type ApiRequestInit = Omit<RequestInit, "body"> & {
  params?: ApiRecord;
  body?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const TOKEN_KEY = "ibn_sina_token";

export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const payload = await response.json();
      return payload.data?.ok === true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getCsrfToken(): Promise<string | null> {
  try {
    // First, fetch the CSRF token endpoint to set the cookie
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    // Then read the CSRF token from cookie
    const match = document.cookie.match(/_csrf=([^;]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function toQueryString(params?: ApiRecord) {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function request<T>(path: string, init: ApiRequestInit = {}) {
  const { params, headers, body, method = 'GET', ...rest } = init;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const hasBody = body != null;

  // Get CSRF token for state-changing requests (except login/register)
  let csrfToken: string | null = null;
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS' && 
      !path.includes('/login') && !path.includes('/register')) {
    csrfToken = await getCsrfToken();
  }

  // GET and HEAD requests cannot have a body according to HTTP spec
  const shouldIncludeBody = hasBody && method !== 'GET' && method !== 'HEAD';

  const response = await fetch(`${API_BASE_URL}${path}${toQueryString(params)}`, {
    ...rest,
    method,
    headers: {
      ...(shouldIncludeBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(headers ?? {}),
    },
    credentials: 'include',
    body: shouldIncludeBody && typeof body !== "string"
      ? JSON.stringify(body)
      : (shouldIncludeBody ? (body as BodyInit | null | undefined) : undefined),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiEnvelope<T>)
    : null;

  if (!response.ok) {
    if (response.status === 401) {
      if (token) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent("auth-unauthorized"));
      }
      // Don't force a hard redirect here — let the AuthProvider and
      // route guards handle navigation so we don't yank users off
      // protected pages during background API calls.
    }
    const error = new Error(payload?.message ?? `Request failed with status ${response.status}`);
    (error as any).response = { data: payload };
    throw error;
  }

  return payload as ApiEnvelope<T>;
}

export const authApi = {
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    city?: string;
  }) => request<{ token: string; user: unknown }>("/auth/register", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: unknown }>("/auth/login", { method: "POST", body: data }),
  getMe: () => request<{ user: unknown }>("/auth/me"),
  updateMe: (data: Record<string, unknown>) =>
    request<{ user: unknown }>("/auth/me", { method: "PATCH", body: data }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ user: unknown }>("/auth/change-password", { method: "PATCH", body: data }),
};

export const productsApi = {
  getAll: (params?: ApiRecord) =>
    request<{ items: unknown[]; total: number }>("/products", { params }),
  getFeatured: (limit = 4) =>
    request<{ items: unknown[]; total: number }>("/products/featured", { params: { limit } }),
  getBestSelling: (limit = 4) =>
    request<{ items: unknown[]; total: number }>("/products/best-selling", { params: { limit } }),
  search: (q: string) =>
    request<{ items: unknown[]; total: number }>("/products/search", { params: { q } }),
  getBySlug: (slug: string) => request<{ item: unknown }>(`/products/${slug}`),
};

export const categoriesApi = {
  getAll: () => request<{ items: unknown[] }>("/categories"),
  getBySlug: (slug: string) => request<{ item: unknown }>(`/categories/${slug}`),
};

export const brandsApi = {
  getAll: () => request<{ items: unknown[] }>("/brands"),
};

export const cartApi = {
  getCart: () => request<{ items: unknown[]; summary: unknown }>("/cart"),
  addItem: (data: { productId: string; quantity?: number }) =>
    request<{ items: unknown[]; summary: unknown }>("/cart/items", { method: "POST", body: data }),
  updateItem: (itemId: string, quantity: number) =>
    request<{ items: unknown[]; summary: unknown }>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    }),
  removeItem: (itemId: string) =>
    request<{ items: unknown[]; summary: unknown }>(`/cart/items/${itemId}`, { method: "DELETE" }),
  clearCart: () => request<{ items: unknown[]; summary: unknown }>("/cart", { method: "DELETE" }),
};

export const ordersApi = {
  placeOrder: (data: { items?: unknown[]; shippingAddress?: string; notes?: string }) =>
    request<{ order: unknown }>("/orders", { method: "POST", body: data }),
  placeGuestOrder: (data: {
    customerName: string;
    phone: string;
    address: string;
    notes?: string;
    items: unknown[];
  }) => request<{ order: unknown }>("/orders/guest", { method: "POST", body: data }),
  trackOrder: (data: { reference: string; phone: string }) =>
    request<{ order: unknown }>("/orders/track", { method: "POST", body: data }),
  getUserOrders: () => request<{ items: unknown[] }>("/orders"),
  getOrder: (id: string) => request<{ order: unknown }>(`/orders/${id}`),
};

export const wishlistApi = {
  getWishlist: () => request<{ items: unknown[] }>("/wishlist"),
  toggle: (productId: string) =>
    request<{ items: unknown[] }>(`/wishlist/${productId}`, { method: "POST" }),
  remove: (productId: string) =>
    request<{ items: unknown[] }>(`/wishlist/${productId}`, { method: "DELETE" }),
};

export const newsletterApi = {
  subscribe: (email: string) =>
    request<{ subscriber: unknown }>("/newsletter", { method: "POST", body: { email } }),
};

export const bannersApi = {
  getActive: () => request<{ items: unknown[] }>("/banners/active"),
};

export const dealsApi = {
  getActive: () => request<{ deal: unknown | null }>("/deals/active"),
};



export const adminApi = {
  getStats: (params?: ApiRecord) => request<Record<string, unknown>>("/admin/stats", { params }),
  getProducts: (params?: ApiRecord) =>
    request<{ items: unknown[]; total: number }>("/admin/products", { params }),
  createProduct: (data: Record<string, unknown>) =>
    request<{ item: unknown }>("/admin/products", { method: "POST", body: data }),
  updateProduct: (id: string, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/admin/products/${id}`, { method: "PATCH", body: data }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/admin/products/${id}`, { method: "DELETE" }),
  getCategories: () => request<{ items: unknown[] }>("/admin/categories"),
  createCategory: (data: Record<string, unknown>) =>
    request<{ item: unknown }>("/admin/categories", { method: "POST", body: data }),
  updateCategory: (id: string, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/admin/categories/${id}`, { method: "PATCH", body: data }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/admin/categories/${id}`, { method: "DELETE" }),
  getBanners: () => request<{ items: unknown[] }>("/admin/banners"),
  createBanner: (data: Record<string, unknown>) =>
    request<{ item: unknown }>("/admin/banners", { method: "POST", body: data }),
  updateBanner: (id: string, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/admin/banners/${id}`, { method: "PATCH", body: data }),
  deleteBanner: (id: string) =>
    request<{ success: boolean }>(`/admin/banners/${id}`, { method: "DELETE" }),
  getOrders: (params?: ApiRecord) => request<{ items: unknown[] }>("/admin/orders", { params }),
  updateOrderStatus: (id: string, status: string) =>
    request<{ order: unknown }>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  deleteOrder: (id: string) =>
    request<{ success: boolean }>(`/admin/orders/${id}`, { method: "DELETE" }),
  getUsers: () => request<{ items: unknown[] }>("/admin/users"),
  updateUserRole: (id: string, role: string) =>
    request<{ user: unknown }>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  createBrand: (data: Record<string, unknown>) =>
    request<{ item: { id: string; name: string; slug: string } }>("/admin/brands", { method: "POST", body: data }),
  getDeals: () => request<{ items: unknown[] }>("/admin/deals"),
  createDeal: (data: Record<string, unknown>) =>
    request<{ item: unknown }>("/admin/deals", { method: "POST", body: data }),
  updateDeal: (id: string, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/admin/deals/${id}`, { method: "PATCH", body: data }),
  deleteDeal: (id: string) =>
    request<{ success: boolean }>(`/admin/deals/${id}`, { method: "DELETE" }),
  getHomepageSections: () => request<{ items: unknown[] }>("/admin/homepage-sections"),
  createHomepageSection: (data: Record<string, unknown>) =>
    request<{ item: unknown }>("/admin/homepage-sections", { method: "POST", body: data }),
  updateHomepageSection: (id: string, data: Record<string, unknown>) =>
    request<{ item: unknown }>(`/admin/homepage-sections/${id}`, { method: "PATCH", body: data }),
  deleteHomepageSection: (id: string) =>
    request<{ success: boolean }>(`/admin/homepage-sections/${id}`, { method: "DELETE" }),
};

export const homepageApi = {
  getSections: () => request<{ sections: unknown[] }>("/homepage/sections"),
};

export async function apiGet<T>(path: string, params?: ApiRecord) {
  return request<T>(path, { params });
}
