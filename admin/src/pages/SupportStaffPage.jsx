import { useState } from "react";
import {
  useListSupportStaffQuery,
  useCreateSupportStaffMutation,
  useToggleSupportStaffMutation,
} from "@/api/adminApi";

const EMPTY = { name: "", email: "", phone: "", password: "" };

export function SupportStaffPage() {
  const { data, isLoading, isError, refetch } = useListSupportStaffQuery();
  const [createStaff, { isLoading: creating }] =
    useCreateSupportStaffMutation();
  const [toggleStaff] = useToggleSupportStaffMutation();
  const [form, setForm] = useState(EMPTY);
  const [mustChange, setMustChange] = useState(true);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createStaff({
        name: form.name,
        email: form.email,
        password: form.password,
        mustChangePassword: mustChange,
        ...(form.phone ? { phone: form.phone } : {}),
      }).unwrap();
      setForm(EMPTY);
    } catch (err) {
      setError(
        err?.data?.details?.[0]?.message ||
          err?.data?.message ||
          "Couldn't create this account.",
      );
    }
  };

  const handleToggle = async (u) => {
    const verb = u.isActive ? "Suspend" : "Re-activate";
    if (!window.confirm(`${verb} ${u.name}?`)) return;
    try {
      await toggleStaff(u.id).unwrap();
    } catch (err) {
      alert(err?.data?.message || "Couldn't update this account.");
    }
  };

  const input =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Support staff
      </h1>

      <form
        onSubmit={handleCreate}
        className="bg-surface rounded-2xl border border-border p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input className={input} placeholder="Full name" required minLength={2} value={form.name} onChange={set("name")} />
        <input className={input} type="email" placeholder="Email" required value={form.email} onChange={set("email")} />
        <input className={input} placeholder="Phone (+20…) optional" value={form.phone} onChange={set("phone")} />
        <input className={input} type="password" placeholder="Temporary password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" />
        <label className="flex items-center gap-2 text-sm text-text-secondary md:col-span-2">
          <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} />
          Force a password change on first login
        </label>
        <div className="md:col-span-2 flex items-center justify-end gap-3">
          {error ? <span className="text-sm text-danger">{error}</span> : null}
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create support account"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : isError ? (
        <div>
          <p className="text-danger">Couldn't load support staff.</p>
          <button onClick={refetch} className="mt-3 rounded-lg border border-primary text-primary px-4 py-2">
            Retry
          </button>
        </div>
      ) : !data?.staff?.length ? (
        <p className="text-text-secondary">No support accounts yet.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-text-primary">
                    {u.name}
                    {u.mustChangePassword ? (
                      <span className="ml-2 text-[10px] font-semibold text-text-secondary">
                        (password change pending)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-text-primary">{u.email}</div>
                    <div className="text-xs text-text-secondary">{u.phone ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(u)}
                      className={`text-xs font-semibold hover:underline ${
                        u.isActive ? "text-danger" : "text-success"
                      }`}
                    >
                      {u.isActive ? "Suspend" : "Re-activate"}
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
