// Where a notification should take the user. Only same-app paths, built from a validated id
// (the notification `data` comes from the server but is never used as a raw URL).
export function notificationTarget(n) {
  const orderId = n?.data?.orderId;
  if (typeof orderId === 'string' && /^[\w-]{8,64}$/.test(orderId)) return `/orders/${orderId}`;
  return null;
}
