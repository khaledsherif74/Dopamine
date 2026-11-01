import { useState, useEffect } from "react";
import { useListUsersQuery, useBanUserMutation } from "@/api/adminApi";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useListUsersQuery(
    debounced ? { search: debounced } : undefined,
  );
  const [banUser] = useBanUserMutation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : isError ? (
        <div>
          <p className="text-danger">Couldn't load users.</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-lg border border-primary text-primary px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : !data?.users?.length ? (
        <p className="text-text-secondary">No users found.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Active</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {u.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{u.email}</div>
                    <div className="text-xs text-text-secondary">
                      {u.phone ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Active" : "Banned"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        banUser({ id: u.id, isActive: !u.isActive })
                      }
                      className={`text-xs font-semibold hover:underline ${
                        u.isActive ? "text-danger" : "text-success"
                      }`}
                    >
                      {u.isActive ? "Ban" : "Unban"}
                    </button>
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
