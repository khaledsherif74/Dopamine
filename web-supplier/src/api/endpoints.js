import { api } from "./api.js";

const data = (r) => r.data;

export const endpoints = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...body, role: "SUPPLIER" },
      }),
      transformResponse: data,
    }),
    register: b.mutation({
      query: (body) => ({
        url: "/auth/register/supplier",
        method: "POST",
        body,
      }),
      transformResponse: data,
    }),
    forgotPassword: b.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { ...body, role: "SUPPLIER" },
      }),
    }),
    resetPassword: b.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { ...body, role: "SUPPLIER" },
      }),
    }),
    logout: b.mutation({
      query: () => ({ url: "/auth/logout", method: "POST", body: {} }),
    }),

    getShop: b.query({
      query: () => "/suppliers/me",
      transformResponse: data,
      providesTags: ["Shop"],
    }),
    updateShop: b.mutation({
      query: (body) => ({ url: "/suppliers/me", method: "PATCH", body }),
      transformResponse: data,
      invalidatesTags: ["Shop"],
    }),

    listMyOrders: b.query({
      query: (params) => ({ url: "/suppliers/me/orders", params }),
      transformResponse: data,
      providesTags: ["Orders"],
    }),
    getOrder: b.query({
      query: (id) => `/orders/${id}`,
      transformResponse: data,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    acceptOrder: b.mutation({
      query: (id) => ({ url: `/orders/${id}/accept`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => ["Orders", { type: "Order", id }],
    }),
    rejectOrder: b.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/reject`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => ["Orders", { type: "Order", id }],
    }),
    startPreparing: b.mutation({
      query: (id) => ({ url: `/orders/${id}/preparing`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => ["Orders", { type: "Order", id }],
    }),
    markReady: b.mutation({
      query: (id) => ({ url: `/orders/${id}/ready`, method: "PATCH" }),
      invalidatesTags: (_r, _e, id) => ["Orders", { type: "Order", id }],
    }),
    cancelOrder: b.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/supplier-cancel`,
        method: "PATCH",
        body: { reason },
      }),
      invalidatesTags: (_r, _e, { id }) => ["Orders", { type: "Order", id }],
    }),

    listChat: b.query({
      query: ({ orderId, channel, cursor }) => ({
        url: `/orders/${orderId}/chat/${channel}`,
        params: { limit: 30, ...(cursor ? { cursor } : {}) },
      }),
      transformResponse: data,
    }),
    sendChat: b.mutation({
      query: ({ orderId, channel, body }) => ({
        url: `/orders/${orderId}/chat/${channel}`,
        method: "POST",
        body: { body },
      }),
      transformResponse: data,
    }),
    markChatRead: b.mutation({
      query: ({ orderId, channel }) => ({
        url: `/orders/${orderId}/chat/${channel}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Orders"],
    }),

    listMyProducts: b.query({
      query: (params) => ({ url: "/products/mine", params }),
      transformResponse: data,
      providesTags: ["Products"],
    }),
    createProduct: b.mutation({
      query: (body) => ({ url: "/products", method: "POST", body }),
      transformResponse: data,
      invalidatesTags: ["Products"],
    }),
    updateProduct: b.mutation({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: data,
      invalidatesTags: ["Products"],
    }),
    removeProduct: b.mutation({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products"],
    }),

    getEarnings: b.query({
      query: (params) => ({
        url: "/suppliers/me/earnings",
        params: params ?? undefined,
      }),
      transformResponse: data,
      providesTags: ["Earnings"],
    }),

    listTickets: b.query({
      query: (params) => ({
        url: "/support/tickets",
        params: params ?? undefined,
      }),
      transformResponse: data,
      providesTags: ["Tickets"],
    }),
    getTicket: b.query({
      query: (id) => `/support/tickets/${id}`,
      transformResponse: data,
    }),
    createTicket: b.mutation({
      query: (body) => ({ url: "/support/tickets", method: "POST", body }),
      transformResponse: data,
      invalidatesTags: ["Tickets"],
    }),
    sendTicketMessage: b.mutation({
      query: ({ id, body }) => ({
        url: `/support/tickets/${id}/messages`,
        method: "POST",
        body: { body },
      }),
      transformResponse: data,
      invalidatesTags: ["Tickets"],
    }),
    listTicketMessages: b.query({
      query: ({ id, after }) => ({
        url: `/support/tickets/${id}/messages`,
        params: after ? { after } : undefined,
      }),
      transformResponse: data,
    }),
    markTicketRead: b.mutation({
      query: (id) => ({ url: `/support/tickets/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Tickets"],
    }),

    listNotifications: b.query({
      query: (params) => ({
        url: "/notifications",
        params: params ?? undefined,
      }),
      transformResponse: data,
      providesTags: ["Notifications"],
    }),
    getUnreadCount: b.query({
      query: () => "/notifications/unread-count",
      transformResponse: data,
      providesTags: ["Notifications"],
    }),
    markNotificationRead: b.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: b.mutation({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetShopQuery,
  useUpdateShopMutation,
  useListMyOrdersQuery,
  useGetOrderQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingMutation,
  useMarkReadyMutation,
  useCancelOrderMutation,
  useListChatQuery,
  useLazyListChatQuery,
  useSendChatMutation,
  useMarkChatReadMutation,
  useListMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useRemoveProductMutation,
  useGetEarningsQuery,
  useListTicketsQuery,
  useGetTicketQuery,
  useLazyGetTicketQuery,
  useCreateTicketMutation,
  useSendTicketMessageMutation,
  useLazyListTicketMessagesQuery,
  useMarkTicketReadMutation,
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = endpoints;
