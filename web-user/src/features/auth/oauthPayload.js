// Pure helpers for building the POST /auth/oauth body.

// Apple only returns `user` (name + email) on the VERY FIRST authorization.
export function appleFullName(user) {
  const first = user?.name?.firstName?.trim() ?? '';
  const last = user?.name?.lastName?.trim() ?? '';
  const full = `${first} ${last}`.trim();
  return full || undefined;
}

export function applePayload(result) {
  const idToken = result?.authorization?.id_token;
  if (!idToken) return null;
  const email = result?.user?.email;
  const name = appleFullName(result?.user);
  return { provider: 'APPLE', idToken, ...(email ? { email } : {}), ...(name ? { name } : {}) };
}

export function googlePayload(credentialResponse) {
  const idToken = credentialResponse?.credential;
  return idToken ? { provider: 'GOOGLE', idToken } : null;
}

// Where to send the user after login: only same-app relative paths (blocks open redirects).
export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback;
  if (/^\/(login|register|forgot-password|reset-password)(\/|$|\?)/.test(target)) return fallback;
  return target;
}
