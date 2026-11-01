import { describe, it, expect } from 'vitest';
import { isSafePaymentRedirect } from '../src/features/checkout/redirect.js';

describe('isSafePaymentRedirect', () => {
  it('accepts a normal https checkout URL', () => {
    expect(isSafePaymentRedirect('https://accept.paymob.com/unifiedcheckout/?publicKey=pk&clientSecret=cs')).toBe(true);
  });
  it('rejects everything else', () => {
    for (const bad of ['http://accept.paymob.com/x', 'javascript:alert(1)', 'data:text/html,<script>', '//evil.com', 'https://user:pw@evil.com', 'not a url', '', null, undefined, 42, 'https://' + 'a'.repeat(3000)]) {
      expect(isSafePaymentRedirect(bad)).toBe(false);
    }
  });
});
