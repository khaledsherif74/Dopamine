import { describe, it, expect } from 'vitest';
import { applePayload, googlePayload, appleFullName, safeRedirect } from '../src/features/auth/oauthPayload.js';

describe('Apple payload', () => {
  it('first login carries email and the assembled name', () => {
    const out = applePayload({ authorization: { id_token: 'TOK' }, user: { email: 'a@privaterelay.appleid.com', name: { firstName: ' Sam ', lastName: 'Ahmed' } } });
    expect(out).toEqual({ provider: 'APPLE', idToken: 'TOK', email: 'a@privaterelay.appleid.com', name: 'Sam Ahmed' });
  });
  it('later logins have no user block: only the token is sent', () => {
    expect(applePayload({ authorization: { id_token: 'TOK' } })).toEqual({ provider: 'APPLE', idToken: 'TOK' });
  });
  it('no token -> null (cancelled / failed)', () => {
    expect(applePayload({})).toBe(null);
    expect(applePayload(undefined)).toBe(null);
  });
  it('name parts may be missing', () => {
    expect(appleFullName({ name: { firstName: 'Sam' } })).toBe('Sam');
    expect(appleFullName({ name: { lastName: 'Ahmed' } })).toBe('Ahmed');
    expect(appleFullName({ name: {} })).toBe(undefined);
    expect(appleFullName(undefined)).toBe(undefined);
  });
});

describe('Google payload', () => {
  it('uses the credential', () => {
    expect(googlePayload({ credential: 'JWT' })).toEqual({ provider: 'GOOGLE', idToken: 'JWT' });
    expect(googlePayload({})).toBe(null);
  });
});

describe('safeRedirect (no open redirects)', () => {
  it('allows same-app paths', () => {
    expect(safeRedirect('/cart')).toBe('/cart');
    expect(safeRedirect('/suppliers/abc?x=1')).toBe('/suppliers/abc?x=1');
  });
  it('blocks absolute, protocol-relative, backslash and non-string targets', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'cart', null, undefined, 42]) {
      expect(safeRedirect(bad)).toBe('/');
    }
  });
  it('never bounces back to an auth page', () => {
    expect(safeRedirect('/login')).toBe('/');
    expect(safeRedirect('/register?x=1')).toBe('/');
    expect(safeRedirect('/login', '/home')).toBe('/home');
    expect(safeRedirect('/loginhelp')).toBe('/loginhelp');
  });
});
