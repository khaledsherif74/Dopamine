import { describe, it, expect } from 'vitest';
import { profileFormFrom, validateDriverProfile } from '../src/features/profile/profileForm.js';
import { validateDriverRegistration } from '../src/features/auth/registerForm.js';

const driver = { name: 'Omar', phone: '+201000000000', vehicleType: 'Bike' };

describe('driver profile (mirrors updateDriverProfileSchema)', () => {
  const form = o => ({ ...profileFormFrom(driver), ...o });
  it('form from profile; missing vehicle -> empty', () => {
    expect(profileFormFrom(driver)).toEqual({ name: 'Omar', phone: '+201000000000', vehicleType: 'Bike' });
    expect(profileFormFrom({ name: 'A', phone: '+201111111111' }).vehicleType).toBe('');
  });
  it('unchanged -> empty body', () => expect(validateDriverProfile(form({}), driver)).toEqual({ ok: true, errors: {}, body: {} }));
  it('sends only what changed, trimmed', () => expect(validateDriverProfile(form({ name: ' Omar K ', vehicleType: 'Scooter' }), driver).body).toEqual({ name: 'Omar K', vehicleType: 'Scooter' }));
  it('name 2..80, phone E.164-ish, vehicle <= 40', () => {
    expect(validateDriverProfile(form({ name: 'O' }), driver).errors.name).toBe('profile.errors.name');
    expect(validateDriverProfile(form({ name: 'x'.repeat(81) }), driver).errors.name).toBe('profile.errors.name');
    for (const p of ['123', '+0123456789', 'abc']) expect(validateDriverProfile(form({ phone: p }), driver).errors.phone).toBe('profile.errors.phone');
    expect(validateDriverProfile(form({ vehicleType: 'x'.repeat(41) }), driver).errors.vehicleType).toBe('profile.errors.vehicleLong');
  });
  it('an emptied vehicle is not sent (the API cannot clear it)', () => expect(validateDriverProfile(form({ vehicleType: '' }), driver).body).toEqual({}));
});

describe('driver registration (mirrors registerDriverSchema)', () => {
  const base = { name: ' Omar ', email: ' Omar@Example.com ', phone: '+201000000000', password: 'Passw0rd1', vehicleType: '', acceptTerms: true };
  it('valid -> trimmed body without the terms flag; empty vehicle omitted', () => {
    expect(validateDriverRegistration(base)).toEqual({ ok: true, errors: {}, body: { name: 'Omar', email: 'omar@example.com', phone: '+201000000000', password: 'Passw0rd1' } });
    expect(validateDriverRegistration({ ...base, vehicleType: ' Bike ' }).body.vehicleType).toBe('Bike');
  });
  it('field errors', () => {
    expect(validateDriverRegistration({ ...base, name: 'a' }).errors.name).toBe('profile.errors.name');
    expect(validateDriverRegistration({ ...base, email: 'nope' }).errors.email).toBe('validation.emailInvalid');
    expect(validateDriverRegistration({ ...base, phone: '12' }).errors.phone).toBe('profile.errors.phone');
    expect(validateDriverRegistration({ ...base, password: 'short1' }).errors.password).toBe('validation.passwordShort');
    expect(validateDriverRegistration({ ...base, password: 'onlyletters' }).errors.password).toBe('validation.passwordWeak');
    expect(validateDriverRegistration({ ...base, vehicleType: 'x'.repeat(41) }).errors.vehicleType).toBe('profile.errors.vehicleLong');
    expect(validateDriverRegistration({ ...base, acceptTerms: false }).errors.acceptTerms).toBe('validation.termsRequired');
  });
});
