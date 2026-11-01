import { useState } from "react";
import { useListSettingsQuery, useUpdateSettingMutation } from "@/api/adminApi";

const EDITABLE_KEYS = new Set([
  "DEFAULT_COMMISSION_RATE",
  "DEFAULT_DELIVERY_RADIUS_KM",
  "DEFAULT_DELIVERY_FEE",
  "MIN_ORDER_AMOUNT",
  "MAX_UPLOAD_MB",
  "MAINTENANCE_MODE",
  "FEATURE_SCHEDULED_ORDERS",
  "SUPPORT_PHONE",
  "SUPPORT_EMAIL",
  "PRIVACY_URL",
  "TERMS_URL",
  "CANCEL_GRACE_MINUTES_AFTER_ACCEPT",
  "PREORDER_FREE_CANCEL_HOURS",
  "REFUND_WINDOW_HOURS",
  "UNPAID_ORDER_EXPIRY_MINUTES",
  "CHAT_READONLY_HOURS_AFTER_CLOSE",
]);

const FRIENDLY_LABELS = {
  DEFAULT_COMMISSION_RATE: "Commission rate",
  DEFAULT_DELIVERY_RADIUS_KM: "Delivery radius (km)",
  DEFAULT_DELIVERY_FEE: "Delivery fee (EGP)",
  MIN_ORDER_AMOUNT: "Minimum order (EGP)",
  MAX_UPLOAD_MB: "Max upload size (MB)",
  MAINTENANCE_MODE: "Maintenance mode",
  FEATURE_SCHEDULED_ORDERS: "Scheduled orders",
  SUPPORT_PHONE: "Support phone",
  SUPPORT_EMAIL: "Support email",
  PRIVACY_URL: "Privacy policy URL",
  TERMS_URL: "Terms of service URL",
  CANCEL_GRACE_MINUTES_AFTER_ACCEPT: "Cancel grace after accept (min)",
  PREORDER_FREE_CANCEL_HOURS: "Free pre-order cancel window (hours)",
  REFUND_WINDOW_HOURS: "Refund request window (hours)",
  UNPAID_ORDER_EXPIRY_MINUTES: "Unpaid order expiry (min)",
  CHAT_READONLY_HOURS_AFTER_CLOSE: "Chat read-only after close (hours)",
};

function SettingRow({ setting, onSave }) {
  const [value, setValue] = useState(setting.value);
  const [saving, setSaving] = useState(false);
  const editable = EDITABLE_KEYS.has(setting.key);
  const changed = value !== setting.value;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        key: setting.key,
        value,
        description: setting.description,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 align-top w-1/3">
        <div className="text-sm font-semibold text-text-primary">
          {FRIENDLY_LABELS[setting.key] ?? setting.key}
        </div>
        {setting.description ? (
          <div className="text-xs text-text-secondary mt-0.5">
            {setting.description}
          </div>
        ) : null}
        <div className="font-mono text-[10px] text-text-secondary mt-1">
          {setting.key}
        </div>
      </td>
      <td className="px-4 py-3">
        {editable ? (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full max-w-md rounded-lg border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <span className="text-xs text-text-secondary italic">
            Not editable from this panel — set via environment
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        {editable && changed ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : null}
      </td>
    </tr>
  );
}

export function SettingsPage() {
  const { data, isLoading, isError, refetch } = useListSettingsQuery();
  const [updateSetting] = useUpdateSettingMutation();
  const [error, setError] = useState(null);

  const handleSave = async (payload) => {
    setError(null);
    try {
      await updateSetting(payload).unwrap();
    } catch (err) {
      setError(err?.data?.message || "Couldn't save this setting.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Settings</h1>
      <p className="text-sm text-text-secondary mb-6">
        Runtime configuration. Secrets are managed on the hosting platform and
        never appear here.
      </p>

      {error ? <p className="text-sm text-danger mb-4">{error}</p> : null}

      {isLoading ? (
        <p className="text-text-secondary">Loading…</p>
      ) : isError ? (
        <div>
          <p className="text-danger">Couldn't load settings.</p>
          <button
            onClick={refetch}
            className="mt-3 rounded-lg border border-primary text-primary px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : !data?.length ? (
        <p className="text-text-secondary">No settings found.</p>
      ) : (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-text-secondary text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 w-1/3">Key</th>
                <th className="text-left px-4 py-3">Value</th>
                <th className="text-right px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <SettingRow
                  key={`${s.key}-${s.value}`}
                  setting={s}
                  onSave={handleSave}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
