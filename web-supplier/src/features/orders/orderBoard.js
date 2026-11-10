const paidOrCash = (payment) =>
  !!payment && (payment.method === "CASH" || payment.status === "PAID");

export const paymentBlocksAccept = (order) =>
  order?.status === "PENDING" && !paidOrCash(order.payment);

export function availableActions(order) {
  const s = order?.status;
  return {
    accept: s === "PENDING" && paidOrCash(order.payment),
    reject: s === "PENDING",
    startPreparing: s === "ACCEPTED",
    markReady: s === "PREPARING",
    cancel: s === "ACCEPTED" || s === "PREPARING",
  };
}

export function primaryAction(order) {
  const a = availableActions(order);
  if (a.accept) return "accept";
  if (a.startPreparing) return "startPreparing";
  if (a.markReady) return "markReady";
  return null;
}

const COLUMN = {
  PENDING: "new",
  ACCEPTED: "inProgress",
  PREPARING: "inProgress",
  READY: "handover",
  OUT_FOR_DELIVERY: "handover",
};
export const boardColumn = (status) => COLUMN[status] ?? "done";

const ms = (iso) => Date.parse(iso) || 0;
const dueAt = (o) => ms(o.scheduledFor ?? o.createdAt);

export function groupBoard(orders) {
  const cols = { new: [], inProgress: [], handover: [], done: [] };
  for (const o of orders ?? []) cols[boardColumn(o.status)].push(o);
  cols.new.sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  cols.inProgress.sort((a, b) => dueAt(a) - dueAt(b));
  cols.handover.sort((a, b) => dueAt(a) - dueAt(b));
  cols.done.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  return cols;
}

const result = (body, errors) => ({
  ok: Object.keys(errors).length === 0,
  body,
  errors,
});

export function buildRejectBody({ reason = "" } = {}) {
  const r = String(reason).trim();
  const errors = {};
  if (!r) errors.reason = "orders.errors.reasonRequired";
  else if (r.length > 300) errors.reason = "orders.errors.reasonTooLong";
  return result({ reason: r }, errors);
}

export function buildCancelBody({ reason = "" } = {}) {
  const r = String(reason).trim();
  const errors = {};
  if (r.length < 3) errors.reason = "orders.errors.reasonShort";
  else if (r.length > 300) errors.reason = "orders.errors.reasonTooLong";
  return result({ reason: r }, errors);
}

export function minutesSince(iso, now = new Date()) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 60000));
}
