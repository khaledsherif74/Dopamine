export const TIMELINE = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];
const TERMINAL = new Set(["DELIVERED", "CANCELLED", "REJECTED"]);
const FAILED = new Set(["CANCELLED", "REJECTED"]);

export const isTerminal = (status) => TERMINAL.has(status);
export const isFailed = (status) => FAILED.has(status);
export const isActive = (order) => !!order && !TERMINAL.has(order.status);

export const stepIndex = (status) => TIMELINE.indexOf(status);

export function statusTone(status) {
  if (status === "DELIVERED") return "success";
  if (status === "CANCELLED" || status === "REJECTED") return "danger";
  if (status === "PENDING") return "warning";
  return "primary";
}

const isOnline = (payment) => !!payment && payment.method !== "CASH";

export function canPayNow(order) {
  if (!order || order.status !== "PENDING") return false;
  const p = order.payment;
  return !p || (isOnline(p) && p.status !== "PAID");
}

export const canReview = (order) =>
  !!order && order.status === "DELIVERED" && !order.review;

export function paymentOutcome(payment) {
  if (!payment) return "unknown";
  if (payment.method === "CASH") return "cash";
  if (
    payment.status === "PAID" ||
    payment.status === "REFUNDED" ||
    payment.status === "PARTIALLY_REFUNDED"
  )
    return "paid";
  if (payment.status === "FAILED") return "failed";
  return "pending";
}

export const shortId = (id) =>
  String(id ?? "")
    .slice(0, 8)
    .toUpperCase();

export function matchesFilter(order, filter) {
  switch (filter) {
    case "active":
      return isActive(order);
    case "delivered":
      return order.status === "DELIVERED";
    case "cancelled":
      return isFailed(order.status);
    default:
      return true;
  }
}

export const canReorder = (order) => !!order && isTerminal(order.status);
