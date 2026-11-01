import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/api/api.js';
import { auth, authActions } from '@/lib/session.js';
import cart, { cartPersistence } from '@/features/cart/cartSlice.js';
import location, { persistLocation } from '@/features/location/locationSlice.js';

// After logout nothing cached for the previous user may stay in memory.
const resetOnLogout = storeApi => next => action => {
  const result = next(action);
  if (authActions.loggedOut.match(action)) storeApi.dispatch(api.util.resetApiState());
  return result;
};

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: auth.reducer, cart, location },
  middleware: getDefault => getDefault().concat(api.middleware, resetOnLogout),
});

cartPersistence(store);
persistLocation(store);
