import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { API_BASE_URL, WEB_HEADERS } from "@/api/config";

// Restores the session after a page reload: the httpOnly refresh cookie is
// exchanged for a new access token, then the admin profile is loaded.
// Plain fetch (not RTK Query) avoids a circular import with apiSlice.
export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrap",
  async (_, { rejectWithValue }) => {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...WEB_HEADERS },
        body: JSON.stringify({}),
      });
      if (!refreshRes.ok) return rejectWithValue("no_session");
      const refreshBody = await refreshRes.json();
      const accessToken = refreshBody?.data?.accessToken;
      if (!accessToken) return rejectWithValue("no_session");

      const meRes = await fetch(`${API_BASE_URL}/admin/me`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${accessToken}`, ...WEB_HEADERS },
      });
      if (!meRes.ok) return rejectWithValue("no_session");
      const meBody = await meRes.json();
      return { user: meBody?.data ?? null, accessToken };
    } catch {
      return rejectWithValue("network");
    }
  },
);

// "loading" until bootstrapAuth settles, so ProtectedRoute does not bounce a
// valid session to /login on reload.
const initialState = {
  user: null,
  accessToken: null,
  status: "loading",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived(state, action) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
    },
    accessTokenRefreshed(state, action) {
      state.accessToken = action.payload;
    },
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.status = "authenticated";
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = "unauthenticated";
      });
  },
});

export const { credentialsReceived, accessTokenRefreshed, loggedOut } =
  authSlice.actions;
export default authSlice.reducer;
