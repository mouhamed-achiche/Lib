/**
 * localStorage Database Layer
 * Replaces MySQL with browser storage for offline-first functionality
 */

export interface StorageUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'staff';
  createdAt: string;
}

export interface StorageProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock: number;
  image: string;
  rating: number;
  reviews: number;
}

export interface StorageCartItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface StorageOrder {
  id: string;
  userId: string;
  items: StorageCartItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageWishlistItem {
  id: string;
  productId: string;
  addedAt: string;
}

// Key names for localStorage
const KEYS = {
  USERS: 'ibnSina_users',
  PRODUCTS: 'ibnSina_products',
  CART: 'ibnSina_cart',
  ORDERS: 'ibnSina_orders',
  WISHLIST: 'ibnSina_wishlist',
  AUTH_TOKEN: 'ibnSina_auth_token',
  CURRENT_USER: 'ibnSina_current_user',
  SYNC_STATUS: 'ibnSina_sync_status',
};

// ============================================
// User Management
// ============================================

export const userStorage = {
  getAll(): StorageUser[] {
    try {
      const data = localStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  },

  getById(id: string): StorageUser | null {
    const users = this.getAll();
    return users.find(u => u.id === id) || null;
  },

  getByEmail(email: string): StorageUser | null {
    const users = this.getAll();
    return users.find(u => u.email === email) || null;
  },

  create(user: Omit<StorageUser, 'id' | 'createdAt'>): StorageUser {
    const newUser: StorageUser = {
      ...user,
      id: 'user_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const users = this.getAll();
    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  update(id: string, updates: Partial<StorageUser>): StorageUser | null {
    const users = this.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users[index];
  },

  delete(id: string): boolean {
    const users = this.getAll();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(filtered));
    return filtered.length < users.length;
  },

  initializeDefaults(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      // Create demo users
      this.create({
        email: 'user@example.com',
        name: 'Demo User',
        role: 'customer',
      });
      this.create({
        email: 'staff@ibnsina.tn',
        name: 'Ibn Sina Staff',
        role: 'staff',
      });
    }
  },
};

// ============================================
// Product Management
// ============================================

export const productStorage = {
  getAll(): StorageProduct[] {
    try {
      const data = localStorage.getItem(KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading products:', error);
      return [];
    }
  },

  getById(id: string): StorageProduct | null {
    const products = this.getAll();
    return products.find(p => p.id === id) || null;
  },

  getByCategory(category: string): StorageProduct[] {
    return this.getAll().filter(p => p.category === category);
  },

  getByBrand(brand: string): StorageProduct[] {
    return this.getAll().filter(p => p.brand === brand);
  },

  search(query: string): StorageProduct[] {
    const q = query.toLowerCase();
    return this.getAll().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    );
  },

  create(product: Omit<StorageProduct, 'id'>): StorageProduct {
    const newProduct: StorageProduct = {
      ...product,
      id: 'prod_' + Date.now(),
    };
    const products = this.getAll();
    products.push(newProduct);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  },

  update(id: string, updates: Partial<StorageProduct>): StorageProduct | null {
    const products = this.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates };
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  },

  delete(id: string): boolean {
    const products = this.getAll();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(filtered));
    return filtered.length < products.length;
  },

  initializeDefaults(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      const defaultProducts = [
        {
          name: 'Organic Tea Set',
          description: 'Premium organic tea collection',
          price: 45.99,
          category: 'Beverages',
          brand: 'Ibn Sina',
          stock: 50,
          image: 'https://via.placeholder.com/300?text=Tea+Set',
          rating: 4.5,
          reviews: 128,
        },
        {
          name: 'Herbal Medicine Kit',
          description: 'Complete herbal remedy collection',
          price: 89.99,
          category: 'Medicine',
          brand: 'Ibn Sina',
          stock: 30,
          image: 'https://via.placeholder.com/300?text=Medicine+Kit',
          rating: 4.8,
          reviews: 256,
        },
        {
          name: 'Spice Collection',
          description: 'Authentic spices from around the world',
          price: 35.99,
          category: 'Spices',
          brand: 'Ibn Sina',
          stock: 100,
          image: 'https://via.placeholder.com/300?text=Spices',
          rating: 4.6,
          reviews: 189,
        },
      ];

      defaultProducts.forEach(product => {
        this.create(product);
      });
    }
  },
};

// ============================================
// Cart Management
// ============================================

