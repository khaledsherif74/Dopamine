import { describe, it, expect } from 'vitest';
import { filterFromParams, filterToParams } from '../src/features/queue/filterUrl.js';
import { DEFAULT_FILTER } from '../src/features/queue/ticketQueue.js';
import { ownerOf } from '../src/features/tickets/owner.js';
import { safeRedirect } from '../src/lib/safeRedirect.js';

const P = obj => new URLSearchParams(obj);

describe('filter <-> URL', () => {
  it('empty URL gives the default view (Unassigned, active)', () => expect(filterFromParams(P({}))).toEqual(DEFAULT_FILTER));
  it('reads valid values', () => {
    expect(filterFromParams(P({ tab: 'mine', status: 'RESOLVED', priority: 'HIGH', category: 'REFUND', q: ' cake ' })))
      .toEqual({ tab: 'mine', status: 'RESOLVED', priority: 'HIGH', category: 'REFUND', search: 'cake' });
  });
  it('invalid values fall back to defaults instead of reaching the API', () => {
    expect(filterFromParams(P({ tab: 'admin', status: 'DROP TABLE', priority: 'x', category: '<b>' }))).toEqual(DEFAULT_FILTER);
    expect(filterFromParams(P({ q: 'a'.repeat(500) })).search.length).toBe(100);
  });
  it('writes only what differs from the default, and round-trips', () => {
    expect(filterToParams(DEFAULT_FILTER).toString()).toBe('');
    const f = { tab: 'all', status: 'ANY', priority: 'URGENT', category: 'PAYMENT', search: 'late' };
    expect(filterFromParams(filterToParams(f))).toEqual(f);
  });
});

describe('ticket owner', () => {
  it('customer, supplier and driver', () => {
    expect(ownerOf({ user: { name: 'Ann', email: 'a@x.io', phone: '+2010' }, userId: 'u1' })).toEqual({ role: 'USER', name: 'Ann', email: 'a@x.io', phone: '+2010' });
    expect(ownerOf({ supplier: { shopName: 'Sweet Co', email: 's@x.io', phone: '+2011' } })).toEqual({ role: 'SUPPLIER', name: 'Sweet Co', email: 's@x.io', phone: '+2011' });
    expect(ownerOf({ driver: { name: 'Omar', email: null, phone: '+2012' } })).toEqual({ role: 'DRIVER', name: 'Omar', email: null, phone: '+2012' });
  });
  it('a live-created stub only knows the role', () => {
    expect(ownerOf({ ownerRole: 'SUPPLIER' })).toEqual({ role: 'SUPPLIER', name: null, email: null, phone: null });
    expect(ownerOf({})).toEqual({ role: null, name: null, email: null, phone: null });
    expect(ownerOf(null)).toEqual({ role: null, name: null, email: null, phone: null });
  });
});

describe('post-login redirect', () => {
  it('keeps same-app paths', () => {
    expect(safeRedirect('/tickets/abc?x=1')).toBe('/tickets/abc?x=1');
    expect(safeRedirect('/')).toBe('/');
  });
  it('rejects everything else', () => {
    for (const bad of ['//evil.test', 'https://evil.test', '/\\evil', 'javascript:alert(1)', '', undefined, null, 5, '/login', '/change-password?x=1', 'x'.repeat(400)]) expect(safeRedirect(bad)).toBe('/');
  });
});
