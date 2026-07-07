import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { ORDER_STATUS } from "@/lib/orders";
import { placeOrder } from "@/lib/ordersService";
import { useLanguage } from "@/lib/language";

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { t } = useLanguage();
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const { currentUser, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCustomer && currentUser) {
      setForm((previous) => ({
        ...previous,
        name: currentUser.name,
        phone: currentUser.phone,
        address: currentUser.address,
      }));
    }
  }, [currentUser, isCustomer]);

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(t("checkoutCartEmpty"));
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError(t("checkoutPleaseAddDetails"));
      return;
    }

    setLoading(true);
    try {
      const order = {
        id: `order-${Date.now()}`,
        customerId: isCustomer && currentUser ? currentUser.id : null,
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: subtotal,
        status: ORDER_STATUS.PENDING_APPROVAL_CALL,
        statusUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await placeOrder({
        isGuest: !isCustomer,
        order,
        cartItems: order.items,
      });
      clear();
      toast.success(t("checkoutOrderPlacedSuccessfully"));
      navigate(
        isCustomer
          ? "/my-orders"
          : "/login",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("checkoutCouldNotPlaceOrder"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="py-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-academic-blue">
          {t("checkoutTitle")}
        </h1>
        <p className="mt-2 text-[16px] text-on-surface-variant">
          {t("checkoutSubtitle")}
        </p>
      </div>

      {!currentUser && (
        <div className="mb-5 rounded-md border border-outline-variant bg-surface p-4 text-[14px] text-on-surface-variant">
          {t("alreadyHaveAccountCheckout")}{" "}
          <Link className="font-semibold text-academic-blue" to="/login">
            {t("signIn")}
          </Link>{" "}
          {t("preFillDetails")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-xl border border-outline-variant bg-surface p-6">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              {t("checkoutFullName")}
            </span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
              type="text"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              {t("phoneNumber")}
            </span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="h-11 w-full rounded-md border border-outline-variant bg-muted-gray px-3 text-[14px] outline-none focus:border-academic-blue"
              type="tel"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              {t("deliveryAddress")}
            </span>
            <textarea
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              className="min-h-28 w-full rounded-md border border-outline-variant bg-muted-gray p-3 text-[14px] outline-none focus:border-academic-blue"
              placeholder={t("deliveryAddressPlaceholder")}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
              {t("checkoutNotes")}
            </span>
            <textarea
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              className="min-h-24 w-full rounded-md border border-outline-variant bg-muted-gray p-3 text-[14px] outline-none focus:border-academic-blue"
              placeholder={t("checkoutNotesPlaceholder")}
            />
          </label>

          {error && (
            <p className="rounded-md border border-oxford-red/30 bg-oxford-red/10 px-3 py-2 text-[14px] text-oxford-red">
              {error}
            </p>
          )}
        </div>

        <aside className="rounded-xl border border-outline-variant bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="font-headline text-2xl font-semibold text-academic-blue">{t("orderSummary")}</h2>
          <div className="mt-5 space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">{t("checkoutItems")}</span>
              <span className="font-medium text-academic-blue">{totalQuantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant">Subtotal</span>
              <span className="font-medium text-academic-blue">DT {subtotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            disabled={loading || items.length === 0}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-oxford-red px-5 py-3 text-[14px] font-semibold uppercase tracking-[0.08em] text-white disabled:opacity-60"
            type="submit"
          >
            {loading ? t("checkoutPlacingOrder") : t("checkoutPlaceOrder")}
          </button>
        </aside>
      </form>
    </main>
  );
}
