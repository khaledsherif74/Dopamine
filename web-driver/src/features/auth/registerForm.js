// Driver registration, mirroring registerDriverSchema (auth.validation.js).
const PHONE = /^\+?[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateDriverRegistration({ name = '', email = '', phone = '', password = '', vehicleType = '', acceptTerms = false } = {}) {
  const errors = {};
  const n = name.trim();
  const mail = email.trim().toLowerCase();
  const tel = phone.trim();
  const vehicle = vehicleType.trim();
  if (n.length < 2 || n.length > 80) errors.name = 'profile.errors.name';
  if (!EMAIL.test(mail)) errors.email = 'validation.emailInvalid';
  if (!PHONE.test(tel)) errors.phone = 'profile.errors.phone';
  if (password.length < 8) errors.password = 'validation.passwordShort';
  else if (password.length > 72) errors.password = 'validation.passwordLong';
  else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) errors.password = 'validation.passwordWeak';
  if (vehicle.length > 40) errors.vehicleType = 'profile.errors.vehicleLong';
  if (acceptTerms !== true) errors.acceptTerms = 'validation.termsRequired';
  return { ok: Object.keys(errors).length === 0, errors, body: { name: n, email: mail, phone: tel, password, ...(vehicle ? { vehicleType: vehicle } : {}) } };
}
