export function statusTone(status) {
  if (status === 'DELIVERED') return 'success';
  if (status === 'CANCELLED' || status === 'REJECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'primary';
}
