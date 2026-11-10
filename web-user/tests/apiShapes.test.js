import { describe, it, expect } from 'vitest';
import { unwrapList } from '../src/api/transforms.js';

// The API wraps every payload as { success, data }, and list endpoints put the array under a key:
// GET /orders/:id/refunds -> { success: true, data: { refunds: [...] } }
describe('unwrapList', () => {
  const refund = { id: 'r1', status: 'REQUESTED' };
  it('reads the array under its key (the real shape of GET /orders/:id/refunds)', () => {
    expect(unwrapList({ success: true, data: { refunds: [refund] } }, 'refunds')).toEqual([refund]);
  });
  it('still accepts a bare array in data', () => expect(unwrapList({ data: [refund] }, 'refunds')).toEqual([refund]));
  it('always returns an ARRAY, so .some / .map / .length never crash the page', () => {
    for (const bad of [undefined, null, {}, { data: null }, { data: {} }, { data: { refunds: null } }, { data: { refunds: 'x' } }, { data: { refunds: { a: 1 } } }, { data: 5 }]) {
      const out = unwrapList(bad, 'refunds');
      expect(Array.isArray(out)).toBe(true);
      expect(out).toEqual([]);
    }
  });
  it('does not pick up a different key', () => expect(unwrapList({ data: { orders: [refund] } }, 'refunds')).toEqual([]));
});
