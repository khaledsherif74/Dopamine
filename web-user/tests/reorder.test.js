import { describe, it, expect } from 'vitest';
import { buildReorderCart } from '../src/features/orders/reorder.js';
import { matchesFilter, canReorder } from '../src/features/orders/status.js';

const preview = (items, over = {}) => ({ canReorder: true, supplierId: 's1', supplierName: 'Sweet Shop', items, ...over });
const item = (over = {}) => ({ productId: 'p1', name: 'Cake', price: 100, imageUrl: null, requiresAdvanceOrder: false, supplierId: 's1', quantity: 2, requestedQuantity: 2, customization: null, adjustment: null, ...over });

describe('buildReorderCart', () => {
  it('builds a single-shop cart from the preview', () => {
    const { cart, summary, canReorder: ok } = buildReorderCart(preview([item(), item({ productId: 'p2', name: 'Pie', price: 45.5, quantity: 1, customization: 'no nuts' })]));
    expect(ok).toBe(true);
    expect(cart.supplierId).toBe('s1');
    expect(cart.supplierName).toBe('Sweet Shop');
    expect(cart.items.map(i => [i.productId, i.quantity, i.customization])).toEqual([['p1', 2, ''], ['p2', 1, 'no nuts']]);
    expect(summary).toEqual({ added: 2, reduced: 0, unavailable: 0 });
  });
  it('drops unavailable lines and counts reduced quantities', () => {
    const { cart, summary } = buildReorderCart(preview([item({ adjustment: 'unavailable', quantity: 0 }), item({ productId: 'p2', quantity: 1, requestedQuantity: 3, adjustment: 'quantity_reduced' })]));
    expect(cart.items.map(i => i.productId)).toEqual(['p2']);
    expect(summary).toEqual({ added: 1, reduced: 1, unavailable: 1 });
  });
  it('cannot reorder when nothing is left or the shop says no', () => {
    expect(buildReorderCart(preview([item({ adjustment: 'unavailable', quantity: 0 })])).canReorder).toBe(false);
    expect(buildReorderCart(preview([item()], { canReorder: false })).canReorder).toBe(false);
    expect(buildReorderCart(preview([])).cart.items).toEqual([]);
  });
  it('keeps the pre-order flag so checkout asks for a delivery time', () => {
    expect(buildReorderCart(preview([item({ requiresAdvanceOrder: true })])).cart.items[0].requiresAdvanceOrder).toBe(true);
  });
});

describe('orders tabs', () => {
  const o = status => ({ status });
  it('filters', () => {
    expect(matchesFilter(o('READY'), 'active')).toBe(true);
    expect(matchesFilter(o('DELIVERED'), 'active')).toBe(false);
    expect(matchesFilter(o('DELIVERED'), 'delivered')).toBe(true);
    expect(matchesFilter(o('CANCELLED'), 'cancelled')).toBe(true);
    expect(matchesFilter(o('REJECTED'), 'cancelled')).toBe(true);
    expect(matchesFilter(o('DELIVERED'), 'cancelled')).toBe(false);
    expect(matchesFilter(o('PENDING'), 'all')).toBe(true);
  });
  it('only closed orders can be ordered again', () => {
    expect(canReorder(o('DELIVERED'))).toBe(true);
    expect(canReorder(o('CANCELLED'))).toBe(true);
    expect(canReorder(o('PREPARING'))).toBe(false);
  });
});
