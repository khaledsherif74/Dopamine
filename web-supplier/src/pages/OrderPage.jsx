import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Card, ErrorView, LoadingView, apiErrorMessage, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { useGetOrderQuery } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { shortId } from '@/lib/ids.js';
import { statusTone } from '@/features/orders/status.js';
import { OrderActions } from '@/components/OrderActions.jsx';
import { OrderChat } from '@/components/OrderChat.jsx';

const Row = ({ label, children }) => <div className="flex justify-between gap-3 text-sm"><dt className="text-text-secondary">{label}</dt><dd className="text-end text-text-primary">{children}</dd></div>;

export function OrderPage() {
  const { t, lang } = useI18n();
  const { orderId } = useParams();
  const { user } = useAuth();
  useDocumentTitle(t('orders.title', { id: shortId(orderId) }));
  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(orderId, { pollingInterval: 30000 });

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm font-semibold text-primary"><span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {t('nav.orders')}</Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('orders.title', { id: shortId(order.id) })}</h1>
        <Badge tone={statusTone(order.status)}>{t(`orderStatus.${order.status}`)}</Badge>
      </div>
      {order.cancelReason ? <Alert tone="warning">{t('orders.cancelledWith', { reason: order.cancelReason })}</Alert> : null}
      {order.rejectReason ? <Alert tone="warning">{t('orders.rejectedWith', { reason: order.rejectReason })}</Alert> : null}
      {order.scheduledFor ? <Alert tone="info">{t('orders.scheduledFor', { when: formatDateTime(order.scheduledFor, lang) })}</Alert> : null}
      <OrderActions order={order} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-text-secondary">{t('orders.items')}</h2>
          <ul className="space-y-1 text-sm">
            {(order.items ?? []).map(i => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-text-primary">{i.quantity} × {i.product?.name ?? '—'}{i.customization ? <span className="block text-xs text-text-secondary">{i.customization}</span> : null}</span>
                <span className="text-text-secondary">{formatMoney(i.unitPrice * i.quantity, lang)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-border pt-2">
            <Row label={t('orders.subtotal')}><strong>{formatMoney(order.subtotal, lang)}</strong></Row>
            <Row label={t('orders.payment')}>{order.payment ? `${t(`paymentMethod.${order.payment.method}`)} · ${t(`paymentStatus.${order.payment.status}`)}` : '—'}</Row>
          </dl>
          {order.note ? <p className="text-sm text-text-secondary">{t('orders.note')}: {order.note}</p> : null}
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="text-sm font-semibold text-text-secondary">{t('orders.customer')}</h2>
          <dl className="space-y-1">
            <Row label={t('orders.customerName')}>{order.user?.name ?? '—'}</Row>
            <Row label={t('shop.phone')}>{order.user?.phone ? <a href={`tel:${order.user.phone}`} dir="ltr" className="text-primary">{order.user.phone}</a> : '—'}</Row>
            {order.address ? <Row label={t('orders.address')}>{[order.address.label, order.address.line1, order.address.city].filter(Boolean).join(', ')}</Row> : null}
            <Row label={t('orders.driver')}>{order.delivery?.driver?.name ?? t('orders.noDriver')}</Row>
          </dl>
          <Link to={`/support/new?orderId=${order.id}`} className="inline-block text-sm font-semibold text-primary">{t('orders.contactSupport')}</Link>
        </Card>
      </div>

      <Card className="space-y-2 p-4">
        <h2 className="text-sm font-semibold text-text-secondary">{t('orders.chatTitle')}</h2>
        <OrderChat orderId={order.id} channel="SUPPLIER" myId={user.id} />
      </Card>
    </div>
  );
}
