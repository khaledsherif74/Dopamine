import { api } from "./apiSlice";

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => "/admin/dashboard",
      transformResponse: (r) => r.data,
      providesTags: ["Dashboard"],
    }),

    listSuppliers: builder.query({
      query: (params) => ({
        url: "/admin/suppliers",
        params: params ?? undefined,
      }),
      transformResponse: (r) => r.data,
      providesTags: ["Suppliers"],
    }),
    approveSupplier: builder.mutation({
      query: (id) => ({
        url: `/admin/suppliers/${id}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Suppliers", "Dashboard"],
    }),
    suspendSupplier: builder.mutation({
      query: (id) => ({
        url: `/admin/suppliers/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["Suppliers", "Dashboard"],
    }),
    updateCommission: builder.mutation({
      query: ({ id, commissionRate }) => ({
        url: `/admin/suppliers/${id}/commission`,
        method: "PATCH",
        body: { commissionRate },
      }),
      invalidatesTags: ["Suppliers"],
    }),

    listDrivers: builder.query({
      query: (params) => ({
        url: "/admin/drivers",
        params: params ?? undefined,
      }),
      transformResponse: (r) => r.data,
      providesTags: ["Drivers"],
    }),
    approveDriver: builder.mutation({
      query: (id) => ({ url: `/admin/drivers/${id}/approve`, method: "PATCH" }),
      invalidatesTags: ["Drivers", "Dashboard"],
    }),
    suspendDriver: builder.mutation({
      query: (id) => ({ url: `/admin/drivers/${id}/suspend`, method: "PATCH" }),
      invalidatesTags: ["Drivers", "Dashboard"],
    }),

    listUsers: builder.query({
      query: (params) => ({ url: "/admin/users", params: params ?? undefined }),
      transformResponse: (r) => r.data,
      providesTags: ["User"],
    }),
    banUser: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/admin/users/${id}/ban`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["User"],
    }),

    listOrders: builder.query({
      query: (params) => ({
        url: "/admin/orders",
        params: params ?? undefined,
      }),
      transformResponse: (r) => r.data,
      providesTags: ["Orders"],
    }),
    listSettings: builder.query({
      query: () => "/settings",
      transformResponse: (r) => r.data,
      providesTags: ["Settings"],
    }),
    updateSetting: builder.mutation({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      transformResponse: (r) => r.data,
      invalidatesTags: ["Settings"],
    }),

    listSupportStaff: builder.query({
      query: (params) => ({
        url: "/admin/support-staff",
        params: params ?? undefined,
      }),
      transformResponse: (r) => r.data,
      providesTags: ["SupportStaff"],
    }),
    createSupportStaff: builder.mutation({
      query: (body) => ({ url: "/admin/support-staff", method: "POST", body }),
      invalidatesTags: ["SupportStaff"],
    }),
    toggleSupportStaff: builder.mutation({
      query: (id) => ({
        url: `/admin/support-staff/${id}/suspend`,
        method: "PATCH",
      }),
      invalidatesTags: ["SupportStaff"],
    }),

    listPromos: builder.query({
      query: (params) => ({
        url: "/promos/admin",
        params: params ?? undefined,
      }),
      transformResponse: (r) => r.data,
      providesTags: ["Promos"],
    }),
    createPromo: builder.mutation({
      query: (body) => ({ url: "/promos/admin", method: "POST", body }),
      transformResponse: (r) => r.data,
      invalidatesTags: ["Promos"],
    }),
    updatePromo: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/promos/admin/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r) => r.data,
      invalidatesTags: ["Promos"],
    }),
    deactivatePromo: builder.mutation({
      query: (id) => ({ url: `/promos/admin/${id}`, method: "DELETE" }),
      invalidatesTags: ["Promos"],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useListSuppliersQuery,
  useApproveSupplierMutation,
  useSuspendSupplierMutation,
  useUpdateCommissionMutation,
  useListDriversQuery,
  useApproveDriverMutation,
  useSuspendDriverMutation,
  useListUsersQuery,
  useBanUserMutation,
  useListOrdersQuery,
  useListSettingsQuery,
  useUpdateSettingMutation,
  useListSupportStaffQuery,
  useCreateSupportStaffMutation,
  useToggleSupportStaffMutation,
  useListPromosQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeactivatePromoMutation,
} = adminApi;
