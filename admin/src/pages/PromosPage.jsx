import { useState } from "react";
import {
  useListPromosQuery,
  useCreatePromoMutation,
  useUpdatePromoMutation,
  useDeactivatePromoMutation,
} from "@/api/adminApi";
import { StatusPill } from "@/components/StatusPill";

const emptyForm = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  perUserLimit: "1",
  expiresAt: "",
  isActive: true,
};

function PromoForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial ?? emptyForm);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount
        ? Number(form.minOrderAmount)
        : undefined,
      maxDiscountAmount: form.maxDiscountAmount
        ? Number(form.maxDiscountAmount)
        : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perUserLimit: Number(form.perUserLimit) || 1,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">Code</span>
          <input
            value={form.code}
            onChange={(e) => update({ code: e.target.value.toUpperCase() })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm font-mono"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">Type</span>
          <select
            value={form.type}
            onChange={(e) => update({ type: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
          >
            <option value="PERCENT">Percentage</option>
            <option value="FIXED">Fixed amount (EGP)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Value ({form.type === "PERCENT" ? "%" : "EGP"})
          </span>
          <input
            type="number"
            step="0.01"
            value={form.value}
            onChange={(e) => update({ value: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Max discount (EGP)
          </span>
          <input
            type="number"
            step="0.01"
            value={form.maxDiscountAmount}
            onChange={(e) => update({ maxDiscountAmount: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
            placeholder="optional"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Min order (EGP)
          </span>
          <input
            type="number"
            step="0.01"
            value={form.minOrderAmount}
            onChange={(e) => update({ minOrderAmount: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
            placeholder="optional"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Total usage limit
          </span>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => update({ usageLimit: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
            placeholder="unlimited"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Per user limit
          </span>
          <input
            type="number"
            value={form.perUserLimit}
            onChange={(e) => update({ perUserLimit: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase text-text-secondary">
            Expires at
          </span>
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => update({ expiresAt: e.target.value })}
            className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs uppercase text-text-secondary">
          Description
        </span>
        <input
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          className="w-full mt-1 rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm"
          placeholder="Shown to customers"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => update({ isActive: e.target.checked })}
        />
        <span className="text-sm">Active</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function PromosPage() {
  const { data, isLoading } = useListPromosQuery();
  const [create, { isLoading: creating }] = useCreatePromoMutation();
  const [update, { isLoading: updating }] = useUpdatePromoMutation();
  const [deactivate] = useDeactivatePromoMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleCreate = async (payload) => {
    await create(payload)
      .unwrap()
      .catch(() => {});
    setShowForm(false);
  };

  const handleUpdate = async (payload) => {
    await update({ id: editingId, ...payload })
      .unwrap()
      .catch(() => {});
    setEditingId(null);
    setShowForm(false);
  };

  const editingPromo = editingId
    ? data?.promos?.find((p) => p.id === editingId)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Promo codes</h1>
        {!showForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            + New promo
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-surface rounded-2xl border border-border p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">
            {editingId ? "Edit promo" : "New promo"}
          </h2>
          <PromoForm
            initial={
              editingPromo
                ? {
                    ...editingPromo,
                    value: String(editingPromo.value),
                    minOrderAmount: editingPromo.minOrderAmount
                      ? String(editingPromo.minOrderAmount)
                      : "",
                    maxDiscountAmount: editingPromo.maxDiscountAmount
                      ? String(editingPromo.maxDiscountAmount)
                      : "",
                    usageLimit: editingPromo.usageLimit
                      ? String(editingPromo.usageLimit)
                      : "",
                    perUserLimit: String(editingPromo.perUserLimit),
                    expiresAt: editingPromo.expiresAt
                      ? new Date(editingPromo.expiresAt)
                          .toISOString()
                          .slice(0, 16)
                      : "",
                  }
                : undefined
            }
            onSubmit={editingId ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            loading={creating || updating}
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : !data?.promos?.length ? (
        <p className="text-text-secondary">No promo codes yet.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Uses</th>
                <th className="text-left px-4 py-3">Expires</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.promos.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-semibold text-text-primary">
                    {p.code}
                  </td>
                  <td className="px-4 py-3">
                    {p.type === "PERCENT" ? `${p.value}%` : `EGP ${p.value}`}
                    {p.maxDiscountAmount ? (
                      <span className="text-xs text-text-secondary">
                        {" "}
                        (max EGP {p.maxDiscountAmount})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.usedCount}
                    {p.usageLimit ? ` / ${p.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {p.expiresAt
                      ? new Date(p.expiresAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      status={p.isActive ? "APPROVED" : "SUSPENDED"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setEditingId(p.id);
                        setShowForm(true);
                      }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Edit
                    </button>
                    {p.isActive && (
                      <button
                        onClick={() => deactivate(p.id)}
                        className="text-xs font-semibold text-danger hover:underline"
                      >
                        Deactivate
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
