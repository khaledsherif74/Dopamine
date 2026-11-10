import { createSocketClient } from '@dopamine/web-shared';
import { config } from '@/config.js';
import { authActions, refresher } from '@/lib/session.js';
import { store } from '@/store.js';

export const socketClient = createSocketClient({
  url: config.socketUrl,
  getToken: () => store.getState().auth.accessToken,
  refreshAccessToken: async () => {
    const out = await refresher.refresh();
    if (out.status === 'ok') {
      store.dispatch(authActions.accessTokenRefreshed(out.accessToken));
      return out.accessToken;
    }
    if (out.status === 'denied') store.dispatch(authActions.loggedOut());
    return null;
  },
});
