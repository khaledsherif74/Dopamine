export function isSafePaymentRedirect(url) {
  if (typeof url !== "string" || url.length > 2048) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" && !u.username && !u.password && !!u.hostname
    );
  } catch {
    return false;
  }
}
