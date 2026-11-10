import { Link } from 'react-router-dom';
import { Badge, Card, formatMoney, useI18n } from '@dopamine/web-shared';
import { ownerOf } from '@/features/tickets/owner.js';

const ROLE_KEY = { USER: 'roles.USER', SUPPLIER: 'roles.SUPPLIER', DRIVER: 'roles.DRIVER' };

// Customer / supplier / driver on the side of a ticket, plus the linked order's summary.
export function OwnerPanel({ ticket }) {
  const { t, lang } = useI18n();
  const owner = ownerOf(ticket);
  const order = ticket.order;
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-sm font-semibold text-text-secondary">{t('ticket.requester')}</h2>
        <p className="mt-1 font-semibold text-text-primary">{owner.name ?? '—'}</p>
        {owner.role ? <Badge className="mt-1">{t(ROLE_KEY[owner.role])}</Badge> : null}
        <dl className="mt-3 space-y-1 text-sm">
          <div><dt className="inline text-text-secondary">{t('ticket.email')}: </dt><dd className="inline break-all text-text-primary">{owner.email ?? '—'}</dd></div>
          <div><dt className="inline text-text-secondary">{t('ticket.phone')}: </dt><dd className="inline text-text-primary" dir="ltr">{owner.phone ?? '—'}</dd></div>
        </dl>
      </Card>

      {order ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-text-secondary">{t('ticket.linkedOrder')}</h2>
          <p className="mt-1 font-mono text-sm text-text-primary">#{order.id.slice(0, 8)}</p>
          <Badge tone="primary" className="mt-1">{t(`orderStatus.${order.status}`)}</Badge>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="inline text-text-secondary">{t('order.shop')}: </dt><dd className="inline text-text-primary">{order.supplier?.shopName ?? '—'}</dd></div>
            <div><dt className="inline text-text-secondary">{t('order.total')}: </dt><dd className="inline text-text-primary">{formatMoney(order.total, lang)}</dd></div>
            {order.payment ? <div><dt className="inline text-text-secondary">{t('order.payment')}: </dt><dd className="inline text-text-primary">{t(`paymentMethod.${order.payment.method}`)} · {t(`paymentStatus.${order.payment.status}`)}</dd></div> : null}
          </dl>
          <Link to={`/orders/${order.id}`} className="mt-3 inline-block text-sm font-semibold text-primary">{t('ticket.openOrder')}</Link>
        </Card>
      ) : null}
    </div>
  );
}
