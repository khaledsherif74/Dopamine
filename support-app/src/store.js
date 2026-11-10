import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/api/api.js";
import { auth, authActions } from "@/lib/session.js";

const resetOnLogout = (storeApi) => (next) => (action) => {
  const result = next(action);
  if (authActions.loggedOut.match(action))
    storeApi.dispatch(api.util.resetApiState());
  return result;
};

export const store = configureStore({
  reducer: { [api.reducerPath]: api.reducer, auth: auth.reducer },
  middleware: (getDefault) =>
    getDefault().concat(api.middleware, resetOnLogout),
});
