import { WEB_HEADERS } from "../api/refresher.js";

export async function bootstrapSession({ baseUrl, role, refresher, fetchFn }) {
  const doFetch = fetchFn ?? ((...a) => fetch(...a));
  const out = await refresher.refresh();
  if (out.status === "error") return { status: "error" };
  if (out.status !== "ok") return { status: "anonymous" };

  try {
    const res = await doFetch(`${baseUrl}/auth/me`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${out.accessToken}`, ...WEB_HEADERS },
    });
    if (res.status === 401 || res.status === 403 || res.status === 404)
      return { status: "anonymous" };
    if (!res.ok) return { status: "error" };
    const body = await res.json();
    const account = body?.data;
    if (!account || (role && account.role !== role))
      return { status: "anonymous" };
    return { status: "authenticated", accessToken: out.accessToken, account };
  } catch {
    return { status: "error" };
  }
}
