// Supplier registration, mirroring registerSupplierSchema (auth.validation.js).
const PHONE = /^\+?[1-9]\d{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateSupplierRegistration({ shopName = '', email = '', phone = '', password = '', address = '', acceptTerms = false } = {}) {
  const errors = {};
  const name = shopName.trim();
  const mail = email.trim().toLowerCase();
  const tel = phone.trim();
  const addr = address.trim();
  if (name.length < 2 || name.length > 120) errors.shopName = 'shop.errors.name';
  if (!EMAIL.test(mail)) errors.email = 'validation.emailInvalid';
  if (!PHONE.test(tel)) errors.phone = 'shop.errors.phone';
  if (password.length < 8) errors.password = 'validation.passwordShort';
  else if (password.length > 72) errors.password = 'validation.passwordLong';
  else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) errors.password = 'validation.passwordWeak';
  if (addr.length > 255) errors.address = 'shop.errors.addressLong';
  if (acceptTerms !== true) errors.acceptTerms = 'validation.termsRequired';
  const body = { shopName: name, email: mail, phone: tel, password, ...(addr ? { address: addr } : {}) };
  return { ok: Object.keys(errors).length === 0, errors, body };
}
