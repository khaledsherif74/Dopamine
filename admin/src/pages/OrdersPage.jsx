import { useState } from "react";
import { useListOrdersQuery } from "@/api/adminApi";
import { StatusPill } from "@/components/StatusPill";

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "OUT_FOR_DELIVERY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrdersPage() {
  const [status, setStatus] = useState(undefined);
  const { data, isLoading, isError, refetch } = useListOrdersQuery(
    status ? { status } : undefined,
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Orders</h1>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                status === f.value
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border hover:bg-surface-alt"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : isError ? (
        <div>
          <p className="text-danger">Couldn't load orders.</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-lg border border-primary text-primary px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : !data?.orders?.length ? (
        <p className="text-text-secondary">No orders found.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Shop</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => {
                return (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-text-primary">
                        #{o.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {o.user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-primary">
                      {o.supplier?.shopName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-primary font-semibold">
                      EGP {Number(o.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
