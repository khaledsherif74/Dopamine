import { useState } from "react";
import {
  useListDriversQuery,
  useApproveDriverMutation,
  useSuspendDriverMutation,
} from "@/api/adminApi";
import { StatusPill } from "@/components/StatusPill";

const FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Suspended", value: "SUSPENDED" },
];

export function DriversPage() {
  const [status, setStatus] = useState(undefined);
  const { data, isLoading, isError, refetch } = useListDriversQuery(
    status ? { status } : undefined,
  );
  const [approve] = useApproveDriverMutation();
  const [suspend] = useSuspendDriverMutation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Drivers</h1>
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
          <p className="text-danger">Couldn't load drivers.</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-lg border border-primary text-primary px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : !data?.drivers?.length ? (
        <p className="text-text-secondary">No drivers found.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Online</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.drivers.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text-primary">
                      {d.name}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {d.email} · {d.phone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-primary capitalize">
                    {d.vehicleType ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        d.isOnline ? "bg-success" : "bg-gray-300"
                      }`}
                    />
                    <span className="ml-2 text-xs text-text-secondary">
                      {d.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={d.status} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {d.status !== "APPROVED" && (
                      <button
                        onClick={() => approve(d.id)}
                        className="text-xs font-semibold text-success hover:underline"
                      >
                        Approve
                      </button>
                    )}
                    {d.status !== "SUSPENDED" && (
                      <button
                        onClick={() => suspend(d.id)}
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
