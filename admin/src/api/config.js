export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Sent on every request so the API treats this app as a web client (refresh token
// only in an httpOnly cookie) and accepts the cookie-based refresh/logout calls.
export const WEB_HEADERS = {
  "X-Client": "web",
  "X-Requested-With": "XMLHttpRequest",
};
