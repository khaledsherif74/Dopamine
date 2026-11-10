const valid = (iso) =>
  typeof iso === "string" && !Number.isNaN(Date.parse(iso)) ? iso : null;

export function buildTimeline(order) {
  if (!order) return [];
  const entries = [];
  const add = (key, at) => {
    const v = valid(at);
    if (v) entries.push({ key, at: v });
  };
  add("placed", order.createdAt);
  add("accepted", order.acceptedAt);
  add("pickedUp", order.delivery?.pickedUpAt);
  add("delivered", order.delivery?.deliveredAt);
  if (order.status === "CANCELLED")
    add("cancelled", order.cancelledAt ?? order.updatedAt);
  if (order.status === "REJECTED") add("rejected", order.updatedAt);
  return entries.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
