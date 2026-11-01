import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { accessTokenRefreshed, loggedOut } from "@/features/auth/authSlice";

import { API_BASE_URL, WEB_HEADERS } from "./config";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    Object.entries(WEB_HEADERS).forEach(([k, v]) => headers.set(k, v));
    return headers;
  },
});

let inFlightRefresh = null;

async function performRefresh() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...WEB_HEADERS },
      body: JSON.stringify({}),
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    if (!inFlightRefresh) {
      inFlightRefresh = performRefresh().finally(() => {
        inFlightRefresh = null;
      });
    }
    const newAccessToken = await inFlightRefresh;
    if (newAccessToken) {
      api.dispatch(accessTokenRefreshed(newAccessToken));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(loggedOut());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Suppliers",
    "Drivers",
    "Orders",
    "Settings",
    "Dashboard",
    "Promos",
    "SupportStaff",
  ],
  endpoints: () => ({}),
});
