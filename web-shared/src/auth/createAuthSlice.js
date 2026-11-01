import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { bootstrapSession } from './session.js';

/**
 * status: 'loading' until bootstrap settles (so route guards don't flash /login on reload),
 *         then 'authenticated' | 'unauthenticated'.
 */
export function createAuthSlice({ role, baseUrl, refresher, name = 'auth' }) {
  const bootstrapAuth = createAsyncThunk(`${name}/bootstrap`, async () =>
    bootstrapSession({ baseUrl, role, refresher }),
  );

  const slice = createSlice({
    name,
    initialState: { user: null, accessToken: null, status: 'loading', bootstrapError: false },
    reducers: {
      credentialsReceived(state, { payload }) {
        state.user = payload.user;
        state.accessToken = payload.accessToken;
        state.status = 'authenticated';
        state.bootstrapError = false;
      },
      accessTokenRefreshed(state, { payload }) {
        state.accessToken = payload;
      },
      userUpdated(state, { payload }) {
        state.user = { ...state.user, ...payload };
      },
      loggedOut(state) {
        state.user = null;
        state.accessToken = null;
        state.status = 'unauthenticated';
      },
    },
    extraReducers: builder => {
      builder
        .addCase(bootstrapAuth.fulfilled, (state, { payload }) => {
          if (payload.status === 'authenticated') {
            state.user = payload.account;
            state.accessToken = payload.accessToken;
            state.status = 'authenticated';
          } else {
            state.user = null;
            state.accessToken = null;
            state.status = 'unauthenticated';
          }
          state.bootstrapError = payload.status === 'error';
        })
        .addCase(bootstrapAuth.rejected, state => {
          state.status = 'unauthenticated';
          state.bootstrapError = true;
        });
    },
  });

  return { reducer: slice.reducer, actions: slice.actions, bootstrapAuth };
}
