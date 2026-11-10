import { api } from './api.js';
import { unwrapList } from './transforms.js';

const data = r => r.data;
const keyHeader = key => (key ? { 'Idempotency-Key': key } : undefined);

export const endpoints = api.injectEndpoints({
  endpoints: b => ({
    // ---- public config
    getPublicSettings: b.query({ query: () => '/settings/public', transformResponse: data }),

    // ---- auth
    login: b.mutation({ query: body => ({ url: '/auth/login', method: 'POST', body: { ...body, role: 'USER' } }), transformResponse: data }),
    register: b.mutation({ query: body => ({ url: '/auth/register/user', method: 'POST', body }), transformResponse: data }),
    oauthLogin: b.mutation({ query: body => ({ url: '/auth/oauth', method: 'POST', body }), transformResponse: data }),
    forgotPassword: b.mutation({ query: body => ({ url: '/auth/forgot-password', method: 'POST', body: { ...body, role: 'USER' } }) }),
    resetPassword: b.mutation({ query: body => ({ url: '/auth/reset-password', method: 'POST', body: { ...body, role: 'USER' } }) }),
    sendOtp: b.mutation({ query: body => ({ url: '/auth/otp/send', method: 'POST', body }) }),
    verifyOtp: b.mutation({ query: body => ({ url: '/auth/otp/verify', method: 'POST', body }) }),
    logout: b.mutation({ query: () => ({ url: '/auth/logout', method: 'POST', body: {} }) }),
    logoutAll: b.mutation({ query: () => ({ url: '/auth/logout-all', method: 'POST', body: {} }) }),

    // ---- browse (public)
    listSuppliers: b.query({ query: params => ({ url: '/suppliers', params: params ?? undefined }), transformResponse: data }),
    getSupplier: b.query({ query: id => `/suppliers/${id}`, transformResponse: data }),
    listProducts: b.query({ query: params => ({ url: '/products', params: params ?? undefined }), transformResponse: data }),
    getProduct: b.query({ query: id => `/products/${id}`, transformResponse: data }),

    // ---- profile + addresses
    updateProfile: b.mutation({ query: body => ({ url: '/users/me', method: 'PATCH', body }), transformResponse: data }),
    listAddresses: b.query({ query: () => '/users/me/addresses', transformResponse: data, providesTags: ['Addresses'] }),
    addAddress: b.mutation({ query: body => ({ url: '/users/me/addresses', method: 'POST', body }), transformResponse: data, invalidatesTags: ['Addresses'] }),
    updateAddress: b.mutation({ query: ({ id, ...body }) => ({ url: `/users/me/addresses/${id}`, method: 'PATCH', body }), transformResponse: data, invalidatesTags: ['Addresses'] }),
    deleteAddress: b.mutation({ query: id => ({ url: `/users/me/addresses/${id}`, method: 'DELETE' }), invalidatesTags: ['Addresses'] }),

    // ---- checkout
    validatePromo: b.mutation({ query: body => ({ url: '/promos/validate', method: 'POST', body }), transformResponse: data }),
    createOrder: b.mutation({
      query: ({ key, ...body }) => ({ url: '/orders', method: 'POST', body, headers: keyHeader(key) }),
      transformResponse: data,
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
    }),
    initiatePayment: b.mutation({
      query: ({ orderId, key, ...body }) => ({ url: `/payments/${orderId}/initiate`, method: 'POST', body, headers: keyHeader(key) }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'Payment', id: orderId }, { type: 'Orders', id: orderId }],
    }),
    getPayment: b.query({ query: orderId => `/payments/${orderId}`, transformResponse: data, providesTags: (_r, _e, id) => [{ type: 'Payment', id }] }),

    // ---- orders
    listMyOrders: b.query({
      query: params => ({ url: '/users/me/orders', params: params ?? undefined }),
      transformResponse: data,
      providesTags: [{ type: 'Orders', id: 'LIST' }],
    }),
    getOrder: b.query({ query: id => `/orders/${id}`, transformResponse: data, providesTags: (_r, _e, id) => [{ type: 'Orders', id }] }),
    cancelOrder: b.mutation({
      query: ({ id, reason }) => ({ url: `/orders/${id}/cancel`, method: 'PATCH', body: reason ? { reason } : {} }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Orders', id }, { type: 'Orders', id: 'LIST' }, { type: 'Payment', id }, { type: 'Refunds', id }],
    }),
    getCancellationEligibility: b.query({
      query: id => `/orders/${id}/cancellation-eligibility`,
      transformResponse: data,
      providesTags: (_r, _e, id) => [{ type: 'Orders', id }],
    }),
    requestRefund: b.mutation({
      query: ({ id, ...body }) => ({ url: `/orders/${id}/refund-request`, method: 'POST', body }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Refunds', id }],
    }),
    listOrderRefunds: b.query({ query: id => `/orders/${id}/refunds`, transformResponse: r => unwrapList(r, 'refunds'), providesTags: (_r, _e, id) => [{ type: 'Refunds', id }] }),
    getReorderPreview: b.query({ query: id => `/orders/${id}/reorder-preview`, transformResponse: data }),
    createReview: b.mutation({
      query: body => ({ url: '/reviews', method: 'POST', body }),
      transformResponse: data,
      invalidatesTags: (_r, _e, { orderId }) => [{ type: 'Orders', id: orderId }],
    }),

    // ---- order chat (channel: SUPPLIER | DRIVER)
    listChat: b.query({
      query: ({ orderId, channel, cursor }) => ({ url: `/orders/${orderId}/chat/${channel}`, params: { limit: 30, ...(cursor ? { cursor } : {}) } }),
      transformResponse: data,
      // each page is cached separately by its cursor; the hook merges them
    }),
    sendChat: b.mutation({
      query: ({ orderId, channel, body }) => ({ url: `/orders/${orderId}/chat/${channel}`, method: 'POST', body: { body } }),
      transformResponse: data,
    }),
    markChatRead: b.mutation({ query: ({ orderId, channel }) => ({ url: `/orders/${orderId}/chat/${channel}/read`, method: 'PATCH' }) }),

    // ---- support tickets
    listTickets: b.query({
      query: params => ({ url: '/support/tickets', params: params ?? undefined }),
      transformResponse: data,
      providesTags: ['Tickets'],
    }),
    getTicket: b.query({ query: id => `/support/tickets/${id}`, transformResponse: data }),
    createTicket: b.mutation({
      query: body => ({ url: '/support/tickets', method: 'POST', body }),
      transformResponse: data,
      invalidatesTags: ['Tickets'],
    }),
    sendTicketMessage: b.mutation({
      query: ({ id, body }) => ({ url: `/support/tickets/${id}/messages`, method: 'POST', body: { body } }),
      transformResponse: data,
      invalidatesTags: ['Tickets'],
    }),
    listTicketMessages: b.query({
      query: ({ id, after }) => ({ url: `/support/tickets/${id}/messages`, params: after ? { after } : undefined }),
      transformResponse: data,
    }),
    markTicketRead: b.mutation({ query: id => ({ url: `/support/tickets/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Tickets'] }),

    // ---- notifications
    listNotifications: b.query({
      query: params => ({ url: '/notifications', params: params ?? undefined }),
      transformResponse: data,
      providesTags: ['Notifications'],
    }),
    getUnreadCount: b.query({ query: () => '/notifications/unread-count', transformResponse: data, providesTags: ['Notifications'] }),
    markNotificationRead: b.mutation({ query: id => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Notifications'] }),
    markAllNotificationsRead: b.mutation({ query: () => ({ url: '/notifications/read-all', method: 'PATCH' }), invalidatesTags: ['Notifications'] }),
  }),
});

export const {
  useGetPublicSettingsQuery,
  useLoginMutation, useRegisterMutation, useOauthLoginMutation, useForgotPasswordMutation, useResetPasswordMutation,
  useSendOtpMutation, useVerifyOtpMutation, useLogoutMutation, useLogoutAllMutation,
  useListSuppliersQuery, useGetSupplierQuery, useListProductsQuery, useGetProductQuery,
  useUpdateProfileMutation, useListAddressesQuery, useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation,
  useValidatePromoMutation, useCreateOrderMutation, useInitiatePaymentMutation, useGetPaymentQuery,
  useListMyOrdersQuery, useGetOrderQuery, useCancelOrderMutation, useGetCancellationEligibilityQuery,
  useRequestRefundMutation, useListOrderRefundsQuery, useCreateReviewMutation, useLazyGetReorderPreviewQuery, useGetReorderPreviewQuery,
  useListChatQuery, useLazyListChatQuery, useSendChatMutation, useMarkChatReadMutation,
  useListTicketsQuery, useGetTicketQuery, useLazyGetTicketQuery, useCreateTicketMutation, useSendTicketMessageMutation,
  useLazyListTicketMessagesQuery, useMarkTicketReadMutation,
  useListNotificationsQuery, useGetUnreadCountQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation,
} = endpoints;
