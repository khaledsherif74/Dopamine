import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, Card, ErrorView, LoadingView, apiErrorMessage, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { useGetOrderQuery, useListRefundsQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { canForceCancel, canReassignDriver, needsRefundDecision, refundableRemaining } from '@/features/orders/orderGuards.js';
import { buildTimeline } from '@/features/orders/timeline.js';
import { ForceCancelDialog } from '@/components/ForceCancelDialog.jsx';
import { ReassignDriverDialog } from '@/components/ReassignDriverDialog.jsx';
import { RefundActionDialog } from '@/components/RefundActionDialog.jsx';
import { RefundCard } from '@/components/RefundCard.jsx';
import { OrderChatTranscript } from '@/components/OrderChatTranscript.jsx';

const Section = ({ title, children }) => (
  <Card className="p-4">
    <h2 className="mb-2 text-sm font-semibold text-text-secondary">{title}</h2>
    {children}
  </Card>
);
const Row = ({ label, children }) => (
  <div className="flex justify-between gap-3 text-sm"><dt className="text-text-secondary">{label}</dt><dd className="text-end text-text-primary">{children}</dd></div>
);

export function OrderPage() {
  const { t, lang } = useI18n();
  const { orderId } = useParams();
  useDocumentTitle(t('order.title', { id: orderId.slice(0, 8) }));
  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(orderId);
  const refunds = useListRefundsQuery({ orderId, limit: 50 });
  const [dialog, setDialog] = useState(null); // 'cancel' | 'reassign'
  const [refundAction, setRefundAction] = useState(null);
  const [channel, setChannel] = useState('SUPPLIER');

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;

  const refundList = refunds.data?.refunds ?? [];
  const remaining = refunds.isSuccess ? refundableRemaining(order.payment, refundList) : undefined;
  const timeline = buildTimeline(order);
  const cancellable = canForceCancel(order);

  return (
    <div className="space-y-4">
      <Link to="/orders" className="text-sm font-semibold text-primary">← {t('order.back')}</Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('order.title', { id: order.id.slice(0, 8) })}</h1>
        <Badge tone="primary">{t(`orderStatus.${order.status}`)}</Badge>
      </div>
      {order.cancelReason ? <Alert tone="warning">{t('order.cancelledWith', { reason: order.cancelReason })}</Alert> : null}
      {order.rejectReason ? <Alert tone="warning">{t('order.rejectedWith', { reason: order.rejectReason })}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {cancellable ? <Button variant="danger" size="sm" onClick={() => setDialog('cancel')}>{t('order.forceCancel')}</Button> : null}
        {canReassignDriver(order) ? <Button variant="outline" size="sm" onClick={() => setDialog('reassign')}>{t('order.reassign')}</Button> : null}
        <Link to={`/refunds?orderId=${order.id}&status=ALL`} className="inline-flex items-center rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-tint">{t('order.allRefunds')}</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t('order.customer')}>
          <dl className="space-y-1">
            <Row label={t('ticket.requester')}>{order.user?.name ?? '—'}</Row>
            <Row label={t('ticket.phone')}><span dir="ltr">{order.user?.phone ?? '—'}</span></Row>
            <Row label={t('ticket.email')}>{order.user?.email ?? '—'}</Row>
            {order.address ? <Row label={t('order.address')}>{[order.address.label, order.address.line1, order.address.city].filter(Boolean).join(', ')}</Row> : null}
          </dl>
        </Section>
        <Section title={t('order.shop')}>
          <dl className="space-y-1">
            <Row label={t('order.shop')}>{order.supplier?.shopName ?? '—'}</Row>
            <Row label={t('ticket.phone')}><span dir="ltr">{order.supplier?.phone ?? '—'}</span></Row>
            <Row label={t('order.shopAddress')}>{order.supplier?.address ?? '—'}</Row>
          </dl>
        </Section>

        <Section title={t('order.items')}>
          <ul className="space-y-1 text-sm">
            {(order.items ?? []).map(i => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-text-primary">{i.quantity} × {i.product?.name ?? '—'}{i.customization ? <span className="block text-xs text-text-secondary">{i.customization}</span> : null}</span>
                <span className="text-text-secondary">{formatMoney(i.unitPrice * i.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 border-t border-border pt-2">
            <Row label={t('order.subtotal')}>{formatMoney(order.subtotal, lang)}</Row>
            <Row label={t('order.deliveryFee')}>{formatMoney(order.deliveryFee, lang)}</Row>
            {order.promoDiscount ? <Row label={t('order.discount')}>−{formatMoney(order.promoDiscount, lang)}</Row> : null}
            <Row label={t('order.total')}><strong>{formatMoney(order.total, lang)}</strong></Row>
          </dl>
          {order.note ? <p className="mt-2 text-sm text-text-secondary">{t('order.note')}: {order.note}</p> : null}
        </Section>

        <Section title={t('order.paymentDelivery')}>
          <dl className="space-y-1">
            <Row label={t('order.payment')}>{order.payment ? `${t(`paymentMethod.${order.payment.method}`)} · ${t(`paymentStatus.${order.payment.status}`)}` : '—'}</Row>
            {order.payment && order.payment.method !== 'CASH' ? <Row label={t('order.refundable')}>{remaining === undefined ? '…' : formatMoney(remaining, lang)}</Row> : null}
            <Row label={t('order.driver')}>{order.delivery?.driver ? <>{order.delivery.driver.name} · <span dir="ltr">{order.delivery.driver.phone}</span></> : t('order.noDriver')}</Row>
            <Row label={t('order.deliveryStatus')}>{order.delivery ? order.delivery.status : '—'}</Row>
          </dl>
        </Section>
      </div>

      <Section title={t('order.timeline')}>
        <ol className="space-y-1 text-sm">
          {timeline.map(e => <li key={e.key} className="flex justify-between gap-3"><span className="text-text-primary">{t(`order.event.${e.key}`)}</span><span className="text-text-secondary">{formatDateTime(e.at, lang)}</span></li>)}
        </ol>
      </Section>

      <Section title={t('order.refunds')}>
        {refunds.isLoading ? <LoadingView label={t('common.loading')} /> : null}
        {refunds.isError ? <ErrorView message={apiErrorMessage(refunds.error, t)} retryLabel={t('common.retry')} onRetry={refunds.refetch} /> : null}
        {refunds.isSuccess && refundList.length === 0 ? <p className="text-sm text-text-secondary">{needsRefundDecision(order) ? t('order.noRefundsYet') : t('order.noRefunds')}</p> : null}
        <div className="space-y-3">{refundList.map(r => <RefundCard key={r.id} refund={r} showOrderLink={false} onAction={(refund, action) => setRefundAction({ refund, action })} />)}</div>
      </Section>

      <Section title={t('order.chats')}>
        <div role="tablist" aria-label={t('order.chats')} className="mb-3 flex gap-2">
          {['SUPPLIER', 'DRIVER'].map(c => (
            <button key={c} role="tab" type="button" aria-selected={channel === c} onClick={() => setChannel(c)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${channel === c ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-primary hover:bg-border'}`}>{t(`orders.chat.${c}`)}</button>
          ))}
        </div>
        <OrderChatTranscript key={channel} orderId={order.id} channel={channel} />
        <p className="mt-2 text-xs text-text-secondary">{t('order.chatReadOnly')}</p>
      </Section>

      {dialog === 'cancel' ? <ForceCancelDialog order={order} remaining={remaining} onClose={() => setDialog(null)} /> : null}
      {dialog === 'reassign' ? <ReassignDriverDialog order={order} onClose={() => setDialog(null)} /> : null}
      {refundAction ? <RefundActionDialog refund={refundAction.refund} action={refundAction.action} onClose={() => setRefundAction(null)} /> : null}
    </div>
  );
}
