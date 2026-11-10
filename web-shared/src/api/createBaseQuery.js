import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { WEB_HEADERS } from "./refresher.js";

const NO_REFRESH_PREFIXES = [
  "/auth/login",
  "/auth/register",
  "/auth/oauth",
  "/auth/refresh",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/otp",
];

export function shouldSkipRefresh(args) {
  const url = typeof args === "string" ? args : args?.url;
  return (
    typeof url === "string" &&
    NO_REFRESH_PREFIXES.some((p) => url.startsWith(p))
  );
}

/**
 * RTK Query base query for the web apps.
 *  - access token lives in memory (Redux), sent as a Bearer header
 *  - the refresh token lives only in the httpOnly cookie (never readable by JS)
 *  - on 401: ONE shared refresh (all concurrent requests wait for it), then retry once;
 *    if the server denies the refresh the session is closed (onLogout); a mere
 *    network failure keeps the session and returns the original error
 *
 * @param {object} o
 * @param {string} o.baseUrl
 * @param {(state:any)=>string|null} o.getToken
 * @param {(token:string)=>any} o.onToken   action creator for a refreshed token
 * @param {()=>any} o.onLogout              action creator for logout
 * @param {{refresh:()=>Promise<any>}} o.refresher
 * @param {Function} [o.rawBaseQuery]       override (tests)
 */
export function createBaseQuery({
  baseUrl,
  getToken,
  onToken,
  onLogout,
  refresher,
  timeout = 15000,
  rawBaseQuery,
}) {
  const raw =
    rawBaseQuery ??
    fetchBaseQuery({
      baseUrl,
      timeout,
      credentials: "include",
      prepareHeaders: (headers, { getState }) => {
        const token = getToken(getState());
        if (token) headers.set("Authorization", `Bearer ${token}`);
        Object.entries(WEB_HEADERS).forEach(([k, v]) => headers.set(k, v));
        return headers;
      },
    });

  return async function baseQueryWithReauth(args, api, extraOptions) {
    let result = await raw(args, api, extraOptions);
    if (result.error?.status !== 401 || shouldSkipRefresh(args)) return result;

    const outcome = await refresher.refresh();
    if (outcome.status === "ok") {
      api.dispatch(onToken(outcome.accessToken));
      result = await raw(args, api, extraOptions);
    } else if (outcome.status === "denied") {
      api.dispatch(onLogout());
    }
    return result;
  };
}
