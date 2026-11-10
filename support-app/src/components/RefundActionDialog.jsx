import { useState } from 'react';
import { Alert, Button, Modal, TextField, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useApproveRefundMutation, useExecuteRefundMutation, useManualCompleteRefundMutation, useRejectRefundMutation } from '@/api/endpoints.js';
import { buildApproveBody, buildManualBody, buildRejectBody } from '@/features/refunds/refundGuards.js';

// One dialog for the four refund actions. Validation is local (refundGuards.js mirrors the server
// rules); the server stays the authority and its message is shown if it refuses anyway.
export function RefundActionDialog({ refund, action, onClose, onDone }) {
  const { t, lang } = useI18n();
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [approve, a] = useApproveRefundMutation();
  const [reject, r] = useRejectRefundMutation();
  const [execute, e] = useExecuteRefundMutation();
  const [manual, m] = useManualCompleteRefundMutation();
  const busy = a.isLoading || r.isLoading || e.isLoading || m.isLoading;
  if (!refund || !action) return null;

  async function submit() {
    setServerError('');
    let built = { ok: true, body: {}, errors: {} };
    if (action === 'approve') built = buildApproveBody({ note, amount }, { remaining: refund.payment?.amount });
    if (action === 'reject') built = buildRejectBody({ note });
    if (action === 'manualComplete') built = buildManualBody({ note });
    setErrors(built.errors);
    if (!built.ok) return;
    try {
      if (action === 'approve') await approve({ id: refund.id, ...built.body }).unwrap();
      if (action === 'reject') await reject({ id: refund.id, ...built.body }).unwrap();
      if (action === 'execute') await execute(refund.id).unwrap();
      if (action === 'manualComplete') await manual({ id: refund.id, ...built.body }).unwrap();
      onDone?.();
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  const needsNote = action !== 'execute';
  return (
    <Modal open onClose={busy ? () => {} : onClose} title={t(`refunds.dialog.${action}`)} closeLabel={t('common.close')}>
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{t(`refunds.dialog.${action}Help`, { amount: formatMoney(refund.amount, lang) })}</p>
        {action === 'approve' ? (
          <TextField label={t('refunds.amountOptional')} inputMode="decimal" dir="ltr" value={amount} error={errors.amount && t(errors.amount)} hint={t('refunds.amountHint', { amount: formatMoney(refund.amount, lang) })} onChange={ev => setAmount(ev.target.value)} />
        ) : null}
        {needsNote ? (
          <div>
            <label htmlFor="refund-note" className="mb-1 block text-sm font-medium text-text-primary">{action === 'reject' ? t('refunds.reason') : t('refunds.noteOptional')}</label>
            <textarea id="refund-note" rows={3} maxLength={500} value={note} onChange={ev => setNote(ev.target.value)} aria-invalid={!!errors.note} className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
            {errors.note ? <p role="alert" className="mt-1 text-sm text-danger">{t(errors.note)}</p> : null}
          </div>
        ) : null}
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>{t('common.cancel')}</Button>
          <Button variant={action === 'reject' ? 'danger' : 'primary'} loading={busy} onClick={submit}>{t(`refunds.action.${action}`)}</Button>
        </div>
      </div>
    </Modal>
  );
}
