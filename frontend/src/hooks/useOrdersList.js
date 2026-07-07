import { useCallback, useEffect, useState } from "react";
import { fetchAllOrders } from "@/lib/ordersService";

export function useOrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchAllOrders();
      setOrders(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event) => {
      if (event.key === "ibnsina_orders" || event.key === null) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const updateOrders = useCallback((nextOrders) => {
    setOrders(nextOrders);
  }, []);

  return { orders, loading, refresh, updateOrders };
}
