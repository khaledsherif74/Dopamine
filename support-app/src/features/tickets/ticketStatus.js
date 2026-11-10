export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
export const TICKET_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const TICKET_CATEGORIES = ['ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'REFUND', 'OTHER'];

export function ticketTone(status) {
  if (status === 'RESOLVED') return 'success';
  if (status === 'CLOSED') return 'neutral';
  if (status === 'IN_PROGRESS') return 'primary';
  return 'warning';
}

export function priorityTone(priority) {
  if (priority === 'URGENT') return 'danger';
  if (priority === 'HIGH') return 'warning';
  if (priority === 'LOW') return 'neutral';
  return 'primary';
}
