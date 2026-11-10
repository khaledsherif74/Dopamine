import { useState } from 'react';
import { Alert, Button, Modal, TextField, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useForceCancelMutation } from '@/api/endpoints.js';
import { buildForceCancelBody, needsRefundDecision } from '@/features/orders/orderGuards.js';

const DECISIONS = ['FULL', 'PARTIAL', 'NONE'];

// Cancelling is irreversible, so the agent must give a reason and, for online money, an explicit
// refund decision (no default is preselected).
export function ForceCancelDialog({ order, remaining, onClose }) {
  const { t, lang } = useI18n();
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [forceCancel, { isLoading }] = useForceCancelMutation();
  const decide = needsRefundDecision(order);

  async function submit() {
    setServerError('');
    const built = buildForceCancelBody({ reason, decision, amount }, order, { remaining });
    setErrors(built.errors);
    if (!built.ok) return;
    try {
      await forceCancel({ id: order.id, ...built.body }).unwrap();
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <Modal open onClose={isLoading ? () => {} : onClose} title={t('orders.cancel.title')} closeLabel={t('common.close')}>
      <div className="space-y-4">
        <Alert tone="warning">{t('orders.cancel.warning')}</Alert>
        <div>
          <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-text-primary">{t('orders.cancel.reason')}</label>
          <textarea id="cancel-reason" rows={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} aria-invalid={!!errors.reason} className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
          <p className="mt-1 text-xs text-text-secondary">{t('orders.cancel.reasonHint')}</p>
          {errors.reason ? <p role="alert" className="text-sm text-danger">{t(errors.reason)}</p> : null}
        </div>

        {decide ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-text-primary">{t('orders.cancel.refundDecision', { amount: formatMoney(remaining ?? order.payment.amount, lang) })}</legend>
            {DECISIONS.map(d => (
              <label key={d} className="flex items-start gap-2 text-sm text-text-primary">
                <input type="radio" name="refund-decision" value={d} checked={decision === d} onChange={() => setDecision(d)} className="mt-1" />
                <span>{t(`orders.cancel.decision.${d}`)}</span>
              </label>
            ))}
            {errors.decision ? <p role="alert" className="text-sm text-danger">{t(errors.decision)}</p> : null}
            {decision === 'PARTIAL' ? <TextField label={t('orders.cancel.amount')} inputMode="decimal" dir="ltr" value={amount} error={errors.amount && t(errors.amount)} onChange={e => setAmount(e.target.value)} /> : null}
          </fieldset>
        ) : <p className="text-sm text-text-secondary">{t('orders.cancel.noRefundNeeded')}</p>}

        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>{t('orders.cancel.keep')}</Button>
          <Button variant="danger" loading={isLoading} onClick={submit}>{t('orders.cancel.confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
}
