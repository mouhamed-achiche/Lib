export const ORDERS_KEY = "ibnsina_orders";
export const GUEST_ORDER_IDS_KEY = "ibnsina_guest_order_ids";

/** Initial status when customer places an order (cart or buy now). */
export const ORDER_STATUS = {
  PENDING_APPROVAL_CALL: "pending_approval_call",
  NO_ANSWER_ON_CALL: "no_answer_on_call",
  APPROVED_NEED_DELIVERY: "approved_need_delivery",
  ON_DELIVERY: "on_delivery",
  APPROVED_DELIVERED: "approved_delivered",
  REJECTED: "rejected",
  REJECTED_AFTER_DELIVERY: "rejected_after_delivery",
  RETURNED_AFTER_DELIVERY: "returned_after_delivery",
  CANCELLED: "cancelled",
};

export const ORDER_STATUS_META = {
  [ORDER_STATUS.PENDING_APPROVAL_CALL]: {
    label: "Need approval (call)",
    shortLabel: "Awaiting call",
    tone: "amber",
    customerLabel: "Waiting for confirmation call",
  },
  [ORDER_STATUS.NO_ANSWER_ON_CALL]: {
    label: "No answer on call",
    shortLabel: "No answer",
    tone: "orange",
    customerLabel: "We could not reach you — we will call again",
  },
  [ORDER_STATUS.APPROVED_NEED_DELIVERY]: {
    label: "Approved – need delivery",
    shortLabel: "Ready to ship",
    tone: "blue",
    customerLabel: "Confirmed – preparing delivery",
  },
  [ORDER_STATUS.ON_DELIVERY]: {
    label: "On delivery",
    shortLabel: "On delivery",
    tone: "indigo",
    customerLabel: "Out for delivery",
  },
  [ORDER_STATUS.APPROVED_DELIVERED]: {
    label: "Approved & delivered",
    shortLabel: "Delivered",
    tone: "green",
    customerLabel: "Delivered",
  },
  [ORDER_STATUS.REJECTED]: {
    label: "Rejected",
    shortLabel: "Rejected",
    tone: "red",
    customerLabel: "Order rejected",
  },
  [ORDER_STATUS.REJECTED_AFTER_DELIVERY]: {
    label: "Rejected after delivery",
    shortLabel: "Rejected at delivery",
    tone: "red",
    customerLabel: "Rejected at delivery",
  },
  [ORDER_STATUS.RETURNED_AFTER_DELIVERY]: {
    label: "Returned after delivery",
    shortLabel: "Returned",
    tone: "purple",
    customerLabel: "Returned after delivery",
  },
  [ORDER_STATUS.CANCELLED]: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    tone: "gray",
    customerLabel: "Cancelled",
  },
};

const LEGACY_STATUS_MAP = {
  pending: ORDER_STATUS.PENDING_APPROVAL_CALL,
  processing: ORDER_STATUS.APPROVED_NEED_DELIVERY,
  confirmed: ORDER_STATUS.APPROVED_NEED_DELIVERY,
  shipped: ORDER_STATUS.ON_DELIVERY,
  delivered: ORDER_STATUS.APPROVED_DELIVERED,
  completed: ORDER_STATUS.APPROVED_DELIVERED,
  cancelled: ORDER_STATUS.CANCELLED,
};

/** Staff may move an order only along these paths. */
export const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING_APPROVAL_CALL]: [
    ORDER_STATUS.APPROVED_NEED_DELIVERY,
    ORDER_STATUS.NO_ANSWER_ON_CALL,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.NO_ANSWER_ON_CALL]: [
    ORDER_STATUS.PENDING_APPROVAL_CALL,
    ORDER_STATUS.APPROVED_NEED_DELIVERY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.APPROVED_NEED_DELIVERY]: [
    ORDER_STATUS.ON_DELIVERY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
  ],
  [ORDER_STATUS.ON_DELIVERY]: [
    ORDER_STATUS.APPROVED_DELIVERED,
    ORDER_STATUS.REJECTED_AFTER_DELIVERY,
  ],
  [ORDER_STATUS.APPROVED_DELIVERED]: [ORDER_STATUS.RETURNED_AFTER_DELIVERY],
  [ORDER_STATUS.REJECTED]: [],
  [ORDER_STATUS.REJECTED_AFTER_DELIVERY]: [],
  [ORDER_STATUS.RETURNED_AFTER_DELIVERY]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All orders" },
  { value: ORDER_STATUS.PENDING_APPROVAL_CALL, label: "Need approval (call)" },
  { value: ORDER_STATUS.NO_ANSWER_ON_CALL, label: "No answer on call" },
  { value: ORDER_STATUS.APPROVED_NEED_DELIVERY, label: "Approved – need delivery" },
  { value: ORDER_STATUS.ON_DELIVERY, label: "On delivery" },
  { value: ORDER_STATUS.APPROVED_DELIVERED, label: "Approved & delivered" },
  { value: ORDER_STATUS.REJECTED, label: "Rejected" },
  { value: ORDER_STATUS.REJECTED_AFTER_DELIVERY, label: "Rejected after delivery" },
  { value: ORDER_STATUS.RETURNED_AFTER_DELIVERY, label: "Returned after delivery" },
  { value: ORDER_STATUS.CANCELLED, label: "Cancelled" },
];

