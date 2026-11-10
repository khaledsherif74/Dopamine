import { describe, it, expect } from 'vitest';
import { shopFormFrom, validateShop, diffShop } from '../src/features/shop/shopForm.js';
import { validateSupplierRegistration } from '../src/features/auth/registerForm.js';

const supplier = { shopName: 'Sweet Co', address: '1 Nile St', phone: '+201000000000', lat: 31.4, lng: 31.8, isAcceptingOrders: true, opensAt: '09:00', closesAt: '22:00' };

describe('shop settings form (mirrors updateSupplierProfileSchema)', () => {
  it('round-trips the profile into form strings', () => {
    expect(shopFormFrom(supplier)).toEqual({ shopName: 'Sweet Co', address: '1 Nile St', phone: '+201000000000', lat: '31.4', lng: '31.8', isAcceptingOrders: true, opensAt: '09:00', closesAt: '22:00' });
    expect(shopFormFrom({ shopName: 'X', phone: '+201000000001' })).toMatchObject({ address: '', lat: '', lng: '', opensAt: '', closesAt: '', isAcceptingOrders: true });
  });
  const form = o => ({ ...shopFormFrom(supplier), ...o });
  it('no change -> nothing to send', () => {
    const r = validateShop(form({}), supplier);
    expect(r.ok).toBe(true);
    expect(r.body).toEqual({});
  });
  it('sends only changed fields, converting numbers', () => {
    const r = validateShop(form({ shopName: ' New Name ', lat: '30.5', isAcceptingOrders: false }), supplier);
    expect(r.body).toEqual({ shopName: 'New Name', lat: 30.5, isAcceptingOrders: false });
  });
  it('shop name 2..120, address <= 255, phone E.164-ish', () => {
    expect(validateShop(form({ shopName: 'a' }), supplier).errors.shopName).toBe('shop.errors.name');
    expect(validateShop(form({ address: 'x'.repeat(256) }), supplier).errors.address).toBe('shop.errors.addressLong');
    for (const p of ['123', '+0123456789', 'abc', '00201000000000']) expect(validateShop(form({ phone: p }), supplier).errors.phone).toBe('shop.errors.phone');
    expect(validateShop(form({ phone: '201111111111' }), supplier).ok).toBe(true);
  });
  it('opening hours: both or neither, HH:MM, both cleared sends nulls', () => {
    expect(validateShop(form({ closesAt: '' }), supplier).errors.hours).toBe('shop.errors.hoursPair');
    expect(validateShop(form({ opensAt: '', closesAt: '' }), supplier).body).toEqual({ opensAt: null, closesAt: null });
    expect(validateShop(form({ opensAt: '25:00' }), supplier).errors.hours).toBe('shop.errors.hoursFormat');
    expect(validateShop(form({ opensAt: '08:30', closesAt: '23:15' }), supplier).body).toEqual({ opensAt: '08:30', closesAt: '23:15' });
    const noHours = { ...supplier, opensAt: null, closesAt: null };
    expect(validateShop({ ...shopFormFrom(noHours), opensAt: '09:00', closesAt: '' }, noHours).errors.hours).toBe('shop.errors.hoursPair');
  });
  it('coordinates: both or neither, within range', () => {
    expect(validateShop(form({ lat: '91' }), supplier).errors.lat).toBe('shop.errors.lat');
    expect(validateShop(form({ lng: '-181' }), supplier).errors.lng).toBe('shop.errors.lng');
    expect(validateShop(form({ lat: 'x' }), supplier).errors.lat).toBe('shop.errors.lat');
  });
  it('diffShop ignores equal values', () => {
    expect(diffShop(supplier, { shopName: 'Sweet Co', phone: '+201000000000' })).toEqual({});
  });
});

describe('supplier registration form (mirrors registerSupplierSchema)', () => {
  const base = { shopName: 'Sweet Co', email: ' Shop@Example.com ', phone: '+201000000000', password: 'Passw0rd1', address: '', acceptTerms: true };
  it('valid -> trimmed body without the terms flag; empty address omitted', () => {
    expect(validateSupplierRegistration(base)).toEqual({ ok: true, errors: {}, body: { shopName: 'Sweet Co', email: 'shop@example.com', phone: '+201000000000', password: 'Passw0rd1' } });
    expect(validateSupplierRegistration({ ...base, address: ' 1 Nile ' }).body.address).toBe('1 Nile');
  });
  it('field errors', () => {
    expect(validateSupplierRegistration({ ...base, shopName: 'a' }).errors.shopName).toBe('shop.errors.name');
    expect(validateSupplierRegistration({ ...base, email: 'nope' }).errors.email).toBe('validation.emailInvalid');
    expect(validateSupplierRegistration({ ...base, phone: '12' }).errors.phone).toBe('shop.errors.phone');
    expect(validateSupplierRegistration({ ...base, password: 'short1' }).errors.password).toBe('validation.passwordShort');
    expect(validateSupplierRegistration({ ...base, password: 'onlyletters' }).errors.password).toBe('validation.passwordWeak');
    expect(validateSupplierRegistration({ ...base, acceptTerms: false }).errors.acceptTerms).toBe('validation.termsRequired');
  });
});
