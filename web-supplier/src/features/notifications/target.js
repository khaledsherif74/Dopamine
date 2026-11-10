const ID = /^[\w-]{8,64}$/;

export function notificationTarget(n) {
  const ticketId = n?.data?.ticketId;
  if (typeof ticketId === "string" && ID.test(ticketId))
    return `/support/${ticketId}`;
  const orderId = n?.data?.orderId;
  if (typeof orderId === "string" && ID.test(orderId))
    return `/orders/${orderId}`;
  return null;
}
