import { useState } from 'react';
import { Alert, Button, Modal, TextField, apiErrorCode, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useRequestRefundMutation } from '@/api/endpoints.js';

export function RefundDialog({ open, onClose, orderId, maxAmount }) {
  const { t, lang } = useI18n();
  const [requestRefund, { isLoading }] = useRequestRefundMutation();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (reason.trim().length < 5) return setError(t('orders.refundReasonHint'));
    const body = { id: orderId, reason: reason.trim() };
    if (amount !== '') {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) return setError(t('validation.required'));
      body.amount = n;
    }
    try {
      await requestRefund(body).unwrap();
      setDone(true);
    } catch (err) {
      const code = apiErrorCode(err);
      const key = code ? `orders.refundReasons.${code}` : null;
      setError(key && t(key) !== key ? t(key) : apiErrorMessage(err, t));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('orders.refundTitle')} closeLabel={t('common.close')}>
      {done ? (
        <div className="space-y-4">
          <Alert tone="success">{t('orders.refundSent')}</Alert>
          <Button className="w-full" onClick={onClose}>{t('common.close')}</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor="refund-reason" className="mb-1 block text-sm font-medium text-text-primary">{t('orders.refundReason')}</label>
            <textarea id="refund-reason" rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary" />
          </div>
          <TextField label={t('orders.refundAmount')} type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} hint={maxAmount ? t('orders.refundAmountHint', { max: formatMoney(maxAmount, lang) }) : undefined} />
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <Button type="submit" className="w-full" loading={isLoading}>{t('orders.refundSubmit')}</Button>
        </form>
      )}
    </Modal>
  );
}
