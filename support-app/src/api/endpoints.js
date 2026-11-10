import { api } from "./api.js";

const data = (r) => r.data;

export const endpoints = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body: { ...body, role: "SUPPORT" },
      }),
      transformResponse: data,
    }),
    forgotPassword: b.mutation({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: { ...body, role: "SUPPORT" },
      }),
    }),
    resetPassword: b.mutation({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: { ...body, role: "SUPPORT" },
      }),
    }),
    logout: b.mutation({
      query: () => ({ url: "/auth/logout", method: "POST", body: {} }),
    }),
    changePassword: b.mutation({
      query: (body) => ({
        url: "/support-agent/me/password",
        method: "PATCH",
        body,
      }),
    }),
    updateMe: b.mutation({
      query: (body) => ({ url: "/support-agent/me", method: "PATCH", body }),
      transformResponse: data,
    }),

    getStats: b.query({
      query: () => "/support-agent/stats",
      transformResponse: data,
      providesTags: ["Stats"],
    }),

    listTickets: b.query({
      query: (params) => ({ url: "/support-agent/tickets", params }),
      transformResponse: data,
    }),
    getTicket: b.query({
      query: (id) => `/support-agent/tickets/${id}`,
      transformResponse: data,
      providesTags: (_r, _e, id) => [{ type: "Ticket", id }],
    }),
    assignTicket: b.mutation({
      query: ({ id, agentId }) => ({
        url: `/support-agent/tickets/${id}/assign`,
        method: "PATCH",
        body: agentId ? { agentId } : {},
      }),
      transformResponse: data,
      invalidatesTags: ["Stats"],
    }),
    updateTicket: b.mutation({
      query: ({ id, status, resolution }) => ({
        url: `/support-agent/tickets/${id}`,
        method: "PATCH",
        body: { status, ...(resolution ? { resolution } : {}) },
      }),
      transformResponse: data,
      invalidatesTags: ["Stats"],
    }),
    replyToTicket: b.mutation({
      query: ({ id, body }) => ({
        url: `/support-agent/tickets/${id}/messages`,
        method: "POST",
        body: { body },
      }),
      transformResponse: data,
      invalidatesTags: ["Stats"],
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
    }),

    getOrder: b.query({
      query: (id) => `/support-agent/orders/${id}`,
      transformResponse: data,
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    listOrders: b.query({
      query: (params) => ({ url: "/support-agent/orders", params }),
      transformResponse: data,
    }),
    forceCancel: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/support-agent/orders/${id}/force-cancel`,
        method: "PATCH",
        body,
      }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Order", id }, "Refunds"],
    }),
    reassignDriver: b.mutation({
      query: ({ id, driverId }) => ({
        url: `/support-agent/orders/${id}/reassign-driver`,
        method: "PATCH",
        body: { driverId },
      }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Order", id }],
    }),
    listDrivers: b.query({
      query: (params) => ({ url: "/support-agent/drivers", params }),
      transformResponse: data,
      providesTags: ["Drivers"],
    }),
    listOrderChat: b.query({
      query: ({ orderId, channel, cursor }) => ({
        url: `/orders/${orderId}/chat/${channel}`,
        params: { limit: 30, ...(cursor ? { cursor } : {}) },
      }),
      transformResponse: data,
    }),

    listRefunds: b.query({
      query: (params) => ({ url: "/support-agent/refunds", params }),
      transformResponse: data,
      providesTags: ["Refunds"],
    }),
    approveRefund: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/support-agent/refunds/${id}/approve`,
        method: "PATCH",
        body,
      }),
      transformResponse: data,
      invalidatesTags: ["Refunds"],
    }),
    rejectRefund: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/support-agent/refunds/${id}/reject`,
        method: "PATCH",
        body,
      }),
      transformResponse: data,
      invalidatesTags: ["Refunds"],
    }),
    executeRefund: b.mutation({
      query: (id) => ({
        url: `/support-agent/refunds/${id}/execute`,
        method: "POST",
        body: {},
      }),
      transformResponse: data,
      invalidatesTags: ["Refunds"],
    }),
    manualCompleteRefund: b.mutation({
      query: ({ id, ...body }) => ({
        url: `/support-agent/refunds/${id}/manual-complete`,
        method: "POST",
        body,
      }),
      transformResponse: data,
      invalidatesTags: ["Refunds"],
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
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useUpdateMeMutation,
  useGetStatsQuery,
  useListTicketsQuery,
  useLazyListTicketsQuery,
  useGetTicketQuery,
  useLazyGetTicketQuery,
  useAssignTicketMutation,
  useUpdateTicketMutation,
  useReplyToTicketMutation,
  useLazyListTicketMessagesQuery,
  useMarkTicketReadMutation,
  useGetOrderQuery,
  useListOrdersQuery,
  useForceCancelMutation,
  useReassignDriverMutation,
  useListDriversQuery,
  useListOrderChatQuery,
  useListRefundsQuery,
  useApproveRefundMutation,
  useRejectRefundMutation,
  useExecuteRefundMutation,
  useManualCompleteRefundMutation,
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = endpoints;
