// Cent-exact helpers (the backend compares amounts in cents, so the UI must too).
export const toCents = value => Math.round(Number(value) * 100);

// '45.5' -> 45.5 ; '' / 'abc' / '-3' / '1.234' / '0' -> null. Never throws.
export function parseAmount(raw) {
  const text = String(raw ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  return n > 0 ? n : null;
}
