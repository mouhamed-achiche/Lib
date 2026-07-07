/**
 * Offline Data Service
 * Handles data fetching with localStorage as primary source
 * Falls back to API if available
 */

import type { ApiEnvelope } from './api';
import { productStorage, categoryStorage, brandStorage, cartStorage, orderStorage, wishlistStorage } from './storage';

interface DataServiceOptions {
  useApi?: boolean;
}

let useApi = true;

export function setOfflineMode(enabled: boolean): void {
  useApi = !enabled;
}

/**
 * Products Service
 */
export const offlineProductService = {
  async getAll() {
    return productStorage.getAll();
  },

  async getById(id: string) {
    return productStorage.getById(id);
  },

  async getBySlug(slug: string) {
    return productStorage.getBySlug(slug);
  },

  async getByCategoryId(categoryId: string) {
    return productStorage.getByCategoryId(categoryId);
  },

  async getFeatured() {
    return productStorage.getFeatured();
  },

  async search(query: string) {
    const products = productStorage.getAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery),
    );
  },
};

/**
 * Categories Service
 */
export const offlineCategoryService = {
  async getAll() {
    return categoryStorage.getAll();
  },

  async getById(id: string) {
    return categoryStorage.getById(id);
  },

  async getBySlug(slug: string) {
    return categoryStorage.getBySlug(slug);
  },
};

/**
 * Brands Service
 */
export const offlineBrandService = {
  async getAll() {
    return brandStorage.getAll();
  },

  async getById(id: string) {
    return brandStorage.getById(id);
  },

  async getBySlug(slug: string) {
    return brandStorage.getBySlug(slug);
  },
};

/**
 * Cart Service
 */
export const offlineCartService = {
  async getCart() {
    return cartStorage.getCart();
  },

  async addItem(productId: string, quantity: number) {
    cartStorage.addItem(productId, quantity);
    return { success: true, data: cartStorage.getCart() };
  },

  async removeItem(productId: string) {
    cartStorage.removeItem(productId);
    return { success: true, data: cartStorage.getCart() };
  },

  async updateQuantity(productId: string, quantity: number) {
    cartStorage.updateQuantity(productId, quantity);
    return { success: true, data: cartStorage.getCart() };
  },

  async clear() {
    cartStorage.clear();
    return { success: true, data: cartStorage.getCart() };
  },
};

/**
 * Orders Service
 */
export const offlineOrderService = {
  async getAll() {
    return orderStorage.getAll();
  },

  async getById(id: string) {
    return orderStorage.getById(id);
  },

  async create(orderData: any) {
    const order = {
      id: `order-${Date.now()}`,
      ...orderData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    orderStorage.create(order);
    return { success: true, data: order };
  },

  async updateStatus(orderId: string, status: string) {
    const order = orderStorage.getById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    const updated = orderStorage.update(orderId, { status, updatedAt: Date.now() });
    return { success: true, data: updated };
  },
};

/**
 * Wishlist Service
 */
export const offlineWishlistService = {
  async getAll() {
    return wishlistStorage.getAll();
  },

  async add(productId: string) {
    wishlistStorage.add(productId);
    return { success: true };
  },

  async remove(productId: string) {
    wishlistStorage.remove(productId);
    return { success: true };
  },

  async has(productId: string) {
    return wishlistStorage.has(productId);
  },

  async clear() {
    wishlistStorage.clear();
    return { success: true };
  },
};

/**
 * Utility to wrap API calls with offline fallback
 */
export async function withOfflineFallback<T>(
  apiCall: () => Promise<T>,
  offlineFn: () => T | Promise<T>,
): Promise<T> {
  if (!useApi) {
    return await offlineFn();
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, falling back to offline data:', error);
    return await offlineFn();
  }
}