export function normalizeOrderStatus(status) {
  if (!status) return ORDER_STATUS.PENDING_APPROVAL_CALL;
  if (ORDER_STATUS_META[status]) return status;
  return LEGACY_STATUS_MAP[status] ?? ORDER_STATUS.PENDING_APPROVAL_CALL;
}

export function getOrderStatusMeta(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_META[normalized] ?? ORDER_STATUS_META[ORDER_STATUS.PENDING_APPROVAL_CALL];
}

export function getOrderStatusLabel(status, { forCustomer = false } = {}) {
  const meta = getOrderStatusMeta(status);
  return forCustomer ? meta.customerLabel : meta.label;
}

export function getNextOrderStatuses(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_TRANSITIONS[normalized] ?? [];
}

export function isTerminalOrderStatus(status) {
  return getNextOrderStatuses(status).length === 0;
}

export function needsStaffAttention(status) {
  const normalized = normalizeOrderStatus(status);
  return (
    normalized === ORDER_STATUS.PENDING_APPROVAL_CALL ||
    normalized === ORDER_STATUS.NO_ANSWER_ON_CALL ||
    normalized === ORDER_STATUS.APPROVED_NEED_DELIVERY ||
    normalized === ORDER_STATUS.ON_DELIVERY
  );
}

export function normalizePhone(phone) {
  return String(phone ?? "").replace(/\D/g, "");
}

export function formatOrderDisplayId(orderId) {
  return String(orderId).replace(/^order-/, "");
}

export function parseOrderReference(reference) {
  const trimmed = String(reference ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("order-") ? trimmed : `order-${trimmed}`;
}

export function findOrderByReference(reference, phone) {
  const orderId = parseOrderReference(reference);
  const normalizedPhone = normalizePhone(phone);
  if (!orderId || !normalizedPhone) return null;

  return (
    readOrders().find(
      (order) => order.id === orderId && normalizePhone(order.phone) === normalizedPhone,
    ) ?? null
  );
}

export function readGuestOrderIds() {
  try {
    const raw = localStorage.getItem(GUEST_ORDER_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    void error;
    return [];
  }
}

export function addGuestOrderId(orderId) {
  const ids = readGuestOrderIds();
  if (ids.includes(orderId)) return;
  localStorage.setItem(GUEST_ORDER_IDS_KEY, JSON.stringify([orderId, ...ids]));
}

export function getGuestOrdersOnDevice() {
  const ids = new Set(readGuestOrderIds());
  return readOrders().filter((order) => !order.customerId && ids.has(order.id));
}

export function canViewOrderOnDevice(order) {
  if (!order) return false;
  if (order.customerId) return false;
  return readGuestOrderIds().includes(order.id);
}

export function getOrderById(orderId) {
  const id = parseOrderReference(orderId) || orderId;
  return readOrders().find((order) => order.id === id) ?? null;
}

function migrateOrder(order) {
  return {
    ...order,
    status: normalizeOrderStatus(order.status),
    statusUpdatedAt: order.statusUpdatedAt ?? order.createdAt,
  };
}

export function readOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migrateOrder);
  } catch (error) {
    void error;
    return [];
  }
}

export function writeOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.map(migrateOrder)));
}

export function statusBadgeClass(tone) {
  const map = {
    amber: "bg-amber-100 text-amber-900",
    orange: "bg-orange-100 text-orange-900",
    blue: "bg-blue-100 text-blue-900",
    indigo: "bg-indigo-100 text-indigo-900",
    green: "bg-emerald-100 text-emerald-900",
    purple: "bg-purple-100 text-purple-900",
    red: "bg-oxford-red/10 text-oxford-red",
    gray: "bg-muted-gray text-on-surface-variant",
  };
  return map[tone] ?? map.gray;
}
