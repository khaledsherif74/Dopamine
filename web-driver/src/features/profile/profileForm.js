// Driver profile, mirroring updateDriverProfileSchema (driver.validation.js).
const PHONE = /^\+?[1-9]\d{7,14}$/;

export const profileFormFrom = d => ({ name: d.name ?? '', phone: d.phone ?? '', vehicleType: d.vehicleType ?? '' });

export function validateDriverProfile(form, original) {
  const errors = {};
  const body = {};
  const name = form.name.trim();
  const phone = form.phone.trim();
  const vehicle = form.vehicleType.trim();

  if (name.length < 2 || name.length > 80) errors.name = 'profile.errors.name';
  else if (name !== original.name) body.name = name;

  if (!PHONE.test(phone)) errors.phone = 'profile.errors.phone';
  else if (phone !== original.phone) body.phone = phone;

  if (vehicle.length > 40) errors.vehicleType = 'profile.errors.vehicleLong';
  else if (vehicle && vehicle !== (original.vehicleType ?? '')) body.vehicleType = vehicle; // the API cannot clear it

  return { ok: Object.keys(errors).length === 0, errors, body };
}
