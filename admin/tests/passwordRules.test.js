import { describe, it, expect } from 'vitest';
import { validateNewPassword, validateEmail } from '../src/features/auth/passwordRules.js';

describe('new password (same rule as the API: 8-72 chars, a letter and a number)', () => {
  it('accepts a good one and does not trim it', () => {
    expect(validateNewPassword('Passw0rd1')).toBeNull();
    expect(validateNewPassword(' Passw0rd1 ')).toBeNull();
    expect(validateNewPassword('a1' + 'x'.repeat(70))).toBeNull();
  });
  it('too short, too long, no number, no letter', () => {
    expect(validateNewPassword('Ab1')).toBe('Use at least 8 characters.');
    expect(validateNewPassword('a1'.repeat(37))).toBe('Use at most 72 characters.');
    expect(validateNewPassword('onlyletters')).toBe('Include at least one letter and one number.');
    expect(validateNewPassword('12345678')).toBe('Include at least one letter and one number.');
  });
  it('exact length boundaries: 7 / 8 and 72 / 73 characters', () => {
    expect(validateNewPassword('Abcde12')).toBe('Use at least 8 characters.');
    expect(validateNewPassword('Abcdef12')).toBeNull();
    expect(validateNewPassword('a1' + 'x'.repeat(70))).toBeNull();
    expect(validateNewPassword('a1' + 'x'.repeat(71))).toBe('Use at most 72 characters.');
  });
  it('empty / non-string', () => {
    expect(validateNewPassword('')).toBe('Use at least 8 characters.');
    expect(validateNewPassword(undefined)).toBe('Use at least 8 characters.');
  });
});

describe('email', () => {
  it('basic shape check (the server is the real validator)', () => {
    expect(validateEmail(' admin@example.com ')).toBeNull();
    for (const bad of ['', 'a', 'a@b', 'a@b.c', 'a b@c.com', '@c.com', undefined]) expect(validateEmail(bad)).toBe('Enter a valid email address.');
  });
});
