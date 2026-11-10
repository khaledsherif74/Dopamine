import { describe, it, expect } from 'vitest';
import { notificationTarget } from '../src/features/notifications/target.js';
import { safeRedirect } from '../src/lib/safeRedirect.js';
import { shortId } from '../src/lib/ids.js';
import { statusTone } from '../src/features/orders/status.js';
import { ticketTone } from '../src/features/support/ticketStatus.js';

const ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('notification targets (supplier app)', () => {
  it('order and support-ticket ids map to this app\'s routes', () => {
    expect(notificationTarget({ data: { orderId: ID } })).toBe(`/orders/${ID}`);
    expect(notificationTarget({ data: { ticketId: ID } })).toBe(`/support/${ID}`);
  });
  it('a ticket wins over an order; anything that is not a plain id is refused', () => {
    expect(notificationTarget({ data: { orderId: 'aaaaaaaa-1', ticketId: 'bbbbbbbb-2' } })).toBe('/support/bbbbbbbb-2');
    for (const bad of ['../x', 'https://evil.test', '//evil', 'a b c d e f g h', 'short', '', 5, null]) {
      expect(notificationTarget({ data: { orderId: bad } })).toBeNull();
    }
    expect(notificationTarget(null)).toBeNull();
  });
});

describe('post-login redirect', () => {
  it('keeps same-app paths, refuses everything else', () => {
    expect(safeRedirect('/orders/abc?x=1')).toBe('/orders/abc?x=1');
    for (const bad of ['//evil.test', 'https://evil.test', '/\\evil', 'javascript:alert(1)', '', undefined, 5, '/login', 'x'.repeat(400)]) expect(safeRedirect(bad)).toBe('/');
  });
});

describe('small helpers', () => {
  it('shortId is the first 8 chars, upper-case', () => {
    expect(shortId(ID)).toBe('A1B2C3D4');
    expect(shortId(null)).toBe('');
  });
  it('tones', () => {
    expect(statusTone('PENDING')).toBe('warning');
    expect(statusTone('DELIVERED')).toBe('success');
    expect(statusTone('CANCELLED')).toBe('danger');
    expect(statusTone('PREPARING')).toBe('primary');
    expect(ticketTone('RESOLVED')).toBe('success');
  });
});
