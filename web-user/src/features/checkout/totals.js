export const toCents = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export function computeTotals({
  subtotal = 0,
  discount = 0,
  deliveryFee = 0,
  minOrderAmount = 0,
} = {}) {
  const sub = Math.max(0, toCents(subtotal));
  const disc = Math.min(Math.max(0, toCents(discount)), sub);
  const fee = Math.max(0, toCents(deliveryFee));
  const min = Math.max(0, toCents(minOrderAmount));
  return {
    subtotal: sub / 100,
    discount: disc / 100,
    deliveryFee: fee / 100,
    total: (sub - disc + fee) / 100,
    belowMinimum: min > 0 && sub < min,
    shortfall: min > 0 && sub < min ? (min - sub) / 100 : 0,
  };
}
