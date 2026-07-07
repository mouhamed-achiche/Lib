import { Link } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useOrdersList } from "@/hooks/useOrdersList";
import { adminApi } from "@/lib/api";
import { formatPrice } from "@/lib/formatPrice";
import SortDropdown from "@/components/SortDropdown";
import ApiHealthChecker from "@/components/ApiHealthChecker";
import {
  ORDER_STATUS,
  ORDER_STATUS_FILTER_OPTIONS,
  formatOrderDisplayId,
  getOrderStatusLabel,
  getOrderStatusMeta,
  needsStaffAttention,
  normalizeOrderStatus,
  statusBadgeClass,
} from "@/lib/orders";

export default function AdminDashboard() {
  const { orders, loading } = useOrdersList();
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState("date-desc");

  const ORDER_SORT_OPTIONS = [
    { value: "date-desc", label: "Date, de la plus récente à la plus ancienne" },
    { value: "date-asc", label: "Date, de la plus ancienne à la plus récente" },
    { value: "name-asc", label: "Client, de A à Z" },
    { value: "name-desc", label: "Client, de Z à A" },
  ];

  const loadStats = useCallback(async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data ?? null);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const attentionCount =
    stats?.pendingOrders ??
    orders.filter((order) => needsStaffAttention(order.status)).length;
  const totalOrders = stats?.orders ?? orders.length;
  const pendingCallCount =
    orders.filter(
      (order) => normalizeOrderStatus(order.status) === ORDER_STATUS.PENDING_APPROVAL_CALL,
    ).length;
  const countsByStatus = ORDER_STATUS_FILTER_OPTIONS.filter((option) => option.value !== "all").map(
    (option) => ({
      ...option,
      count: orders.filter((order) => normalizeOrderStatus(order.status) === option.value).length,
    }),
  );

  const sortedRecentOrders = useMemo(() => {
    let items = [...orders];
    if (sortBy === "date-desc") {
      items.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "date-asc") {
      items.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sortBy === "name-asc") {
      items.sort((a, b) => (a.customerName || "").localeCompare(b.customerName || ""));
    } else if (sortBy === "name-desc") {
      items.sort((a, b) => (b.customerName || "").localeCompare(a.customerName || ""));
    }
    return items.slice(0, 5);
  }, [orders, sortBy]);

  return (
    <div>
      {/* Dashboard header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
            Tableau de bord du personnel
          </h1>
          <p className="mt-2 text-[16px] text-on-surface-variant">
            Suivez les commandes depuis l'appel de confirmation jusqu'à la livraison.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-md bg-oxford-red px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white"
          to="/dashboard/orders"
        >
          Gérer les commandes
        </Link>
      </div>

      {/* API Health Checker */}
      <ApiHealthChecker />

      {/* Sorting Bar */}
      <div className="mt-6 flex flex-wrap justify-between items-center bg-surface border border-outline-variant rounded-xl p-4 gap-4">
        <div className="flex flex-col">
          <h2 className="text-[15px] font-semibold text-academic-blue">Tri des commandes récentes</h2>
          <p className="text-[13px] text-on-surface-variant">Sélectionnez une option ci-dessous pour trier</p>
        </div>
        <SortDropdown
          value={sortBy}
          onChange={setSortBy}
          options={ORDER_SORT_OPTIONS}
        />
      </div>

      {loading && (
        <p className="mt-6 text-on-surface-variant">Chargement du tableau de bord...</p>
      )}

      {/* Stats Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            Nécessite une action
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-oxford-red">{attentionCount}</p>
          <p className="mt-2 text-[14px] text-on-surface-variant">
            Appel en attente, préparation livraison, ou en transit
          </p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            Commandes totales
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-academic-blue">{totalOrders}</p>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            Produits
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-academic-blue">
            {stats?.products ?? "—"}
          </p>
          <Link className="mt-2 inline-block text-[13px] text-oxford-red" to="/dashboard/products">
            Gérer les produits
          </Link>
        </article>
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            Revenu
          </p>
          <p className="mt-2 font-headline text-3xl font-bold text-academic-blue">
            {stats?.revenue != null ? formatPrice(stats.revenue) : "—"}
          </p>
          <p className="mt-2 text-[14px] text-on-surface-variant">
            {stats?.users ?? "—"} clients · {stats?.categories ?? "—"} catégories
          </p>
        </article>
      </section>

      {/* Awaiting confirmation call — single card, full width on mobile */}
      <section className="mt-8">
        <article className="rounded-xl border border-outline-variant bg-surface p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
            En attente d'appel de confirmation
          </p>
          <p className="mt-2 font-headline text-4xl font-bold text-academic-blue">
            {pendingCallCount}
          </p>
        </article>
      </section>

      {/* Top Selling Products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <section className="mt-8 rounded-xl border border-outline-variant bg-surface p-5">
          <h2 className="font-headline text-xl font-semibold text-academic-blue mb-4">Produits les plus vendus</h2>
          <div className="space-y-4">
            {stats.topProducts.map((prod, index) => {
              const maxSold = Math.max(...stats.topProducts.map((p) => p.sold || 1));
              const percentage = Math.round(((prod.sold || 0) / maxSold) * 100);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-[14px] font-medium text-academic-blue">
                    <span>{prod.name}</span>
                    <span className="font-semibold text-oxford-red">{prod.sold} vendu(s) ({formatPrice(prod.revenue)})</span>
                  </div>
                  <div className="w-full bg-muted-gray h-3.5 rounded-full overflow-hidden">
                    <div
                      className="bg-academic-blue h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Orders by Status — with conditional muted/active styling */}
      <section className="mt-8">
        <h2 className="font-headline text-xl font-semibold text-academic-blue">Commandes par statut</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {countsByStatus.map((item) => {
            const isActive = item.count > 0;
            return (
              <Link
                key={item.value}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-academic-blue ${
                  isActive
                    ? "border-outline-variant bg-surface"
                    : "border-outline-variant/50 bg-surface opacity-50"
                }`}
                to={`/dashboard/orders?status=${item.value}`}
              >
                <span className={`text-[14px] ${isActive ? "text-academic-blue" : "text-on-surface-variant"}`}>
                  {item.label}
                </span>
                {isActive ? (
                  <span className="rounded-full bg-academic-blue/10 border border-academic-blue/30 px-3 py-1 text-[12px] font-bold text-academic-blue">
                    {item.count}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted-gray px-3 py-1 text-[12px] text-on-surface-variant">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Orders — redesigned as a clean data table */}
      {sortedRecentOrders.length > 0 && (
        <section className="mt-8">
          <h2 className="font-headline text-xl font-semibold text-academic-blue mb-4">Commandes récentes</h2>
          <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-muted-gray border-b border-outline-variant text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">
              <span>Commande</span>
              <span>Client</span>
              <span>Statut</span>
              <span>Action</span>
            </div>
            {/* Table rows */}
            <ul className="divide-y divide-outline-variant">
              {sortedRecentOrders.map((order) => {
                const meta = getOrderStatusMeta(order.status);
                return (
                  <li
                    key={order.id}
                    className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] gap-2 sm:gap-4 items-center px-5 py-4"
                  >
                    {/* Order # */}
                    <div className="text-[14px] font-bold text-academic-blue whitespace-nowrap">
                      #{formatOrderDisplayId(order.id)}
                    </div>

                    {/* Customer name */}
                    <div className="text-[14px] text-on-surface-variant truncate">
                      {order.customerName}
                    </div>

                    {/* Color-coded status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold whitespace-nowrap ${statusBadgeClass(meta.tone)}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>

                    {/* Quick-action button */}
                    <Link
                      to={`/dashboard/orders/${order.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-outline-variant px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-academic-blue hover:bg-surface-container hover:border-academic-blue transition-colors whitespace-nowrap"
                    >
                      Gérer
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-3 text-right">
            <Link
              to="/dashboard/orders"
              className="text-[12px] font-semibold uppercase tracking-[0.08em] text-oxford-red hover:underline"
            >
              Voir toutes les commandes →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
