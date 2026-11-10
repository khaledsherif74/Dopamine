const ID = /^[\w-]{8,64}$/;

export function notificationTarget(n) {
  const d = n?.data;
  if (typeof d?.ticketId === "string" && ID.test(d.ticketId))
    return `/support/${d.ticketId}`;
  if (
    typeof d?.deliveryId === "string" &&
    ID.test(d.deliveryId) &&
    d.kind !== "AVAILABLE_DELIVERY"
  )
    return `/deliveries/${d.deliveryId}`;
  if (d?.kind === "AVAILABLE_DELIVERY") return "/";
  return null;
}
