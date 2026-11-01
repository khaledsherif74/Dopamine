import { useState } from "react";
import {
  useListSuppliersQuery,
  useApproveSupplierMutation,
  useSuspendSupplierMutation,
} from "@/api/adminApi";
import { StatusPill } from "@/components/StatusPill";

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function SuppliersPage() {
  const [status, setStatus] = useState(undefined);
  const { data, isLoading, isError, refetch } = useListSuppliersQuery(
    status ? { status } : undefined,
  );
  const [approve] = useApproveSupplierMutation();
  const [suspend] = useSuspendSupplierMutation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Suppliers</h1>
        <div className="flex gap-2">
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
          <p className="text-danger">Couldn't load suppliers.</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-lg border border-primary text-primary px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : !data?.suppliers?.length ? (
        <p className="text-text-secondary">
          No suppliers {status ? `with status ${status.toLowerCase()}` : "yet"}.
        </p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Shop</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Commission</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.suppliers.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">
                      {s.shopName}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {s.address ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{s.email}</div>
                    <div className="text-xs text-text-secondary">{s.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-text-primary">
                    {(s.commissionRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {s.status !== "APPROVED" && (
                      <button
                        onClick={() => approve(s.id)}
                        className="text-xs font-semibold text-success hover:underline"
                      >
                        Approve
                      </button>
                    )}
                    {s.status !== "SUSPENDED" && (
                      <button
                        onClick={() => suspend(s.id)}
                        className="text-xs font-semibold text-danger hover:underline"
                      >
                        Suspend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
