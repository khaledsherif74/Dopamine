// Who opened the ticket. A ticket row has exactly one of user / supplier / driver; a ticket
// created live (support:ticket_created) has none of them yet, only `ownerRole`.
export function ownerOf(ticket) {
  const none = { role: null, name: null, email: null, phone: null };
  if (!ticket) return none;
  if (ticket.user) return { role: 'USER', name: ticket.user.name ?? null, email: ticket.user.email ?? null, phone: ticket.user.phone ?? null };
  if (ticket.supplier) return { role: 'SUPPLIER', name: ticket.supplier.shopName ?? null, email: ticket.supplier.email ?? null, phone: ticket.supplier.phone ?? null };
  if (ticket.driver) return { role: 'DRIVER', name: ticket.driver.name ?? null, email: ticket.driver.email ?? null, phone: ticket.driver.phone ?? null };
  return { ...none, role: ticket.ownerRole ?? null };
}
