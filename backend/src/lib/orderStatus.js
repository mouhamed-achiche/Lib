const ORDER_STATUS = {
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

const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING_APPROVAL_CALL]: [
    ORDER_STATUS.APPROVED_NEED_DELIVERY,
    ORDER_STATUS.NO_ANSWER_ON_CALL,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.APPROVED_DELIVERED,
  ],
  [ORDER_STATUS.NO_ANSWER_ON_CALL]: [
    ORDER_STATUS.PENDING_APPROVAL_CALL,
    ORDER_STATUS.APPROVED_NEED_DELIVERY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.APPROVED_DELIVERED,
  ],
  [ORDER_STATUS.APPROVED_NEED_DELIVERY]: [
    ORDER_STATUS.ON_DELIVERY,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.APPROVED_DELIVERED,
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

const ALL_STATUSES = Object.values(ORDER_STATUS);

function normalizeOrderStatus(status) {
  if (ALL_STATUSES.includes(status)) return status;
  const legacy = {
    pending: ORDER_STATUS.PENDING_APPROVAL_CALL,
    processing: ORDER_STATUS.APPROVED_NEED_DELIVERY,
    confirmed: ORDER_STATUS.APPROVED_NEED_DELIVERY,
    shipped: ORDER_STATUS.ON_DELIVERY,
    delivered: ORDER_STATUS.APPROVED_DELIVERED,
    completed: ORDER_STATUS.APPROVED_DELIVERED,
    cancelled: ORDER_STATUS.CANCELLED,
  };
  return legacy[status] ?? ORDER_STATUS.PENDING_APPROVAL_CALL;
}

function getNextOrderStatuses(status) {
  const normalized = normalizeOrderStatus(status);
  return ORDER_STATUS_TRANSITIONS[normalized] ?? [];
}

function canTransitionTo(currentStatus, nextStatus) {
  return getNextOrderStatuses(currentStatus).includes(nextStatus);
}

function normalizePhone(phone) {
  return String(phone ?? "").replace(/\D/g, "");
}

function parseOrderReference(reference) {
  const trimmed = String(reference ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("order-") ? trimmed : `order-${trimmed}`;
}

module.exports = {
  ORDER_STATUS,
  ALL_STATUSES,
  normalizeOrderStatus,
  getNextOrderStatuses,
  canTransitionTo,
  normalizePhone,
  parseOrderReference,
};