export const cartStorage = {
  getCart(): StorageCartItem[] {
    try {
      const data = localStorage.getItem(KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading cart:', error);
      return [];
    }
  },

  addItem(productId: string, quantity: number): StorageCartItem {
    const cart = this.getCart();
    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      const newItem: StorageCartItem = {
        id: 'cart_' + Date.now(),
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      };
      cart.push(newItem);
    }

    localStorage.setItem(KEYS.CART, JSON.stringify(cart));
    return existingItem || cart[cart.length - 1];
  },

  updateItem(productId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
      localStorage.setItem(KEYS.CART, JSON.stringify(cart));
    }
  },

  removeItem(productId: string): void {
    const cart = this.getCart();
    const filtered = cart.filter(item => item.productId !== productId);
    localStorage.setItem(KEYS.CART, JSON.stringify(filtered));
  },

  clearCart(): void {
    localStorage.setItem(KEYS.CART, JSON.stringify([]));
  },

  getTotal(): number {
    const cart = this.getCart();
    let total = 0;

    cart.forEach(item => {
      const product = productStorage.getById(item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    });

    return total;
  },
};

// ============================================
// Orders Management
// ============================================

export const orderStorage = {
  getAll(): StorageOrder[] {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading orders:', error);
      return [];
    }
  },

  getByUserId(userId: string): StorageOrder[] {
    return this.getAll().filter(o => o.userId === userId);
  },

  getById(id: string): StorageOrder | null {
    return this.getAll().find(o => o.id === id) || null;
  },

  create(order: Omit<StorageOrder, 'id' | 'createdAt' | 'updatedAt'>): StorageOrder {
    const newOrder: StorageOrder = {
      ...order,
      id: 'order_' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const orders = this.getAll();
    orders.push(newOrder);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    return newOrder;
  },

  updateStatus(id: string, status: string): StorageOrder | null {
    const orders = this.getAll();
    const order = orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    }
    return order || null;
  },

  delete(id: string): boolean {
    const orders = this.getAll();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(filtered));
    return filtered.length < orders.length;
  },
};

// ============================================
// Wishlist Management
// ============================================

export const wishlistStorage = {
  getWishlist(): StorageWishlistItem[] {
    try {
      const data = localStorage.getItem(KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading wishlist:', error);
      return [];
    }
  },

  addItem(productId: string): StorageWishlistItem {
    const wishlist = this.getWishlist();
    const exists = wishlist.some(item => item.productId === productId);

    if (!exists) {
      const newItem: StorageWishlistItem = {
        id: 'wish_' + Date.now(),
        productId,
        addedAt: new Date().toISOString(),
      };
      wishlist.push(newItem);
      localStorage.setItem(KEYS.WISHLIST, JSON.stringify(wishlist));
      return newItem;
    }
    return wishlist.find(item => item.productId === productId)!;
  },

  removeItem(productId: string): void {
    const wishlist = this.getWishlist();
    const filtered = wishlist.filter(item => item.productId !== productId);
    localStorage.setItem(KEYS.WISHLIST, JSON.stringify(filtered));
  },

  isInWishlist(productId: string): boolean {
    return this.getWishlist().some(item => item.productId === productId);
  },

  clearWishlist(): void {
    localStorage.setItem(KEYS.WISHLIST, JSON.stringify([]));
  },
};

// ============================================
// Authentication
// ============================================

export const authStorage = {
  setToken(token: string): void {
    localStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  getToken(): string | null {
    return localStorage.getItem(KEYS.AUTH_TOKEN);
  },

  clearToken(): void {
    localStorage.removeItem(KEYS.AUTH_TOKEN);
  },

  setCurrentUser(user: StorageUser): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  },

  getCurrentUser(): StorageUser | null {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading current user:', error);
      return null;
    }
  },

  clearCurrentUser(): void {
    localStorage.removeItem(KEYS.CURRENT_USER);
  },

  logout(): void {
    this.clearToken();
    this.clearCurrentUser();
  },
};

// ============================================
// Sync & Status
// ============================================

export const syncStorage = {
  setSyncStatus(status: 'online' | 'offline'): void {
    localStorage.setItem(KEYS.SYNC_STATUS, status);
  },

  getSyncStatus(): 'online' | 'offline' {
    return (localStorage.getItem(KEYS.SYNC_STATUS) as any) || 'online';
  },

  getLastSync(): number {
    const data = localStorage.getItem('ibnSina_last_sync');
    return data ? parseInt(data, 10) : 0;
  },

  setLastSync(timestamp: number): void {
    localStorage.setItem('ibnSina_last_sync', timestamp.toString());
  },
};

// ============================================
// Database Initialization
// ============================================

export const initializeDatabase = (): void => {
  userStorage.initializeDefaults();
  productStorage.initializeDefaults();
  syncStorage.setSyncStatus('online');
};

// ============================================
// Export all namespaces
// ============================================

export default {
  users: userStorage,
  products: productStorage,
  cart: cartStorage,
  orders: orderStorage,
  wishlist: wishlistStorage,
  auth: authStorage,
  sync: syncStorage,
  initialize: initializeDatabase,
};
