import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isApiAvailable } from "@/lib/ordersService";
import { type Product } from "./catalog";

export type CartItem = Product & { quantity: number; cartItemId?: string; available?: boolean };

type CartCtx = {
  items: CartItem[];
  add: (p: Product) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  remove: (id: string) => void;
  clear: () => Promise<void>;
  count: number;
  subtotal: number;
  loading: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "ibnsina-cart-v1";

function apiItemToCartItem(item: Record<string, unknown>): CartItem {
  return {
    id: String(item.productId ?? item.id),
    slug: String(item.slug ?? ""),
    title: String(item.title ?? item.name ?? "Item"),
    name: String(item.name ?? item.title ?? "Item"),
    price: Number(item.price ?? 0),
    currency: String(item.currency ?? "DT"),
    image: String(item.image ?? ""),
    quantity: Number(item.quantity ?? 1),
    stock: item.stock !== undefined ? Number(item.stock) : undefined,
    available: item.available !== undefined ? Boolean(item.available) : true,
    cartItemId: item.id ? String(item.id) : undefined,
  } as CartItem;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const persistLocal = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, []);

  const syncFromApi = useCallback(async () => {
    if (!currentUser || !(await isApiAvailable()) || !localStorage.getItem("ibn_sina_token")) {
      loadLocal();
      return;
    }
    setLoading(true);
    try {
      const response = await cartApi.getCart();
      const apiItems = (response.data?.items ?? []) as Record<string, unknown>[];
      if (apiItems.length) {
        setItems(apiItems.map(apiItemToCartItem));
      } else {
        loadLocal();
      }
    } catch {
      loadLocal();
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadLocal]);

  useEffect(() => {
    syncFromApi();
  }, [syncFromApi]);

  const add = async (p: Product) => {
    if (currentUser && (await isApiAvailable()) && localStorage.getItem("ibn_sina_token")) {
      try {
        const response = await cartApi.addItem({ productId: p.id, quantity: 1 });
        const apiItems = (response.data?.items ?? []) as Record<string, unknown>[];
        setItems(apiItems.map(apiItemToCartItem));
        return;
      } catch {
        /* fall through to local */
      }
    }
    setItems((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      const next = existing
        ? prev.map((x) => (x.id === p.id ? { ...x, quantity: x.quantity + 1 } : x))
        : [...prev, { ...p, quantity: 1 }];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const setQty = async (id: string, qty: number) => {
    const item = items.find((x) => x.id === id);
    const clampedQty = Math.max(1, qty);
    if (
      currentUser &&
      item?.cartItemId &&
      (await isApiAvailable()) &&
      localStorage.getItem("ibn_sina_token")
    ) {
      try {
        const response = await cartApi.updateItem(item.cartItemId, clampedQty);
        const apiItems = (response.data?.items ?? []) as Record<string, unknown>[];
        setItems(apiItems.map(apiItemToCartItem));
        return;
      } catch {
        /* local fallback */
      }
    }
    const next = items
      .map((x) => (x.id === id ? { ...x, quantity: Math.max(0, clampedQty) } : x))
      .filter((x) => x.quantity > 0);
    persistLocal(next);
  };

  const remove = async (id: string) => {
    const item = items.find((x) => x.id === id);
    if (
      currentUser &&
      item?.cartItemId &&
      (await isApiAvailable()) &&
      localStorage.getItem("ibn_sina_token")
    ) {
      try {
        const response = await cartApi.removeItem(item.cartItemId);
        const apiItems = (response.data?.items ?? []) as Record<string, unknown>[];
        setItems(apiItems.map(apiItemToCartItem));
        return;
      } catch {
        /* local fallback */
      }
    }
    const next = items.filter((x) => x.id !== id);
    persistLocal(next);
  };

  const clear = async () => {
    if (currentUser && (await isApiAvailable()) && localStorage.getItem("ibn_sina_token")) {
      try {
        await cartApi.clearCart();
      } catch {
        /* ignore */
      }
    }
    persistLocal([]);
  };

  const count = items.reduce((s, x) => s + x.quantity, 0);
  const subtotal = items.reduce((s, x) => s + x.quantity * x.price, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, remove, clear, count, subtotal, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
