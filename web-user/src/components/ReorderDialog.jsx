import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, ErrorView, LoadingView, Modal, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useGetReorderPreviewQuery } from '@/api/endpoints.js';
import { useAppDispatch, useAppSelector } from '@/lib/hooks.js';
import { cartReplaced } from '@/features/cart/cartSlice.js';
import { buildReorderCart } from '@/features/orders/reorder.js';

export function ReorderDialog({ open, onClose, orderId }) {
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentCart = useAppSelector(s => s.cart);
  const { data, isLoading, isError, error, refetch } = useGetReorderPreviewQuery(orderId, { skip: !open });
  const built = useMemo(() => (data ? buildReorderCart(data) : null), [data]);

  function apply() {
    dispatch(cartReplaced(built.cart));
    onClose();
    navigate('/cart');
  }

  return (
    <Modal open={open} onClose={onClose} title={t('orders.reorderTitle')} closeLabel={t('common.close')}>
      {isLoading ? <LoadingView label={t('common.loading')} /> : null}
      {isError ? <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} /> : null}
      {built ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">{t('cart.from', { shop: built.cart.supplierName ?? data.supplierName ?? '' })}</p>
          {built.canReorder ? (
            <ul className="divide-y divide-border">
              {built.cart.items.map(i => (
                <li key={i.key} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="text-text-primary">{i.quantity} × {i.name}</span>
                  <span className="font-semibold">{formatMoney(i.price * i.quantity, lang)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Alert tone="warning">{t('orders.reorderEmpty')}</Alert>
          )}
          {built.summary.reduced > 0 ? <Alert tone="info">{t('orders.reorderReduced', { count: built.summary.reduced })}</Alert> : null}
          {built.summary.unavailable > 0 ? <Alert tone="warning">{t('orders.reorderUnavailable', { count: built.summary.unavailable })}</Alert> : null}
          {built.canReorder && currentCart.items.length > 0 ? <Alert tone="info">{t('orders.reorderReplace')}</Alert> : null}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button className="flex-1" disabled={!built.canReorder} onClick={apply}>{t('orders.reorderAdd')}</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>{t('common.cancel')}</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
