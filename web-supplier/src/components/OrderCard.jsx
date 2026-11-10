import { Link } from 'react-router-dom';
import { Badge, formatMoney, formatDateTime, useI18n } from '@dopamine/web-shared';
import { minutesSince } from '@/features/orders/orderBoard.js';
import { statusTone } from '@/features/orders/status.js';
import { shortId } from '@/lib/ids.js';
import { OrderActions } from '@/components/OrderActions.jsx';

export function OrderCard({ order, now }) {
  const { t, lang } = useI18n();
  const waiting = order.status === 'PENDING' ? minutesSince(order.createdAt, now) : null;
  const chat = order.chatUnread?.SUPPLIER ?? 0;
  const items = (order.items ?? []).map(i => `${i.quantity}× ${i.product?.name ?? '—'}`).join(', ');
  return (
    <li className="rounded-2xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link to={`/orders/${order.id}`} className="font-mono text-sm font-semibold text-primary">#{shortId(order.id)}</Link>
        <div className="flex flex-wrap gap-1">
          {chat > 0 ? <Badge tone="primary">{t('orders.chatUnread', { count: chat })}</Badge> : null}
          <Badge tone={statusTone(order.status)}>{t(`orderStatus.${order.status}`)}</Badge>
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-text-primary">{items}</p>
      <p className="mt-1 text-xs text-text-secondary">
        {order.user?.name ?? '—'} · {formatMoney(order.subtotal ?? order.total, lang)}
        {order.payment ? ` · ${t(`paymentMethod.${order.payment.method}`)}` : ''}
      </p>
      {order.scheduledFor ? <p className="mt-1 text-xs font-semibold text-warning">{t('orders.scheduledFor', { when: formatDateTime(order.scheduledFor, lang) })}</p> : null}
      {waiting !== null ? <p className="mt-1 text-xs text-text-secondary">{t('orders.waiting', { minutes: waiting })}</p> : null}
      <div className="mt-2"><OrderActions order={order} compact /></div>
    </li>
  );
}
