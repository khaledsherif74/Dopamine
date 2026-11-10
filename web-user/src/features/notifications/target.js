export function notificationTarget(n) {
  const orderId = n?.data?.orderId;
  if (typeof orderId === "string" && /^[\w-]{8,64}$/.test(orderId))
    return `/orders/${orderId}`;
  return null;
}
