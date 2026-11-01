import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/api/apiSlice";
import authReducer from "@/features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
  },
  middleware: (g) => g().concat(api.middleware),
});
