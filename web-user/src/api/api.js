import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery } from '@dopamine/web-shared';
import { config } from '@/config.js';
import { authActions, refresher } from '@/lib/session.js';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: createBaseQuery({
    baseUrl: config.apiBaseUrl,
    getToken: state => state.auth.accessToken,
    onToken: authActions.accessTokenRefreshed,
    onLogout: authActions.loggedOut,
    refresher,
  }),
  tagTypes: ['Addresses', 'Orders', 'Profile', 'Notifications', 'Chat', 'Payment', 'Refunds', 'Tickets'],
  endpoints: () => ({}),
});
