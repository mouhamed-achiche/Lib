/**
 * API Service with localStorage fallback
 * Provides data from localStorage first, then attempts backend API calls
 */

import {
  userStorage,
  productStorage,
  cartStorage,
  orderStorage,
  wishlistStorage,
  authStorage,
} from './localStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class OfflineFirstAPI {
  private backendAvailable = false;

  async init(): Promise<void> {
    // Check if backend is available
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 2000,
      } as any);
      this.backendAvailable = response.ok;
    } catch {
      this.backendAvailable = false;
      console.warn('Backend unavailable, using localStorage');
    }
  }

  // ============================================
  // Authentication
  // ============================================

  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      // Try backend first
      if (this.backendAvailable) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          authStorage.setToken(data.token);
          authStorage.setCurrentUser(data.user);
          return { success: true, data };
        }
      }
    } catch (error) {
      console.warn('Backend login failed, trying localStorage', error);
    }

    // SECURITY: Offline fallback disabled for security - passwords should never be stored in plaintext
    // In production, always use the backend API with secure authentication
    console.warn('[SECURITY] Backend unavailable - authentication requires backend connection');
    return {
      success: false,
      error: 'Backend unavailable. Please check your connection.',
    };
  }

  async signup(userData: {
    email: string;
    name: string;
    password: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      // Try backend first
      if (this.backendAvailable) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });

        if (response.ok) {
          const data = await response.json();
          authStorage.setToken(data.token);
          authStorage.setCurrentUser(data.user);
          return { success: true, data };
        }
      }
    } catch (error) {
      console.warn('Backend signup failed, trying localStorage', error);
    }

    // SECURITY: Offline fallback disabled for security - passwords should never be stored in plaintext
    // In production, always use the backend API with secure authentication
    console.warn('[SECURITY] Backend unavailable - registration requires backend connection');
    return {
      success: false,
      error: 'Backend unavailable. Please check your connection.',
    };
  }

  async logout(): Promise<void> {
    authStorage.logout();
  }

  getCurrentUser(): any {
    return authStorage.getCurrentUser();
  }

  // ============================================
  // Products
  // ============================================

  async getProducts(category?: string, search?: string): Promise<ApiResponse<any[]>> {
    try {
      // Try backend first
      if (this.backendAvailable) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (search) params.append('search', search);

        const response = await fetch(
          `${API_BASE_URL}/products?${params.toString()}`
        );
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }
    } catch (error) {
      console.warn('Backend getProducts failed, using localStorage', error);
    }

    // Fallback to localStorage
    let products = productStorage.getAll();

    if (category) {
      products = products.filter(p => p.category === category);
    }

    if (search) {
      products = productStorage.search(search);
    }

    return {
      success: true,
      data: products,
    };
  }

  async getProductById(id: string): Promise<ApiResponse<any>> {
    try {
      // Try backend first
      if (this.backendAvailable) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        }
      }
    } catch (error) {
      console.warn('Backend getProductById failed, using localStorage', error);
    }

    // Fallback to localStorage
    const product = productStorage.getById(id);
    return product
      ? { success: true, data: product }
      : { success: false, error: 'Product not found' };
  }

  async getCategories(): Promise<ApiResponse<string[]>> {
    const products = productStorage.getAll();
    const categories = [...new Set(products.map(p => p.category))];
    return { success: true, data: categories };
  }

  async getBrands(): Promise<ApiResponse<string[]>> {
    const products = productStorage.getAll();
    const brands = [...new Set(products.map(p => p.brand))];
    return { success: true, data: brands };
  }

  // ============================================
  // Cart
  // ============================================

  async getCart(): Promise<ApiResponse<any[]>> {
    const cart = cartStorage.getCart();
    const items = cart.map(item => {
      const product = productStorage.getById(item.productId);
      return {
        ...item,
        product,
      };
    });
    return { success: true, data: items };
  }

  async addToCart(productId: string, quantity: number): Promise<ApiResponse<any>> {
    cartStorage.addItem(productId, quantity);
    return await this.getCart();
  }

  async updateCartItem(productId: string, quantity: number): Promise<ApiResponse<any>> {
    if (quantity <= 0) {
      cartStorage.removeItem(productId);
    } else {
      cartStorage.updateItem(productId, quantity);
    }
    return await this.getCart();
  }

  async removeFromCart(productId: string): Promise<ApiResponse<any>> {
    cartStorage.removeItem(productId);
    return await this.getCart();
  }

  async clearCart(): Promise<ApiResponse<any>> {
    cartStorage.clearCart();
    return { success: true, data: [] };
  }

  async getCartTotal(): Promise<ApiResponse<number>> {
    const total = cartStorage.getTotal();
    return { success: true, data: total };
  }

  // ============================================
  // Orders
  // ============================================

  async getOrders(): Promise<ApiResponse<any[]>> {
    const user = authStorage.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const orders = orderStorage.getByUserId(user.id);
    return { success: true, data: orders };
  }

  async getOrderById(id: string): Promise<ApiResponse<any>> {
    const order = orderStorage.getById(id);
    return order
      ? { success: true, data: order }
      : { success: false, error: 'Order not found' };
  }

  async createOrder(
    items: any[],
    total: number
  ): Promise<ApiResponse<any>> {
    const user = authStorage.getCurrentUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const order = orderStorage.create({
      userId: user.id,
      items,
      total,
      status: 'pending',
    });

    // Clear cart after order
    cartStorage.clearCart();

    return { success: true, data: order };
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<ApiResponse<any>> {
    const user = authStorage.getCurrentUser();
    if (!user || user.role !== 'staff') {
      return { success: false, error: 'Not authorized' };
    }

    const order = orderStorage.updateStatus(orderId, status);
    return order
      ? { success: true, data: order }
      : { success: false, error: 'Order not found' };
  }

  // ============================================
  // Wishlist
  // ============================================

  async getWishlist(): Promise<ApiResponse<any[]>> {
    const wishlist = wishlistStorage.getWishlist();
    const items = wishlist.map(item => productStorage.getById(item.productId));
    return { success: true, data: items.filter(Boolean) };
  }

  async addToWishlist(productId: string): Promise<ApiResponse<any>> {
    wishlistStorage.addItem(productId);
    return await this.getWishlist();
  }

  async removeFromWishlist(productId: string): Promise<ApiResponse<any>> {
    wishlistStorage.removeItem(productId);
    return await this.getWishlist();
  }

  async isInWishlist(productId: string): Promise<ApiResponse<boolean>> {
    const inWishlist = wishlistStorage.isInWishlist(productId);
    return { success: true, data: inWishlist };
  }

  // ============================================
  // Admin
  // ============================================

  async getAdminStats(): Promise<ApiResponse<any>> {
    const user = authStorage.getCurrentUser();
    if (!user || user.role !== 'staff') {
      return { success: false, error: 'Not authorized' };
    }

    const stats = {
      totalProducts: productStorage.getAll().length,
      totalOrders: orderStorage.getAll().length,
      totalUsers: userStorage.getAll().length,
      pendingOrders: orderStorage
        .getAll()
        .filter(o => o.status === 'pending').length,
    };

    return { success: true, data: stats };
  }

  async createProduct(productData: any): Promise<ApiResponse<any>> {
    const user = authStorage.getCurrentUser();
    if (!user || user.role !== 'staff') {
      return { success: false, error: 'Not authorized' };
    }

    const product = productStorage.create(productData);
    return { success: true, data: product };
  }

  async updateProduct(id: string, updates: any): Promise<ApiResponse<any>> {
    const user = authStorage.getCurrentUser();
    if (!user || user.role !== 'staff') {
      return { success: false, error: 'Not authorized' };
    }

    const product = productStorage.update(id, updates);
    return product
      ? { success: true, data: product }
      : { success: false, error: 'Product not found' };
  }

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const user = authStorage.getCurrentUser();
    if (!user || user.role !== 'staff') {
      return { success: false, error: 'Not authorized' };
    }

    const success = productStorage.delete(id);
    return success
      ? { success: true }
      : { success: false, error: 'Product not found' };
  }
}

// Export singleton instance
export const api = new OfflineFirstAPI();

export default api;
