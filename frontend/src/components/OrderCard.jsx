import {
  formatOrderDisplayId,
  getOrderStatusLabel,
  getOrderStatusMeta,
  statusBadgeClass,
} from "@/lib/orders";

export default function OrderCard({ order }) {
  const meta = getOrderStatusMeta(order.status);

  return (
    <article className="rounded-xl border border-outline-variant bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-academic-blue">
            Order #{formatOrderDisplayId(order.id)}
          </h2>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-semibold ${statusBadgeClass(meta.tone)}`}
          >
            {getOrderStatusLabel(order.status, { forCustomer: true })}
          </span>
          <p className="mt-3 text-[14px] text-on-surface-variant">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className="font-headline text-[20px] font-bold text-academic-blue">
          DT {Number(order.total ?? 0).toFixed(2)}
        </span>
      </div>
      <div className="mt-4 border-t border-outline-variant pt-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
          Items
        </p>
        <ul className="mt-2 space-y-1 text-[14px] text-on-surface-variant">
          {order.items?.map((item) => (
            <li key={`${order.id}-${item.id}`} className="flex justify-between gap-4">
              <span>{item.name}</span>
              <span>x{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
