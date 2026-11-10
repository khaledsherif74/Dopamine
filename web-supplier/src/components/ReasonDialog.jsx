import { useState } from "react";
import {
  Alert,
  Button,
  Modal,
  apiErrorMessage,
  useI18n,
} from "@dopamine/web-shared";

export function ReasonDialog({
  title,
  help,
  confirmLabel,
  build,
  onSubmit,
  onClose,
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setServerError("");
    const built = build({ reason });
    setError(built.errors.reason ? t(built.errors.reason) : "");
    if (!built.ok) return;
    setBusy(true);
    try {
      await onSubmit(built.body.reason);
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={title}
      closeLabel={t("common.close")}
    >
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{help}</p>
        <div>
          <label
            htmlFor="order-reason"
            className="mb-1 block text-sm font-medium text-text-primary"
          >
            {t("orders.reason")}
          </label>
          <textarea
            id="order-reason"
            rows={3}
            maxLength={300}
            value={reason}
            aria-invalid={!!error}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary"
          />
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" loading={busy} onClick={submit}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
