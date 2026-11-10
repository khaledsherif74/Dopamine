import { api } from './api.js';

const data = r => r.data;

export const endpoints = api.injectEndpoints({
  endpoints: b => ({
    // ---- auth
    login: b.mutation({ query: body => ({ url: '/auth/login', method: 'POST', body: { ...body, role: 'DRIVER' } }), transformResponse: data }),
    register: b.mutation({ query: body => ({ url: '/auth/register/driver', method: 'POST', body }), transformResponse: data }),
    forgotPassword: b.mutation({ query: body => ({ url: '/auth/forgot-password', method: 'POST', body: { ...body, role: 'DRIVER' } }) }),
    resetPassword: b.mutation({ query: body => ({ url: '/auth/reset-password', method: 'POST', body: { ...body, role: 'DRIVER' } }) }),
    logout: b.mutation({ query: () => ({ url: '/auth/logout', method: 'POST', body: {} }) }),

    // ---- driver profile / availability
    getMe: b.query({ query: () => '/drivers/me', transformResponse: data, providesTags: ['Driver'] }),
    updateMe: b.mutation({ query: body => ({ url: '/drivers/me', method: 'PATCH', body }), transformResponse: data, invalidatesTags: ['Driver'] }),
    setAvailability: b.mutation({ query: body => ({ url: '/drivers/me/availability', method: 'PATCH', body }), transformResponse: data, invalidatesTags: ['Driver', 'Jobs'] }),

    // ---- deliveries
    listAvailable: b.query({ query: () => '/deliveries/available', transformResponse: data, providesTags: ['Jobs'] }),
    listAssigned: b.query({ query: () => '/deliveries/assigned', transformResponse: data, providesTags: ['Jobs'] }),
    acceptDelivery: b.mutation({ query: id => ({ url: `/deliveries/${id}/accept`, method: 'PATCH' }), invalidatesTags: ['Jobs'] }),
    pickupDelivery: b.mutation({ query: id => ({ url: `/deliveries/${id}/pickup`, method: 'PATCH' }), invalidatesTags: ['Jobs'] }),
    deliverDelivery: b.mutation({ query: id => ({ url: `/deliveries/${id}/deliver`, method: 'PATCH', body: {} }), invalidatesTags: ['Jobs', 'Earnings'] }),

    // ---- order chat (customer <-> this shop)
    listChat: b.query({
      query: ({ orderId, channel, cursor }) => ({ url: `/orders/${orderId}/chat/${channel}`, params: { limit: 30, ...(cursor ? { cursor } : {}) } }),
      transformResponse: data,
    }),
    sendChat: b.mutation({ query: ({ orderId, channel, body }) => ({ url: `/orders/${orderId}/chat/${channel}`, method: 'POST', body: { body } }), transformResponse: data }),
    markChatRead: b.mutation({ query: ({ orderId, channel }) => ({ url: `/orders/${orderId}/chat/${channel}/read`, method: 'PATCH' }), invalidatesTags: ['Jobs'] }),

    // ---- earnings
    getEarnings: b.query({ query: params => ({ url: '/drivers/me/earnings', params: params ?? undefined }), transformResponse: data, providesTags: ['Earnings'] }),

    // ---- support tickets (the supplier's own)
    listTickets: b.query({ query: params => ({ url: '/support/tickets', params: params ?? undefined }), transformResponse: data, providesTags: ['Tickets'] }),
    getTicket: b.query({ query: id => `/support/tickets/${id}`, transformResponse: data }),
    createTicket: b.mutation({ query: body => ({ url: '/support/tickets', method: 'POST', body }), transformResponse: data, invalidatesTags: ['Tickets'] }),
    sendTicketMessage: b.mutation({ query: ({ id, body }) => ({ url: `/support/tickets/${id}/messages`, method: 'POST', body: { body } }), transformResponse: data, invalidatesTags: ['Tickets'] }),
    listTicketMessages: b.query({ query: ({ id, after }) => ({ url: `/support/tickets/${id}/messages`, params: after ? { after } : undefined }), transformResponse: data }),
    markTicketRead: b.mutation({ query: id => ({ url: `/support/tickets/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Tickets'] }),

    // ---- notifications
    listNotifications: b.query({ query: params => ({ url: '/notifications', params: params ?? undefined }), transformResponse: data, providesTags: ['Notifications'] }),
    getUnreadCount: b.query({ query: () => '/notifications/unread-count', transformResponse: data, providesTags: ['Notifications'] }),
    markNotificationRead: b.mutation({ query: id => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notifications'] }),
    markAllNotificationsRead: b.mutation({ query: () => ({ url: '/notifications/read-all', method: 'PATCH' }), invalidatesTags: ['Notifications'] }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useForgotPasswordMutation, useResetPasswordMutation, useLogoutMutation,
  useGetMeQuery, useUpdateMeMutation, useSetAvailabilityMutation,
  useListAvailableQuery, useListAssignedQuery, useAcceptDeliveryMutation, usePickupDeliveryMutation, useDeliverDeliveryMutation,
  useListChatQuery, useLazyListChatQuery, useSendChatMutation, useMarkChatReadMutation,
  useGetEarningsQuery,
  useListTicketsQuery, useGetTicketQuery, useLazyGetTicketQuery, useCreateTicketMutation, useSendTicketMessageMutation, useLazyListTicketMessagesQuery, useMarkTicketReadMutation,
  useListNotificationsQuery, useGetUnreadCountQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
} = endpoints;
