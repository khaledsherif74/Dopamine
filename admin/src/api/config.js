export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export const WEB_HEADERS = {
  "X-Client": "web",
  "X-Requested-With": "XMLHttpRequest",
};
