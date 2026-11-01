// The payment partner URL comes from our API, but we still only ever navigate to a plain https URL
// (never javascript:, data:, http:, or something with embedded credentials).
export function isSafePaymentRedirect(url) {
  if (typeof url !== 'string' || url.length > 2048) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && !u.username && !u.password && !!u.hostname;
  } catch {
    return false;
  }
}
