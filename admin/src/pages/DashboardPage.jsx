import { useGetDashboardQuery } from "@/api/adminApi";

function Stat({ label, value }) {
  return (
    <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border">
      <p className="text-xs uppercase tracking-wide text-text-secondary font-semibold">
        {label}
      </p>
      <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;
  if (isError) {
    return (
      <div>
        <p className="text-danger">Couldn't load dashboard.</p>
        <button
          onClick={refetch}
          className="mt-3 rounded-lg border border-primary text-primary px-4 py-2 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total orders" value={data.totalOrders} />
        <Stat
          label="Total revenue"
          value={`EGP ${Number(data.totalRevenue).toFixed(2)}`}
        />
        <Stat label="Active suppliers" value={data.activeSuppliers} />
        <Stat label="Drivers online" value={data.activeDrivers} />
      </div>

      <h2 className="text-lg font-bold text-text-primary mt-10 mb-3">
        Today's orders
      </h2>
      {data.ordersToday?.length ? (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {data.ordersToday.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">
                    #{o.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">
                    EGP {Number(o.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-text-secondary">No orders placed today.</p>
      )}
    </div>
  );
}
