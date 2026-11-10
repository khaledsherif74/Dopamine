import { useState } from 'react';
import { Alert, Button, Checkbox, Modal, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useDeliverDeliveryMutation, usePickupDeliveryMutation } from '@/api/endpoints.js';
import { cashToCollect, nextStep } from '@/features/jobs/jobRules.js';

// The one forward step available for an assigned delivery. For cash orders the driver must
// confirm the money was collected before marking the order delivered (the server then marks it paid).
export function DeliveryActions({ delivery, compact = false }) {
  const { t, lang } = useI18n();
  const [pickup, p] = usePickupDeliveryMutation();
  const [deliver, d] = useDeliverDeliveryMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [collected, setCollected] = useState(false);
  const [error, setError] = useState('');
  const step = nextStep(delivery);
  const cash = cashToCollect(delivery.order);
  if (!step) return null;

  async function run(mutation) {
    setError('');
    try {
      await mutation(delivery.id).unwrap();
      setConfirmOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }

  return (
    <div className="space-y-2">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {step === 'pickup' ? <Button size={compact ? 'sm' : 'md'} loading={p.isLoading} onClick={() => run(pickup)}>{t('jobs.action.pickup')}</Button> : null}
      {step === 'deliver' ? <Button size={compact ? 'sm' : 'md'} onClick={() => { if (cash > 0) { setCollected(false); setError(''); setConfirmOpen(true); } else run(deliver); }} loading={d.isLoading && cash === 0}>{t('jobs.action.deliver')}</Button> : null}
      {confirmOpen ? (
        <Modal open onClose={d.isLoading ? () => {} : () => setConfirmOpen(false)} title={t('jobs.cashTitle')} closeLabel={t('common.close')}>
          <div className="space-y-3">
            <p className="text-2xl font-bold text-primary">{formatMoney(cash, lang)}</p>
            <p className="text-sm text-text-secondary">{t('jobs.cashHelp')}</p>
            <Checkbox label={t('jobs.cashCollected', { amount: formatMoney(cash, lang) })} checked={collected} onChange={e => setCollected(e.target.checked)} />
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={d.isLoading}>{t('common.cancel')}</Button>
              <Button disabled={!collected} loading={d.isLoading} onClick={() => run(deliver)}>{t('jobs.action.deliver')}</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
