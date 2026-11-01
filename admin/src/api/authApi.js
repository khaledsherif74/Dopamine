import { api } from "./apiSlice";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r) => r.data,
    }),
    logout: builder.mutation({
      query: () => ({ url: "/auth/logout", method: "POST", body: {} }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
