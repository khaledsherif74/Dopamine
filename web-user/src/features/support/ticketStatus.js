export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function ticketTone(status) {
  if (status === 'RESOLVED') return 'success';
  if (status === 'CLOSED') return 'neutral';
  if (status === 'IN_PROGRESS') return 'primary';
  return 'warning';
}
