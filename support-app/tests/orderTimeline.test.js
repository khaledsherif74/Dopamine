import { describe, it, expect } from 'vitest';
import { buildTimeline } from '../src/features/orders/timeline.js';
import { notificationTarget } from '../src/features/notifications/target.js';

const base = { id: 'o1', status: 'PENDING', createdAt: '2026-11-01T10:00:00Z', acceptedAt: null, updatedAt: '2026-11-01T10:00:00Z', delivery: null };

describe('order timeline (only what the data proves)', () => {
  it('a new order has just "placed"', () => {
    expect(buildTimeline(base)).toEqual([{ key: 'placed', at: '2026-11-01T10:00:00Z' }]);
  });
  it('accepted, picked up and delivered appear in time order', () => {
    const o = { ...base, status: 'DELIVERED', acceptedAt: '2026-11-01T10:05:00Z', delivery: { status: 'DELIVERED', pickedUpAt: '2026-11-01T10:40:00Z', deliveredAt: '2026-11-01T11:00:00Z' } };
    expect(buildTimeline(o).map(e => e.key)).toEqual(['placed', 'accepted', 'pickedUp', 'delivered']);
  });
  it('cancelled / rejected end with their own entry stamped with the last update', () => {
    expect(buildTimeline({ ...base, status: 'CANCELLED', updatedAt: '2026-11-01T10:20:00Z' }).map(e => e.key)).toEqual(['placed', 'cancelled']);
    expect(buildTimeline({ ...base, status: 'REJECTED', updatedAt: '2026-11-01T10:02:00Z' }).map(e => e.key)).toEqual(['placed', 'rejected']);
  });
  it('cancelled prefers the real cancelledAt over updatedAt', () => {
    const o = { ...base, status: 'CANCELLED', cancelledAt: '2026-11-01T10:30:00Z', updatedAt: '2026-11-02T00:00:00Z' };
    expect(buildTimeline(o)).toEqual([{ key: 'placed', at: '2026-11-01T10:00:00Z' }, { key: 'cancelled', at: '2026-11-01T10:30:00Z' }]);
  });
  it('sorts by time even if the data arrives out of order and survives junk', () => {
    const o = { ...base, status: 'DELIVERED', acceptedAt: 'not a date', delivery: { deliveredAt: '2026-11-01T12:00:00Z', pickedUpAt: '2026-11-01T11:00:00Z' } };
    expect(buildTimeline(o).map(e => e.key)).toEqual(['placed', 'pickedUp', 'delivered']);
    expect(buildTimeline(null)).toEqual([]);
  });
});

describe('notification targets (same-app paths from validated ids only)', () => {
  it('order and ticket ids', () => {
    expect(notificationTarget({ data: { orderId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } })).toBe('/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(notificationTarget({ data: { ticketId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } })).toBe('/tickets/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  });
  it('a ticket wins over an order when both are present', () => {
    expect(notificationTarget({ data: { orderId: 'aaaaaaaa-1', ticketId: 'bbbbbbbb-2' } })).toBe('/tickets/bbbbbbbb-2');
  });
  it('rejects anything that is not a plain id (no open redirects, no traversal)', () => {
    for (const bad of ['../x', 'https://evil.test', '//evil', 'a b c d e f g h', 'short', '', 5, null, { x: 1 }]) {
      expect(notificationTarget({ data: { orderId: bad } })).toBeNull();
      expect(notificationTarget({ data: { ticketId: bad } })).toBeNull();
    }
    expect(notificationTarget(null)).toBeNull();
    expect(notificationTarget({})).toBeNull();
  });
});
