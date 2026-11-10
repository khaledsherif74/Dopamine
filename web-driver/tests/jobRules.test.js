import { describe, it, expect } from 'vitest';
import { acceptBlockReason, canAccept, nextStep, cashToCollect, driverFee, withDistance } from '../src/features/jobs/jobRules.js';

const me = (over = {}) => ({ id: 'd1', status: 'APPROVED', isOnline: true, ...over });
const job = (over = {}) => ({ id: 'j1', status: 'UNASSIGNED', driverId: null, order: { id: 'o1', total: 120, deliveryFee: 20, payment: { method: 'CARD', status: 'PAID' }, supplier: { lat: 30.0, lng: 31.0 } }, ...over });

describe('may this driver accept jobs? (mirrors delivery.service.acceptDelivery)', () => {
  it('approved + online: yes', () => {
    expect(acceptBlockReason(me())).toBeNull();
    expect(canAccept(me(), job())).toBe(true);
  });
  it('not approved wins over offline', () => {
    expect(acceptBlockReason(me({ status: 'PENDING', isOnline: false }))).toBe('notApproved');
    expect(acceptBlockReason(me({ status: 'SUSPENDED' }))).toBe('notApproved');
  });
  it('offline', () => expect(acceptBlockReason(me({ isOnline: false }))).toBe('offline'));
  it('no profile loaded yet: not allowed', () => expect(acceptBlockReason(null)).toBe('notApproved'));
  it('only an UNASSIGNED job nobody holds can be accepted', () => {
    expect(canAccept(me(), job({ status: 'ASSIGNED' }))).toBe(false);
    expect(canAccept(me(), job({ driverId: 'other' }))).toBe(false);
    expect(canAccept(me({ isOnline: false }), job())).toBe(false);
    expect(canAccept(me(), null)).toBe(false);
  });
});

describe('next delivery step', () => {
  it('ASSIGNED -> pickup, PICKED_UP -> deliver, anything else -> none', () => {
    expect(nextStep({ status: 'ASSIGNED' })).toBe('pickup');
    expect(nextStep({ status: 'PICKED_UP' })).toBe('deliver');
    for (const s of ['UNASSIGNED', 'DELIVERED', 'CANCELLED', undefined]) expect(nextStep({ status: s })).toBeNull();
    expect(nextStep(null)).toBeNull();
  });
});

describe('money', () => {
  it('cash to collect = order total, only for cash that is not paid yet', () => {
    expect(cashToCollect({ total: 120, payment: { method: 'CASH', status: 'PENDING' } })).toBe(120);
    expect(cashToCollect({ total: 120, payment: { method: 'CASH', status: 'PAID' } })).toBe(0);
    expect(cashToCollect({ total: 120, payment: { method: 'CARD', status: 'PAID' } })).toBe(0);
    expect(cashToCollect({ total: 120, payment: null })).toBe(0);
    expect(cashToCollect(null)).toBe(0);
  });
  it('the driver fee is the order delivery fee', () => {
    expect(driverFee({ deliveryFee: 20 })).toBe(20);
    expect(driverFee({})).toBe(0);
    expect(driverFee(null)).toBe(0);
  });
});

describe('available jobs sorted by distance to the shop', () => {
  const at = (id, lat, lng) => job({ id, order: { ...job().order, supplier: lat == null ? null : { lat, lng } } });
  it('nearest first, unknown distance last, original (server) order breaks ties', () => {
    const list = [at('far', 30.5, 31.0), at('none', null), at('near', 30.01, 31.0), at('also-near', 30.01, 31.0)];
    const out = withDistance(list, { lat: 30.0, lng: 31.0 });
    expect(out.map(j => j.id)).toEqual(['near', 'also-near', 'far', 'none']);
    expect(out[0].distanceKm).toBeGreaterThan(0.9);
    expect(out[0].distanceKm).toBeLessThan(1.3);
    expect(out[3].distanceKm).toBeNull();
  });
  it('without my position the server order is kept and nothing has a distance', () => {
    const list = [at('a', 30.5, 31.0), at('b', 30.01, 31.0)];
    const out = withDistance(list, null);
    expect(out.map(j => j.id)).toEqual(['a', 'b']);
    expect(out.every(j => j.distanceKm === null)).toBe(true);
  });
  it('does not mutate its input', () => {
    const list = [at('a', 30.5, 31.0), at('b', 30.01, 31.0)];
    withDistance(list, { lat: 30, lng: 31 });
    expect(list.map(j => j.id)).toEqual(['a', 'b']);
    expect('distanceKm' in list[0]).toBe(false);
  });
});
