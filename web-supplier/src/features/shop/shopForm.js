// Shop settings, mirroring updateSupplierProfileSchema (supplier.validation.js).
const PHONE = /^\+?[1-9]\d{7,14}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function shopFormFrom(s) {
  return {
    shopName: s.shopName ?? '', address: s.address ?? '', phone: s.phone ?? '',
    lat: s.lat == null ? '' : String(s.lat), lng: s.lng == null ? '' : String(s.lng),
    isAcceptingOrders: s.isAcceptingOrders !== false, opensAt: s.opensAt ?? '', closesAt: s.closesAt ?? '',
  };
}

// '' -> null (not set), otherwise a number or NaN
const coord = text => (String(text).trim() === '' ? null : Number(String(text).trim()));

export function validateShop(form, original) {
  const errors = {};
  const body = {};
  const shopName = form.shopName.trim();
  const address = form.address.trim();
  const phone = form.phone.trim();

  if (shopName.length < 2 || shopName.length > 120) errors.shopName = 'shop.errors.name';
  else if (shopName !== original.shopName) body.shopName = shopName;

  if (address.length > 255) errors.address = 'shop.errors.addressLong';
  else if (address && address !== (original.address ?? '')) body.address = address; // the API cannot clear it

  if (!PHONE.test(phone)) errors.phone = 'shop.errors.phone';
  else if (phone !== original.phone) body.phone = phone;

  const lat = coord(form.lat);
  const lng = coord(form.lng);
  if (lat !== null && !(lat >= -90 && lat <= 90)) errors.lat = 'shop.errors.lat';
  else if (lat !== null && lat !== original.lat) body.lat = lat;
  if (lng !== null && !(lng >= -180 && lng <= 180)) errors.lng = 'shop.errors.lng';
  else if (lng !== null && lng !== original.lng) body.lng = lng;

  if (form.isAcceptingOrders !== (original.isAcceptingOrders !== false)) body.isAcceptingOrders = form.isAcceptingOrders;

  const opens = form.opensAt.trim();
  const closes = form.closesAt.trim();
  if (!!opens !== !!closes) errors.hours = 'shop.errors.hoursPair';
  else if (opens && (!TIME.test(opens) || !TIME.test(closes))) errors.hours = 'shop.errors.hoursFormat';
  else if (opens !== (original.opensAt ?? '') || closes !== (original.closesAt ?? '')) {
    body.opensAt = opens || null;
    body.closesAt = closes || null;
  }
  return { ok: Object.keys(errors).length === 0, errors, body };
}

export function diffShop(original, values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) if (v !== original[k]) out[k] = v;
  return out;
}
