export const toCents = (value) => Math.round(Number(value) * 100);

export function parseAmount(raw) {
  const text = String(raw ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  return n > 0 ? n : null;
}
