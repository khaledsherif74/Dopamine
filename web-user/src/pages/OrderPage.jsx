import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ErrorView, LoadingView, RatingStars, apiErrorMessage, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { api } from '@/api/api.js';
import { useGetOrderQuery, useGetPaymentQuery, useInitiatePaymentMutation, useListOrderRefundsQuery } from '@/api/endpoints.js';
import { useAppDispatch, useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { socketClient } from '@/lib/socket.js';
import { newKey } from '@/features/checkout/attempt.js';
import { isSafePaymentRedirect } from '@/features/checkout/redirect.js';
import { canPayNow, canReorder, canReview, isActive, shortId, statusTone } from '@/features/orders/status.js';
import { OrderTimeline } from '@/components/OrderTimeline.jsx';
import { OrderChat } from '@/components/OrderChat.jsx';
import { CancelOrderDialog } from '@/components/CancelOrderDialog.jsx';
import { RefundDialog } from '@/components/RefundDialog.jsx';
import { ReviewForm } from '@/components/ReviewForm.jsx';
import { ReorderDialog } from '@/components/ReorderDialog.jsx';

export function OrderPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAuth();
  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(id);
  const { data: payment } = useGetPaymentQuery(id, { skip: !order });
  const { data: refunds = [] } = useListOrderRefundsQuery(id, { skip: !order });
  const [initiatePayment, { isLoading: paying }] = useInitiatePaymentMutation();
  useDocumentTitle(order ? t('orders.orderNumber', { id: shortId(order.id) }) : '');

  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [channel, setChannel] = useState('SUPPLIER');
  const [payError, setPayError] = useState('');
  const [payKey] = useState(newKey);

  // live status: any change pushed by the server re-fetches the order
  useEffect(() => {
    const off = socketClient.subscribeOrder(id, () => {
      dispatch(api.util.invalidateTags([{ type: 'Orders', id }, { type: 'Payment', id }]));
    });
    return off;
  }, [id, dispatch]);

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={error?.status === 404 || error?.status === 403 ? t('orders.notFound') : apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;

  const method = payment?.method ?? order.payment?.method;
  const paid = payment ?? order.payment;
  const active = isActive(order);
  const hasDriver = !!order.delivery?.driverId;
  const delivered = order.status === 'DELIVERED';
  const canCancelHint = order.status === 'PENDING' || order.status === 'ACCEPTED';
  const maxRefund = paid && ['PAID', 'PARTIALLY_REFUNDED'].includes(paid.status) ? paid.amount : undefined;
  const hasOpenRefund = refunds.some(r => ['REQUESTED', 'APPROVED', 'PROCESSING'].includes(r.status));

  async function payNow() {
    setPayError('');
    try {
      const out = await initiatePayment({ orderId: order.id, key: payKey, method: method === 'WALLET' ? 'WALLET' : 'CARD', returnOrigin: window.location.origin }).unwrap();
      if (out.redirectUrl && isSafePaymentRedirect(out.redirectUrl)) window.location.assign(out.redirectUrl);
      else setPayError(t('errors.generic'));
    } catch (err) {
      setPayError(apiErrorMessage(err, t));
    }
  }

  return (
    <div className="space-y-6">
      {location.state?.placed ? <Alert tone="success">{method === 'CASH' ? t('payment.cash') : t('payment.paidBody')}</Alert> : null}
      {location.state?.paymentFailed ? <Alert tone="warning">{t('checkout.paymentFailedToStart')}</Alert> : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('orders.orderNumber', { id: shortId(order.id) })}</h1>
          <p className="text-sm text-text-secondary">
            {order.supplier ? <Link to={`/suppliers/${order.supplier.id}`} className="font-semibold text-primary hover:underline">{order.supplier.shopName}</Link> : null}
            {' · '}{t('orders.placedOn', { date: formatDateTime(order.createdAt, lang) })}
          </p>
          {order.scheduledFor ? <p className="text-sm text-text-secondary">{t('orders.scheduledFor', { date: formatDateTime(order.scheduledFor, lang) })}</p> : null}
        </div>
        <Badge tone={statusTone(order.status)} className="text-sm">{t(`orderStatus.${order.status}`)}</Badge>
      </header>

      <Card><OrderTimeline status={order.status} /></Card>
      {order.status === 'CANCELLED' ? <Alert tone="danger">{t('orders.cancelledNote')}{order.cancelReason ? ` — ${order.cancelReason}` : ''}</Alert> : null}
      {order.status === 'REJECTED' ? <Alert tone="danger">{t('orders.rejectedNote')}{order.rejectReason ? ` — ${order.rejectReason}` : ''}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-lg font-bold text-text-primary">{t('orders.items')}</h2>
          <ul className="divide-y divide-border">
            {order.items?.map(it => (
              <li key={it.id} className="flex justify-between gap-3 py-2 text-sm">
                <span className="text-text-primary">{it.quantity} × {it.product?.name ?? ''}{it.customization ? <em className="block text-xs text-text-secondary">“{it.customization}”</em> : null}</span>
                <span className="font-semibold">{formatMoney(it.unitPrice * it.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-text-primary">
            <div className="flex justify-between"><dt>{t('checkout.subtotal')}</dt><dd>{formatMoney(order.subtotal, lang)}</dd></div>
            {order.promoDiscount > 0 ? <div className="flex justify-between text-success"><dt>{t('checkout.discount')}</dt><dd>−{formatMoney(order.promoDiscount, lang)}</dd></div> : null}
            <div className="flex justify-between"><dt>{t('checkout.deliveryFee')}</dt><dd>{formatMoney(order.deliveryFee, lang)}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>{t('orders.total')}</dt><dd>{formatMoney(order.total, lang)}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          {order.address ? (
            <Card>
              <h2 className="mb-1 text-lg font-bold text-text-primary">{t('orders.address')}</h2>
              <p className="text-sm text-text-secondary">{order.address.label} — {order.address.line1}, {order.address.city}</p>
            </Card>
          ) : null}
          <Card className="space-y-2">
            <h2 className="text-lg font-bold text-text-primary">{t('orders.payment')}</h2>
            <p className="text-sm text-text-secondary">
              {method ? t(`orders.paymentMethods.${method}`) : '—'}
              {paid?.status ? <> · <Badge tone={paid.status === 'PAID' ? 'success' : paid.status === 'FAILED' ? 'danger' : 'neutral'}>{t(`orders.paymentStatuses.${paid.status}`)}</Badge></> : null}
            </p>
            {payError ? <Alert tone="danger">{payError}</Alert> : null}
            {canPayNow(order) ? <Button onClick={payNow} loading={paying}>{t('orders.pay')}</Button> : null}
          </Card>
          {hasDriver && order.delivery?.driver?.name ? (
            <Card><h2 className="mb-1 text-lg font-bold text-text-primary">{t('orders.driver')}</h2><p className="text-sm text-text-secondary">{order.delivery.driver.name}</p></Card>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canCancelHint ? <Button variant="outline" onClick={() => setCancelOpen(true)}>{t('orders.cancel')}</Button> : null}
        <Link to={`/support/new?orderId=${order.id}`} className="inline-flex items-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-surface-alt">{t('support.getHelp')}</Link>
        {canReorder(order) ? <Button variant="outline" onClick={() => setReorderOpen(true)}>{t('orders.reorder')}</Button> : null}
        {delivered && maxRefund && !hasOpenRefund ? <Button variant="outline" onClick={() => setRefundOpen(true)}>{t('orders.refund')}</Button> : null}
      </div>

      {refunds.length ? (
        <Card>
          <h2 className="mb-2 text-lg font-bold text-text-primary">{t('orders.refunds')}</h2>
          <ul className="space-y-2 text-sm">
            {refunds.map(r => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{formatMoney(r.amount, lang)} · {formatDateTime(r.createdAt, lang)}{r.decisionNote ? ` — ${r.decisionNote}` : ''}</span>
                <Badge tone={r.status === 'COMPLETED' ? 'success' : r.status === 'REJECTED' || r.status === 'FAILED' ? 'danger' : 'warning'}>{t(`orders.refundStatuses.${r.status}`)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {order.review ? (
        <Card><h2 className="mb-1 text-lg font-bold text-text-primary">{t('orders.yourReview')}</h2><RatingStars value={order.review.rating} label={t('orders.yourReview')} />{order.review.comment ? <p className="mt-1 text-sm text-text-secondary">{order.review.comment}</p> : null}</Card>
      ) : canReview(order) ? (
        <Card><ReviewForm orderId={order.id} /></Card>
      ) : null}

      <section aria-labelledby="chat-title">
        <h2 id="chat-title" className="mb-2 text-lg font-bold text-text-primary">{t('chat.title')}</h2>
        <div role="tablist" aria-label={t('chat.title')} className="mb-3 inline-flex rounded-full border border-border p-0.5">
          {['SUPPLIER', 'DRIVER'].filter(c => c === 'SUPPLIER' || hasDriver || active).map(c => {
            const unread = order.chatUnread?.[c] ?? 0;
            return (
              <button key={c} id={`tab-${c}`} role="tab" type="button" aria-selected={channel === c} aria-controls="chat-panel" onClick={() => setChannel(c)} className={`rounded-full px-4 py-1 text-sm ${channel === c ? 'bg-primary text-text-inverse' : 'text-text-primary'}`}>
                {t(`chat.${c.toLowerCase()}`)}{unread ? ` (${unread})` : ''}
              </button>
            );
          })}
        </div>
        <div id="chat-panel" role="tabpanel" aria-labelledby={`tab-${channel}`}>
          <OrderChat key={channel} orderId={order.id} channel={channel} myId={user?.id} />
        </div>
      </section>

      <CancelOrderDialog open={cancelOpen} onClose={() => setCancelOpen(false)} orderId={order.id} />
      <ReorderDialog open={reorderOpen} onClose={() => setReorderOpen(false)} orderId={order.id} />
      <RefundDialog open={refundOpen} onClose={() => setRefundOpen(false)} orderId={order.id} maxAmount={maxRefund} />
    </div>
  );
}
