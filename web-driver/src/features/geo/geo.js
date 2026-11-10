export const validCoords = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const rad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(a, b) {
  if (!a || !b || !validCoords(a.lat, a.lng) || !validCoords(b.lat, b.lng))
    return null;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const TEXT_MAX = 200;

export function mapsLink(place) {
  if (!place) return null;
  const base = "https://www.google.com/maps/dir/?api=1&destination=";
  if (validCoords(place.lat, place.lng))
    return `${base}${place.lat},${place.lng}`;
  const text =
    typeof place.text === "string" ? place.text.trim().slice(0, TEXT_MAX) : "";
  return text ? `${base}${encodeURIComponent(text)}` : null;
}
