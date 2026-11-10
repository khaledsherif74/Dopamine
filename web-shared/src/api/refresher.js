export const WEB_HEADERS = Object.freeze({
  "X-Client": "web",
  "X-Requested-With": "XMLHttpRequest",
});

export function createRefresher({ baseUrl, fetchFn, timeoutMs = 10000 } = {}) {
  const doFetch = fetchFn ?? ((...args) => fetch(...args));
  let inFlight = null;

  async function run() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...WEB_HEADERS },
        body: "{}",
        signal: controller.signal,
      });
      if (res.status === 401 || res.status === 403) return { status: "denied" };
      if (!res.ok) return { status: "error" };
      const body = await res.json();
      const accessToken = body?.data?.accessToken;
      return accessToken ? { status: "ok", accessToken } : { status: "denied" };
    } catch {
      return { status: "error" };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    refresh() {
      if (!inFlight) {
        inFlight = run().finally(() => {
          inFlight = null;
        });
      }
      return inFlight;
    },
  };
}
