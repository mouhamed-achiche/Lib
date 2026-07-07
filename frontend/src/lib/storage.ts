/**
 * LocalStorage Database Layer
 * Replaces MySQL with browser localStorage for all data persistence
 */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin' | 'staff';
  phone?: string;
  address?: string;
  city?: string;
  createdAt: number;
}

export interface StoredProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  stockQty: number;
  categoryId: string;
  brandId?: string;
  badge: 'none' | 'premium' | 'sale' | 'bestseller' | 'new' | 'in_stock';
  isFeatured: boolean;
  imageUrl: string;
  images?: string[];
  specifications?: Record<string, any>;
  isActive: boolean;
}

export interface StoredCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface StoredBrand {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  addedAt: number;
}

export interface StoredCart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  createdAt: number;
  updatedAt: number;
}

export interface StoredOrder {
  id: string;
  userId?: string;
  sessionId?: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  city?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Storage Manager - handles all localStorage operations
 */
class StorageManager {
  private readonly prefix = 'ibn_sina_';

  private key(name: string): string {
    return `${this.prefix}${name}`;
  }

  /**
   * Get all stored data or initialize with defaults
   */
  getData<T>(name: string, defaultValue?: T): T | null {
    try {
      const stored = localStorage.getItem(this.key(name));
      return stored ? JSON.parse(stored) : defaultValue ?? null;
    } catch (error) {
      console.error(`Error reading storage ${name}:`, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Save data to storage
   */
  setData<T>(name: string, data: T): void {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to storage ${name}:`, error);
    }
  }

  /**
   * Clear specific storage key
   */
  clear(name: string): void {
    try {
      localStorage.removeItem(this.key(name));
    } catch (error) {
      console.error(`Error clearing storage ${name}:`, error);
    }
  }

  /**
   * Clear all application data
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const storage = new StorageManager();

/**
 * Database initialization with seed data
 */
export function initializeDatabase(): void {
  // Initialize categories if not exists
  if (!storage.getData('categories')) {
    storage.setData('categories', getDefaultCategories());
  }

  // Initialize brands if not exists
  if (!storage.getData('brands')) {
    storage.setData('brands', getDefaultBrands());
  }

  // Initialize products if not exists
  if (!storage.getData('products')) {
    storage.setData('products', getDefaultProducts());
  }

  // Initialize users if not exists
  if (!storage.getData('users')) {
    storage.setData('users', getDefaultUsers());
  }

  // Initialize cart if not exists
  if (!storage.getData('cart')) {
    storage.setData('cart', { id: 'guest-cart', items: [], createdAt: Date.now(), updatedAt: Date.now() });
  }

  // Initialize orders if not exists
  if (!storage.getData('orders')) {
    storage.setData('orders', []);
  }

  // Initialize wishlist if not exists
  if (!storage.getData('wishlist')) {
    storage.setData('wishlist', []);
  }
}

/**
 * Default seed data
 */
function getDefaultCategories(): StoredCategory[] {
  return [
    {
      id: '1',
      slug: 'books',
      name: 'Books',
      description: 'Reading and reference titles for thoughtful workspaces.',
      icon: 'menu_book',
      sortOrder: 1,
      isActive: true,
    },
    {
      id: '2',
      slug: 'stationery',
      name: 'Stationery',
      description: 'Pens, notebooks, and writing tools.',
      icon: 'edit',
      sortOrder: 2,
      isActive: true,
    },
    {
      id: '3',
      slug: 'art-supplies',
      name: 'Art Supplies',
      description: 'Paper, markers, and creative tools.',
      icon: 'palette',
      sortOrder: 3,
      isActive: true,
    },
    {
      id: '4',
      slug: 'tech',
      name: 'Tech',
      description: 'Compact accessories that make the desk work harder.',
      icon: 'devices',
      sortOrder: 4,
      isActive: true,
    },
    {
      id: '5',
      slug: 'gifts',
      name: 'Gifts',
      description: 'Objects that feel intentional and useful.',
      icon: 'card_giftcard',
      sortOrder: 5,
      isActive: true,
    },
  ];
}

function getDefaultBrands(): StoredBrand[] {
  return [
    { id: '1', slug: 'pilot', name: 'Pilot', isActive: true },
    { id: '2', slug: 'stabilo', name: 'Stabilo', isActive: true },
    { id: '3', slug: 'lamy', name: 'Lamy', isActive: true },
    { id: '4', slug: 'moleskine', name: 'Moleskine', isActive: true },
    { id: '5', slug: 'muji', name: 'Muji', isActive: true },
    { id: '6', slug: 'baseus', name: 'Baseus', isActive: true },
  ];
}

function getDefaultProducts(): StoredProduct[] {
  return [
    {
      id: '1',
      slug: 'classic-hardcover-journal-navy',
      name: 'Classic Hardcover Journal - Navy Blue Edition',
      description: 'A durable journal with smooth paper and a refined cloth cover.',
      categoryId: '2',
      brandId: '4',
      price: 24,
      stockQty: 32,
      badge: 'bestseller',
      isFeatured: true,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AP1WRLuid_yohZZz3e_1vGozTwad7qCBPi3d2DPhrW3hfrfYpDLOjps7lytC4Ucly0xYGAWxHQe1L-tPfY_Is4BpsrTUh8Y2Lj7RDiLNe2g9yOTsm0Cd4lVMpSeu9rV92loraTjhu0i-m1OY13M5N1HpFHlQRbIIrNI17ZTCbvMh4JQjOyUgWBWObUZ62Ip8fH6Oy0uUZUNloniWvj-ygse8D7kpvZO_aFA8aMPm34aSjiaLdA7rYdglLpTjE3Dh',
      isActive: true,
    },
    {
      id: '2',
      slug: 'premium-fine-liner-pen-set',
      name: 'Premium Fine-Liner Pen Set - Assorted Colors',
      description: 'A clean, precise set for sketches, notes, and color coding.',
      categoryId: '2',
      brandId: '2',
      price: 18.5,
      stockQty: 48,
      badge: 'new',
      isFeatured: true,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM',
      isActive: true,
    },
    {
      id: '3',
      slug: 'leather-desk-organizer-cognac',
      name: 'Leather Desk Organizer - Cognac',
      description: 'Hand-stitched leather organizer with compartments for your workspace.',
      categoryId: '4',
      price: 45.0,
      stockQty: 16,
      badge: 'premium',
      isFeatured: true,
      imageUrl:
        'https://lh3.googleusercontent.com/aida/AP1WRLsFHvpNpgLfL2KrE8GE7ixZXBpvKQpJZL0L8hKJPEPyHc4bF-Xq3qBfL5-1EYr_KeigqmkCwqZtXaIUDNyGEcGRh5FWQJyO3xNiEGhH7-7CNeVVjWJHtGZI5KzLXxYEaL1Hf_TQ5g',
      isActive: true,
    },
  ];
}

function getDefaultUsers(): StoredUser[] {
  return [
    {
      id: '1',
      email: 'admin@ibnsinaapp.com',
      name: 'Administrator',
      password: '$2a$10$N9qo8uLOickgx2ZMRZoHyeIGWnwV8qZj8mENB8E8d9H6e7X8h5U8a', // password123
      role: 'admin',
      createdAt: Date.now(),
    },
  ];
}

/**
 * Product Repository
 */
export const productStorage = {
  getAll(): StoredProduct[] {
    return storage.getData('products', []);
  },

  getById(id: string): StoredProduct | null {
    const products = this.getAll();
    return products.find((p) => p.id === id) || null;
  },

  getBySlug(slug: string): StoredProduct | null {
    const products = this.getAll();
    return products.find((p) => p.slug === slug) || null;
  },

  getByCategoryId(categoryId: string): StoredProduct[] {
    const products = this.getAll();
    return products.filter((p) => p.categoryId === categoryId && p.isActive);
  },

  getFeatured(): StoredProduct[] {
    const products = this.getAll();
    return products.filter((p) => p.isFeatured && p.isActive);
  },

  create(product: StoredProduct): StoredProduct {
    const products = this.getAll();
    products.push(product);
    storage.setData('products', products);
    return product;
  },

  update(id: string, updates: Partial<StoredProduct>): StoredProduct | null {
    const products = this.getAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated = { ...products[index], ...updates };
    products[index] = updated;
    storage.setData('products', products);
    return updated;
  },

  delete(id: string): boolean {
    const products = this.getAll();
    const filtered = products.filter((p) => p.id !== id);
    if (filtered.length === products.length) return false;
    storage.setData('products', filtered);
    return true;
  },
};

/**
 * Category Repository
 */
export const categoryStorage = {
  getAll(): StoredCategory[] {
    return storage.getData('categories', []);
  },

  getById(id: string): StoredCategory | null {
    const categories = this.getAll();
    return categories.find((c) => c.id === id) || null;
  },

  getBySlug(slug: string): StoredCategory | null {
    const categories = this.getAll();
    return categories.find((c) => c.slug === slug) || null;
  },

  create(category: StoredCategory): StoredCategory {
    const categories = this.getAll();
    categories.push(category);
    storage.setData('categories', categories);
    return category;
  },

  update(id: string, updates: Partial<StoredCategory>): StoredCategory | null {
    const categories = this.getAll();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const updated = { ...categories[index], ...updates };
    categories[index] = updated;
    storage.setData('categories', categories);
    return updated;
  },

  delete(id: string): boolean {
    const categories = this.getAll();
    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) return false;
    storage.setData('categories', filtered);
    return true;
  },
};

/**
 * Brand Repository
 */
export const brandStorage = {
  getAll(): StoredBrand[] {
    return storage.getData('brands', []);
  },

  getById(id: string): StoredBrand | null {
    const brands = this.getAll();
    return brands.find((b) => b.id === id) || null;
  },

  getBySlug(slug: string): StoredBrand | null {
    const brands = this.getAll();
    return brands.find((b) => b.slug === slug) || null;
  },

  create(brand: StoredBrand): StoredBrand {
    const brands = this.getAll();
    brands.push(brand);
    storage.setData('brands', brands);
    return brand;
  },

  update(id: string, updates: Partial<StoredBrand>): StoredBrand | null {
    const brands = this.getAll();
    const index = brands.findIndex((b) => b.id === id);
    if (index === -1) return null;
    const updated = { ...brands[index], ...updates };
    brands[index] = updated;
    storage.setData('brands', brands);
    return updated;
  },

  delete(id: string): boolean {
    const brands = this.getAll();
    const filtered = brands.filter((b) => b.id !== id);
    if (filtered.length === brands.length) return false;
    storage.setData('brands', filtered);
    return true;
  },
};

/**
 * Cart Repository
 */
export const cartStorage = {
  getCart(): StoredCart {
    return storage.getData('cart', {
      id: 'guest-cart',
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },

  addItem(productId: string, quantity: number): void {
    const cart = this.getCart();
    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        id: `item-${Date.now()}`,
        cartId: cart.id,
        productId,
        quantity,
        addedAt: Date.now(),
      });
    }

    cart.updatedAt = Date.now();
    storage.setData('cart', cart);
  },

  removeItem(productId: string): void {
    const cart = this.getCart();
    cart.items = cart.items.filter((item) => item.productId !== productId);
    cart.updatedAt = Date.now();
    storage.setData('cart', cart);
  },

  updateQuantity(productId: string, quantity: number): void {
    const cart = this.getCart();
    const item = cart.items.find((item) => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      cart.updatedAt = Date.now();
      storage.setData('cart', cart);
    }
  },

  clear(): void {
    const cart = this.getCart();
    cart.items = [];
    cart.updatedAt = Date.now();
    storage.setData('cart', cart);
  },
};

/**
 * Order Repository
 */
export const orderStorage = {
  getAll(): StoredOrder[] {
    return storage.getData('orders', []);
  },

  getById(id: string): StoredOrder | null {
    const orders = this.getAll();
    return orders.find((o) => o.id === id) || null;
  },

  create(order: StoredOrder): StoredOrder {
    const orders = this.getAll();
    orders.push(order);
    storage.setData('orders', orders);
    return order;
  },

  update(id: string, updates: Partial<StoredOrder>): StoredOrder | null {
    const orders = this.getAll();
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    const updated = { ...orders[index], ...updates };
    orders[index] = updated;
    storage.setData('orders', orders);
    return updated;
  },

  delete(id: string): boolean {
    const orders = this.getAll();
    const filtered = orders.filter((o) => o.id !== id);
    if (filtered.length === orders.length) return false;
    storage.setData('orders', filtered);
    return true;
  },
};

/**
 * Wishlist Repository
 */
export const wishlistStorage = {
  getAll(): string[] {
    return storage.getData('wishlist', []);
  },

  add(productId: string): void {
    const wishlist = this.getAll();
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
      storage.setData('wishlist', wishlist);
    }
  },

  remove(productId: string): void {
    const wishlist = this.getAll().filter((id) => id !== productId);
    storage.setData('wishlist', wishlist);
  },

  has(productId: string): boolean {
    return this.getAll().includes(productId);
  },

  clear(): void {
    storage.setData('wishlist', []);
  },
};
