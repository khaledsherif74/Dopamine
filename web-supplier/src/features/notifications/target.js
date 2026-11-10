// Where a notification should take the agent. Only same-app paths built from a validated id
// (the notification `data` comes from the server, but is never used as a raw URL).
const ID = /^[\w-]{8,64}$/;

export function notificationTarget(n) {
  const ticketId = n?.data?.ticketId;
  if (typeof ticketId === 'string' && ID.test(ticketId)) return `/support/${ticketId}`;
  const orderId = n?.data?.orderId;
  if (typeof orderId === 'string' && ID.test(orderId)) return `/orders/${orderId}`;
  return null;
}
