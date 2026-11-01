import { describe, it, expect } from 'vitest';
import { computeTotals, toCents } from '../src/features/checkout/totals.js';

describe('computeTotals (mirrors the backend)', () => {
  it('total = subtotal - discount + delivery fee', () => {
    expect(computeTotals({ subtotal: 200, discount: 20, deliveryFee: 20 })).toMatchObject({ subtotal: 200, discount: 20, deliveryFee: 20, total: 200 });
  });
  it('the discount never exceeds the subtotal (total never below the fee)', () => {
    expect(computeTotals({ subtotal: 30, discount: 500, deliveryFee: 20 })).toMatchObject({ discount: 30, total: 20 });
  });
  it('minimum order is checked on the subtotal BEFORE the discount', () => {
    const r = computeTotals({ subtotal: 90, discount: 50, deliveryFee: 10, minOrderAmount: 100 });
    expect(r.belowMinimum).toBe(true);
    expect(r.shortfall).toBe(10);
    expect(computeTotals({ subtotal: 100, discount: 90, minOrderAmount: 100 }).belowMinimum).toBe(false);
    expect(computeTotals({ subtotal: 10, minOrderAmount: 0 }).belowMinimum).toBe(false);
  });
  it('cent-exact (no 0.1 + 0.2 drift)', () => {
    expect(computeTotals({ subtotal: 0.1, deliveryFee: 0.2 }).total).toBe(0.3);
    expect(computeTotals({ subtotal: 19.99, discount: 4.5, deliveryFee: 20 }).total).toBe(35.49);
  });
  it('junk and negative inputs are treated as zero', () => {
    expect(computeTotals({ subtotal: 'abc', discount: -5, deliveryFee: null })).toMatchObject({ subtotal: 0, discount: 0, deliveryFee: 0, total: 0 });
    expect(computeTotals()).toMatchObject({ total: 0 });
    expect(toCents(undefined)).toBe(0);
  });
});
