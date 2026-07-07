import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/language";

function QuantityInput({ item, setQty, t }) {
  const [draft, setDraft] = useState(String(item.quantity));

  useEffect(() => {
    setDraft(String(item.quantity));
  }, [item.quantity]);

  const commit = (raw) => {
    const n = parseInt(raw, 10);
    const clamped = isNaN(n) || n < 1 ? 1 : n;
    setDraft(String(clamped));
    setQty(item.id, clamped);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="inline-flex items-center rounded-md border border-outline-variant">
        <button
          onClick={() => commit(String(item.quantity - 1))}
          disabled={item.quantity <= 1}
          className="px-3 py-2 text-on-surface-variant hover:text-academic-blue disabled:opacity-30 disabled:cursor-not-allowed"
          type="button"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(e.target.value); }}
          className="w-14 bg-transparent text-center text-[14px] font-medium text-academic-blue outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={() => commit(String(item.quantity + 1))}
          className="px-3 py-2 text-on-surface-variant hover:text-academic-blue"
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatDT(value) {
  return `DT ${value.toFixed(2)}`;
}

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useLanguage();
  const threshold = 200;
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">{t("yourCart")}</h1>
        <p className="mt-2 text-[16px] text-on-surface-variant">{t("reviewItems")}</p>
      </div>

      {items.length > 0 && (
        <div className="mb-6 rounded-xl border border-outline-variant bg-muted-gray p-4">
          <div className="mb-2 flex items-center justify-between text-[14px]">
            <span className="text-on-surface-variant">{t("spendForFreeShipping")} {formatDT(threshold)} {t("forFreeShipping")}</span>
            <span className="font-semibold text-academic-blue">{formatDT(remaining)} {t("more")}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-variant">
            <div className="h-2 rounded-full bg-academic-blue" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-surface p-8 text-center">
              <p className="text-on-surface-variant">{t("cartEmpty")}</p>
              <Link
                to="/catalog/stationery"
                className="mt-6 inline-flex rounded-md bg-oxford-red px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-white"
              >
                {t("browseCatalog")}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-xl border border-outline-variant bg-surface p-4"
              >
                <img alt={item.title} className="h-24 w-24 rounded-md object-cover" src={item.image} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-[16px] font-semibold text-academic-blue">{item.title}</h2>
                      {item.variant ? <p className="mt-1 text-[14px] text-on-surface-variant">{item.variant}</p> : null}
                      <p className="mt-1 text-[12px] font-medium text-on-surface-variant">
                        {item.available !== false ? "Available" : "Out of Stock"}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-on-surface-variant transition-colors hover:text-oxford-red"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QuantityInput item={item} setQty={setQty} t={t} />
                    <span className="font-headline text-[20px] font-bold text-academic-blue">
                      {formatDT(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <aside>
          <div className="rounded-xl border border-outline-variant bg-surface p-6 lg:sticky lg:top-24">
            <h2 className="font-headline text-2xl font-semibold text-academic-blue">{t("orderSummary")}</h2>
            <div className="mt-5 space-y-3 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("subtotal")}</span>
                <span className="font-medium text-academic-blue">{formatDT(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("shipping")}</span>
                <span className="font-medium text-academic-blue">{t("calculatedAtCheckout")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">{t("tax")}</span>
                <span className="font-medium text-academic-blue">{formatDT(0)}</span>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-outline-variant pt-4">
              <span className="font-semibold text-academic-blue">{t("total")}</span>
              <span className="font-headline text-2xl font-bold text-academic-blue">{formatDT(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-oxford-red px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-white"
            >
              {t("proceedToCheckout")}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
