import { useState } from 'react';
import { Alert, Button, LoadingView, Modal, apiErrorCode, apiErrorMessage, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { useCancelOrderMutation, useGetCancellationEligibilityQuery } from '@/api/endpoints.js';

export function CancelOrderDialog({ open, onClose, orderId }) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError, error } = useGetCancellationEligibilityQuery(orderId, { skip: !open });
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [reason, setReason] = useState('');
  const [failure, setFailure] = useState('');

  const reasonText = code => {
    const key = `orders.reason.${code}`;
    const text = t(key);
    return text === key ? null : text;
  };

  async function confirm() {
    setFailure('');
    try {
      await cancelOrder({ id: orderId, reason: reason.trim() || undefined }).unwrap();
      onClose();
    } catch (err) {
      const code = apiErrorCode(err);
      setFailure((code && reasonText(code)) || apiErrorMessage(err, t));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('orders.cancelTitle')} closeLabel={t('common.close')}>
      {isLoading ? <LoadingView label={t('common.loading')} /> : null}
      {isError ? <Alert tone="danger">{apiErrorMessage(error, t)}</Alert> : null}
      {data ? (
        <div className="space-y-4">
          <p className="text-sm text-text-primary">{reasonText(data.reasonCode) ?? data.message ?? ''}</p>
          {data.canCancel ? (
            <>
              <Alert tone={data.refundType === 'FULL' ? 'success' : 'info'}>
                {data.refundType === 'FULL' ? t('orders.cancelRefund', { amount: formatMoney(data.refundAmount, lang) }) : t('orders.cancelNoRefund')}
              </Alert>
              {data.deadline ? <p className="text-xs text-text-secondary">{t('orders.cancelDeadline', { date: formatDateTime(data.deadline, lang) })}</p> : null}
              <div>
                <label htmlFor="cancel-reason" className="mb-1 block text-sm font-medium text-text-primary">{t('orders.cancelReason')}</label>
                <textarea id="cancel-reason" rows={2} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary" />
              </div>
              {failure ? <Alert tone="danger">{failure}</Alert> : null}
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button variant="danger" className="flex-1" loading={cancelling} onClick={confirm}>{t('orders.cancelConfirm')}</Button>
                <Button variant="outline" className="flex-1" onClick={onClose}>{t('orders.cancelKeep')}</Button>
              </div>
            </>
          ) : (
            <Button variant="outline" className="w-full" onClick={onClose}>{t('common.close')}</Button>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
