import { describe, it, expect } from 'vitest';
import { notificationTarget } from '../src/features/notifications/target.js';

describe('notificationTarget', () => {
  it('opens the order for order notifications', () => {
    expect(notificationTarget({ data: { orderId: '11111111-1111-4111-8111-111111111111' } })).toBe('/orders/11111111-1111-4111-8111-111111111111');
  });
  it('ignores anything that is not a plain id (no path or URL injection)', () => {
    for (const bad of ['../admin', 'https://evil.com', '/x/y', 'a b c d e f g h', 'short', '', null, 42, {}]) {
      expect(notificationTarget({ data: { orderId: bad } })).toBe(null);
    }
    expect(notificationTarget({})).toBe(null);
    expect(notificationTarget(undefined)).toBe(null);
  });
});
