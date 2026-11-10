import { Link } from 'react-router-dom';
import { Badge, Button, Card, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { refundActions, refundTone } from '@/features/refunds/refundGuards.js';

const ACTION_ORDER = ['approve', 'reject', 'execute', 'manualComplete'];

export function RefundCard({ refund, onAction, showOrderLink = true }) {
  const { t, lang } = useI18n();
  const allowed = refundActions(refund);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold text-text-primary">{formatMoney(refund.amount, lang)}</p>
          <p className="text-sm text-text-secondary">{t(`refunds.method.${refund.method}`)} · {formatDateTime(refund.createdAt, lang)}</p>
        </div>
        <Badge tone={refundTone(refund.status)}>{t(`refunds.status.${refund.status}`)}</Badge>
      </div>
      {refund.reason ? <p className="mt-2 text-sm text-text-primary">{refund.reason}</p> : null}
      {refund.decisionNote ? <p className="mt-1 text-sm text-text-secondary">{t('refunds.decisionNote')}: {refund.decisionNote}</p> : null}
      {refund.failureReason ? <p className="mt-1 text-sm text-danger">{refund.failureReason}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {ACTION_ORDER.filter(a => allowed[a]).map(a => (
          <Button key={a} size="sm" variant={a === 'reject' ? 'outline' : 'primary'} onClick={() => onAction(refund, a)}>{t(`refunds.action.${a}`)}</Button>
        ))}
        {showOrderLink && refund.orderId ? <Link to={`/orders/${refund.orderId}`} className="text-sm font-semibold text-primary">{t('refunds.openOrder')}</Link> : null}
      </div>
    </Card>
  );
}
