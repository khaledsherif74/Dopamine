import { describe, it, expect } from 'vitest';
import { fingerprint, nextAttempt, withOrder, newKey } from '../src/features/checkout/attempt.js';

const cart = (items = [{ productId: 'a', quantity: 1, customization: '' }]) => ({ supplierId: 's1', items });
const fp = (over = {}) => fingerprint({ cart: cart(), addressId: 'ad1', scheduledFor: null, promoCode: null, method: 'CARD', ...over });
let n = 0;
const makeKey = () => `key-${++n}`;

describe('fingerprint', () => {
  it('is stable for the same purchase, whatever the line order', () => {
    const a = fingerprint({ cart: cart([{ productId: 'a', quantity: 1 }, { productId: 'b', quantity: 2, customization: 'x' }]), method: 'CASH' });
    const b = fingerprint({ cart: cart([{ productId: 'b', quantity: 2, customization: 'x' }, { productId: 'a', quantity: 1 }]), method: 'CASH' });
    expect(a).toBe(b);
  });
  it('changes when anything that matters changes', () => {
    const base = fp();
    for (const other of [
      fp({ addressId: 'ad2' }), fp({ method: 'CASH' }), fp({ scheduledFor: '2026-10-25T10:00:00.000Z' }), fp({ promoCode: 'SAVE10' }),
      fp({ cart: cart([{ productId: 'a', quantity: 2 }]) }), fp({ cart: cart([{ productId: 'a', quantity: 1, customization: 'no nuts' }]) }),
    ]) expect(other).not.toBe(base);
  });
  it('promo codes compare case-insensitively', () => {
    expect(fp({ promoCode: 'save10' })).toBe(fp({ promoCode: ' SAVE10 ' }));
  });
});

describe('nextAttempt', () => {
  it('reuses the keys while the purchase is unchanged (retries are safe)', () => {
    const first = nextAttempt(null, fp(), makeKey);
    const again = nextAttempt(first, fp(), makeKey);
    expect(again).toBe(first);
    expect(first.orderKey).not.toBe(first.payKey);
  });
  it('a changed purchase gets fresh keys and forgets the old order', () => {
    const first = withOrder(nextAttempt(null, fp(), makeKey), 'order-1');
    const changed = nextAttempt(first, fp({ addressId: 'other' }), makeKey);
    expect(changed.orderKey).not.toBe(first.orderKey);
    expect(changed.orderId).toBe(null);
  });
  it('withOrder remembers the created order so a payment retry never creates a second one', () => {
    const a = withOrder(nextAttempt(null, fp(), makeKey), 'order-9');
    expect(nextAttempt(a, fp(), makeKey).orderId).toBe('order-9');
  });
});

describe('newKey', () => {
  it('produces unique, header-safe keys under 128 chars', () => {
    const keys = new Set(Array.from({ length: 50 }, newKey));
    expect(keys.size).toBe(50);
    for (const k of keys) expect(/^[A-Za-z0-9-]{16,128}$/.test(k)).toBe(true);
  });
});
