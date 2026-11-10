import { distanceKm, validCoords } from './geo.js';

export const MIN_INTERVAL_MS = 2 * 60 * 1000; // never send more often than this
export const HEARTBEAT_MS = 10 * 60 * 1000; // send even when standing still
export const MIN_MOVE_KM = 0.05; // 50 m

// GeolocationPosition -> { lat, lng, accuracy } rounded to ~1 m, or null when unusable
export function toPosition(geo) {
  const c = geo?.coords;
  if (!c || !validCoords(c.latitude, c.longitude)) return null;
  const round = n => Math.round(n * 1e5) / 1e5;
  return { lat: round(c.latitude), lng: round(c.longitude), accuracy: c.accuracy };
}

export function geoErrorKey(code) {
  if (code === 1) return 'location.denied';
  if (code === 3) return 'location.timeout';
  return 'location.unavailable';
}

// `last` = { at, lat, lng } of the last position the SERVER accepted (or null).
export function shouldSendLocation({ last, next, now }) {
  if (!next || !validCoords(next.lat, next.lng)) return false;
  if (!last) return true;
  const elapsed = now - last.at;
  if (elapsed < MIN_INTERVAL_MS) return false;
  if (elapsed >= HEARTBEAT_MS) return true;
  return (distanceKm(last, next) ?? Infinity) >= MIN_MOVE_KM;
}

// PATCH /drivers/me/availability body: coordinates only when going online with a usable fix.
export function availabilityBody(isOnline, position) {
  if (isOnline && position && validCoords(position.lat, position.lng)) return { isOnline: true, lat: position.lat, lng: position.lng };
  return { isOnline: !!isOnline };
}
