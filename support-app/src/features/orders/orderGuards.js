import { parseAmount, toCents } from "../../lib/money.js";

export const FORCE_CANCEL_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];
const TERMINAL_ORDER = ["DELIVERED", "CANCELLED", "REJECTED"];
const COUNTS_AGAINST_CAP = ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED"];
const REASON_MIN = 3;
const REASON_MAX = 300;

export const canForceCancel = (order) =>
  !!order && FORCE_CANCEL_STATUSES.includes(order.status);

export function needsRefundDecision(order) {
  const p = order?.payment;
  return (
    !!p &&
    p.method !== "CASH" &&
    (p.status === "PAID" || p.status === "PARTIALLY_REFUNDED")
  );
}

export function refundableRemaining(payment, refunds) {
  if (!payment) return 0;
  const used = (refunds ?? [])
    .filter((r) => COUNTS_AGAINST_CAP.includes(r.status))
    .reduce((sum, r) => sum + toCents(r.amount), 0);
  return Math.max(0, toCents(payment.amount) - used) / 100;
}

export function buildForceCancelBody(
  { reason = "", decision = "", amount = "" } = {},
  order,
  { remaining } = {},
) {
  const errors = {};
  const r = String(reason).trim();
  if (r.length < REASON_MIN) errors.reason = "orders.errors.reasonRequired";
  else if (r.length > REASON_MAX) errors.reason = "orders.errors.reasonTooLong";
  const body = { reason: r };

  if (needsRefundDecision(order)) {
    if (!["FULL", "PARTIAL", "NONE"].includes(decision)) {
      errors.decision = "orders.errors.decisionRequired";
    } else if (decision === "PARTIAL") {
      const value = parseAmount(amount);
      const cap = remaining ?? order.payment.amount;
      if (value === null) errors.amount = "orders.errors.amount";
      else if (toCents(value) > toCents(cap))
        errors.amount = "orders.errors.amountTooHigh";
      else body.refund = { type: "PARTIAL", amount: value };
    } else {
      body.refund = { type: decision };
    }
  }
  return { ok: Object.keys(errors).length === 0, body, errors };
}

export function canReassignDriver(order) {
  if (!order?.delivery || TERMINAL_ORDER.includes(order.status)) return false;
  return !["DELIVERED", "CANCELLED"].includes(order.delivery.status);
}
