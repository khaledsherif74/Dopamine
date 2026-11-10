import { describe, it, expect } from 'vitest';
import { notificationTarget } from '../src/features/notifications/target.js';
import { safeRedirect } from '../src/lib/safeRedirect.js';
import { shortId } from '../src/lib/ids.js';

const ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('notification targets (driver app)', () => {
  it('support ticket and active delivery map to this app\'s routes', () => {
    expect(notificationTarget({ data: { ticketId: ID } })).toBe(`/support/${ID}`);
    expect(notificationTarget({ data: { deliveryId: ID, orderId: 'o'.repeat(10) } })).toBe(`/deliveries/${ID}`);
  });
  it('a new available delivery opens the job list, not a delivery page the driver does not own yet', () => {
    expect(notificationTarget({ data: { deliveryId: ID, kind: 'AVAILABLE_DELIVERY' } })).toBe('/');
  });
  it('a ticket wins; junk ids and non-objects are refused', () => {
    expect(notificationTarget({ data: { ticketId: 'bbbbbbbb-2', deliveryId: ID } })).toBe('/support/bbbbbbbb-2');
    for (const bad of ['../x', 'https://evil.test', '//evil', 'a b c d e f g h', 'short', '', 5, null]) {
      expect(notificationTarget({ data: { deliveryId: bad } })).toBeNull();
      expect(notificationTarget({ data: { ticketId: bad } })).toBeNull();
    }
    expect(notificationTarget(null)).toBeNull();
    expect(notificationTarget({})).toBeNull();
  });
});

describe('post-login redirect', () => {
  it('keeps same-app paths, refuses everything else', () => {
    expect(safeRedirect('/deliveries/abc?x=1')).toBe('/deliveries/abc?x=1');
    for (const bad of ['//evil.test', 'https://evil.test', '/\\evil', 'javascript:alert(1)', '', undefined, 5, '/login', 'x'.repeat(400)]) expect(safeRedirect(bad)).toBe('/');
  });
});

describe('short ids', () => {
  it('first 8 chars, upper-case', () => {
    expect(shortId(ID)).toBe('A1B2C3D4');
    expect(shortId(null)).toBe('');
  });
});
