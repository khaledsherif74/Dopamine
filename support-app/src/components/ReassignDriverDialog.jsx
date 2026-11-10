import { useState } from 'react';
import { Alert, Button, EmptyState, LoadingView, Modal, TextField, apiErrorMessage, useDebounce, useI18n } from '@dopamine/web-shared';
import { useListDriversQuery, useReassignDriverMutation } from '@/api/endpoints.js';

export function ReassignDriverDialog({ order, onClose }) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(true);
  const [picked, setPicked] = useState(null);
  const [serverError, setServerError] = useState('');
  const debounced = useDebounce(search.trim(), 350);
  const { data, isFetching, isError, error } = useListDriversQuery({ ...(debounced ? { search: debounced } : {}), ...(onlineOnly ? { online: true } : {}), limit: 30 });
  const [reassign, { isLoading }] = useReassignDriverMutation();
  const currentId = order.delivery?.driver?.id;
  const drivers = (data?.drivers ?? []).filter(d => d.id !== currentId);

  async function confirm() {
    setServerError('');
    try {
      await reassign({ id: order.id, driverId: picked.id }).unwrap();
      onClose();
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <Modal open onClose={isLoading ? () => {} : onClose} title={t('orders.reassign.title')} closeLabel={t('common.close')}>
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">{order.delivery?.driver ? t('orders.reassign.current', { name: order.delivery.driver.name }) : t('orders.reassign.none')}</p>
        <TextField label={t('orders.reassign.search')} type="search" value={search} onChange={e => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text-primary"><input type="checkbox" checked={onlineOnly} onChange={e => setOnlineOnly(e.target.checked)} />{t('orders.reassign.onlineOnly')}</label>
        {isFetching && !data ? <LoadingView label={t('common.loading')} /> : null}
        {isError ? <Alert tone="danger">{apiErrorMessage(error, t)}</Alert> : null}
        {data && drivers.length === 0 ? <EmptyState title={t('orders.reassign.emptyTitle')} message={t('orders.reassign.emptyMessage')} /> : null}
        <ul className="max-h-60 space-y-1 overflow-y-auto" role="radiogroup" aria-label={t('orders.reassign.title')}>
          {drivers.map(d => (
            <li key={d.id}>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2 text-sm ${picked?.id === d.id ? 'border-primary bg-primary-tint' : 'border-border'}`}>
                <input type="radio" name="driver" checked={picked?.id === d.id} onChange={() => setPicked(d)} />
                <span className="flex-1"><span className="block font-semibold text-text-primary">{d.name}</span><span className="text-text-secondary" dir="ltr">{d.phone}</span></span>
                <span className={d.isOnline ? 'text-success' : 'text-text-secondary'}>{d.isOnline ? t('orders.reassign.online') : t('orders.reassign.offline')}</span>
              </label>
            </li>
          ))}
        </ul>
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>{t('common.cancel')}</Button>
          <Button disabled={!picked} loading={isLoading} onClick={confirm}>{t('orders.reassign.confirm')}</Button>
        </div>
      </div>
    </Modal>
  );
}
