const env = import.meta.env;

export const config = {
  apiBaseUrl: env.VITE_API_BASE_URL || "/api/v1",
  socketUrl:
    env.VITE_SOCKET_URL ||
    (typeof window !== "undefined" ? window.location.origin : ""),
};

export function assetUrl(url) {
  if (!url) return null;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  const origin = config.apiBaseUrl.startsWith("http")
    ? new URL(config.apiBaseUrl).origin
    : "";
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
