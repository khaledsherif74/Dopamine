import { distanceKm } from '../geo/geo.js';

// Mirrors backend/src/services/delivery.service.js:
//   accept: driver APPROVED and online, delivery UNASSIGNED with no driver (first to accept wins)
//   pickup: ASSIGNED -> PICKED_UP      deliver: PICKED_UP -> DELIVERED

// null when the driver may accept jobs, otherwise why not
export function acceptBlockReason(driver) {
  if (!driver || driver.status !== 'APPROVED') return 'notApproved';
  if (!driver.isOnline) return 'offline';
  return null;
}

export const canAccept = (driver, delivery) =>
  !!delivery && delivery.status === 'UNASSIGNED' && !delivery.driverId && acceptBlockReason(driver) === null;

export function nextStep(delivery) {
  if (delivery?.status === 'ASSIGNED') return 'pickup';
  if (delivery?.status === 'PICKED_UP') return 'deliver';
  return null;
}

// Cash the driver must collect: the whole order total for cash orders not yet paid.
export const cashToCollect = order => (order?.payment?.method === 'CASH' && order.payment.status !== 'PAID' ? order.total ?? 0 : 0);

export const driverFee = order => order?.deliveryFee ?? 0;

// Annotate with the distance (km) from `position` to the shop and sort nearest first.
// Unknown distances go last; the server's order (oldest first) breaks ties.
export function withDistance(deliveries, position) {
  const annotated = (deliveries ?? []).map((d, index) => ({ ...d, distanceKm: position ? distanceKm(position, d.order?.supplier) : null, index }));
  const rank = d => (d.distanceKm === null ? Infinity : d.distanceKm);
  const sorted = annotated.sort((a, b) => (rank(a) === rank(b) ? a.index - b.index : rank(a) - rank(b)));
  return sorted.map(({ index: _i, ...d }) => d);
}
