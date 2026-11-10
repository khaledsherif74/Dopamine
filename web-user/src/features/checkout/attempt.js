export function newKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  (typeof crypto !== "undefined"
    ? crypto
    : { getRandomValues: (a) => a.map(() => Math.floor(Math.random() * 256)) }
  ).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fingerprint({
  cart,
  addressId = null,
  scheduledFor = null,
  promoCode = null,
  method,
}) {
  return JSON.stringify({
    s: cart.supplierId,
    i: cart.items
      .map((i) => [i.productId, i.quantity, i.customization || ""])
      .sort(
        (a, b) =>
          String(a[0]).localeCompare(String(b[0])) ||
          String(a[2]).localeCompare(String(b[2])),
      ),
    a: addressId,
    t: scheduledFor,
    p: promoCode ? String(promoCode).trim().toUpperCase() : null,
    m: method,
  });
}

export function nextAttempt(prev, fp, makeKey = newKey) {
  if (prev && prev.fingerprint === fp) return prev;
  return {
    fingerprint: fp,
    orderKey: makeKey(),
    payKey: makeKey(),
    orderId: null,
  };
}

export const withOrder = (attempt, orderId) => ({ ...attempt, orderId });
