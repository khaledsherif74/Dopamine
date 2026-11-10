// Post-login redirect: only same-app absolute paths ("/tickets/x?y=1"), never "//host", "http:" or "\\".
export function safeRedirect(from, fallback = '/') {
  if (typeof from !== 'string' || from.length > 300) return fallback;
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('\\')) return fallback;
  if (/^\/(login|change-password)(\/|\?|$)/.test(from)) return fallback;
  return from;
}
