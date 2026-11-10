import { describe, it, expect } from 'vitest';
import { validatePasswordChange } from '../src/features/auth/passwordForm.js';

const v = o => validatePasswordChange({ currentPassword: 'Old12345', newPassword: 'NewPass123', confirm: 'NewPass123', ...o });

describe('forced password change form (mirrors changePasswordSchema)', () => {
  it('accepts a valid change', () => expect(v({})).toEqual({ ok: true, values: { currentPassword: 'Old12345', newPassword: 'NewPass123' }, errors: {} }));
  it('current password required', () => expect(v({ currentPassword: '' }).errors.currentPassword).toBe('validation.required'));
  it('new password: 8..72 chars with a letter and a number', () => {
    expect(v({ newPassword: 'Ab1', confirm: 'Ab1' }).errors.newPassword).toBe('validation.passwordShort');
    expect(v({ newPassword: 'abcdefgh', confirm: 'abcdefgh' }).errors.newPassword).toBe('validation.passwordWeak');
    expect(v({ newPassword: '12345678', confirm: '12345678' }).errors.newPassword).toBe('validation.passwordWeak');
    const long = 'a1'.repeat(37);
    expect(v({ newPassword: long, confirm: long }).errors.newPassword).toBe('validation.passwordLong');
    const edge = 'a1' + 'x'.repeat(70);
    expect(v({ newPassword: edge, confirm: edge }).ok).toBe(true);
  });
  it('confirmation must match', () => expect(v({ confirm: 'Other123' }).errors.confirm).toBe('validation.passwordMismatch'));
  it('must differ from the current one (the server rejects it too)', () => expect(v({ newPassword: 'Old12345', confirm: 'Old12345' }).errors.newPassword).toBe('validation.passwordSame'));
  it('does not trim the password', () => expect(v({ newPassword: ' NewPass123', confirm: ' NewPass123' }).values.newPassword).toBe(' NewPass123'));
});
