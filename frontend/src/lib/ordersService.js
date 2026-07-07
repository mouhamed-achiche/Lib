import { adminApi, ordersApi } from "@/lib/api";
import {
  ORDER_STATUS,
  addGuestOrderId,
  findOrderByReference,
  normalizeOrderStatus,
  readOrders,
  writeOrders,
} from "@/lib/orders";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const TOKEN_KEY = "ibn_sina_token";

let apiAvailableCache = null;

export function hasAuthToken() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export async function isApiAvailable() {
  if (apiAvailableCache !== null) return apiAvailableCache;
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      const payload = await response.json();
      apiAvailableCache = payload.data?.ok === true;
    } else {
      apiAvailableCache = false;
    }
  } catch {
    apiAvailableCache = false;
  }
  return apiAvailableCache;
}

export function resetApiAvailabilityCache() {
  apiAvailableCache = null;
}

export function normalizeBackendOrder(order) {
  if (!order) return null;
  return {
    id: order.id,
    customerId: order.customerId ?? order.userId ?? null,
    customerName: order.customerName ?? "",
    phone: order.phone ?? "",
    address: order.address ?? order.shippingAddress ?? "",
    notes: order.notes ?? "",
    items: (order.items ?? []).map((item) => ({
      id: item.id ?? item.productId,
      name: item.name ?? item.title ?? "Item",
      slug: item.slug ?? "",
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: item.image ?? "",
    })),
    total: Number(order.total ?? 0),
    status: normalizeOrderStatus(order.status),
    statusUpdatedAt: order.statusUpdatedAt ?? order.createdAt,
    createdAt: order.createdAt,
  };
}

export async function fetchAllOrders() {
  if ((await isApiAvailable()) && hasAuthToken()) {
    try {
      const response = await adminApi.getOrders();
      const apiItems = (response.data?.items ?? []).map(normalizeBackendOrder).filter(Boolean);
      // Merge: keep all local orders, update/add any from API so nothing is lost
      const localOrders = readOrders();
      const apiById = new Map(apiItems.map((o) => [o.id, o]));
      const localById = new Map(localOrders.map((o) => [o.id, o]));
      // API orders take precedence (fresher data), but keep local-only orders too
      const merged = [
        ...apiItems,
        ...localOrders.filter((o) => !apiById.has(o.id)),
      ];
      writeOrders(merged);
      return merged;
    } catch {
      /* fall through to local */
    }
  }
  return readOrders();
}

export async function fetchCustomerOrders(customerId) {
  if ((await isApiAvailable()) && hasAuthToken()) {
    try {
      const response = await ordersApi.getUserOrders();
      return (response.data?.items ?? []).map(normalizeBackendOrder).filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return readOrders().filter((order) => order.customerId === customerId);
}

export async function placeOrder({ isGuest, order, cartItems }) {
  if (await isApiAvailable()) {
    try {
      if (isGuest) {
        const response = await ordersApi.placeGuestOrder({
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          notes: order.notes,
          items: cartItems.map((item) => ({
            ...item,
            productId: item.productId ?? item.id,
          })),
        });
        const saved = normalizeBackendOrder(response.data?.order);
        if (saved) {
          writeOrders([saved, ...readOrders()]);
          addGuestOrderId(saved.id);
          return saved;
        }
      } else if (hasAuthToken()) {
        const response = await ordersApi.placeOrder({
          customerName: order.customerName,
          name: order.customerName,
          phone: order.phone,
          address: order.address,
          shippingAddress: order.address,
          notes: order.notes,
          items: cartItems.map((item) => ({
            ...item,
            productId: item.productId ?? item.id,
          })),
        });
        const saved = normalizeBackendOrder(response.data?.order);
        if (saved) {
          writeOrders([saved, ...readOrders()]);
          return saved;
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  writeOrders([order, ...readOrders()]);
  if (isGuest) addGuestOrderId(order.id);
  return order;
}

export async function trackOrderByReference(reference, phone) {
  if (await isApiAvailable()) {
    try {
      const response = await ordersApi.trackOrder({ reference, phone });
      const found = normalizeBackendOrder(response.data?.order);
      if (found) return found;
    } catch {
      /* fall through */
    }
  }

  return findOrderByReference(reference, phone);
}

export async function updateOrderStatus(orderId, status) {
  const now = new Date().toISOString();

  if ((await isApiAvailable()) && hasAuthToken()) {
    try {
      const response = await adminApi.updateOrderStatus(orderId, status);
      const updated = normalizeBackendOrder(response.data?.order);
      if (updated) {
        const next = readOrders().map((order) => (order.id === orderId ? updated : order));
        writeOrders(next);
        return next;
      }
    } catch {
      /* fall through */
    }
  }

  const next = readOrders().map((order) =>
    order.id === orderId ? { ...order, status, statusUpdatedAt: now } : order,
  );
  writeOrders(next);
  return next;
}

export async function deleteOrder(orderId) {
  if ((await isApiAvailable()) && hasAuthToken()) {
    try {
      await adminApi.deleteOrder(orderId);
      const next = readOrders().filter((order) => order.id !== orderId);
      writeOrders(next);
      return next;
    } catch {
      /* fall through */
    }
  }

  const next = readOrders().filter((order) => order.id !== orderId);
  writeOrders(next);
  return next;
}

export { ORDER_STATUS };
