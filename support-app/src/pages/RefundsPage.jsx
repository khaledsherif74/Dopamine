import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useListRefundsQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { REFUND_STATUSES } from '@/features/refunds/refundGuards.js';
import { RefundActionDialog } from '@/components/RefundActionDialog.jsx';
import { RefundCard } from '@/components/RefundCard.jsx';

const PAGE_SIZE = 20;
const FILTERS = ['REQUESTED', 'APPROVED', 'FAILED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'ALL'];
const UUID = /^[0-9a-f-]{36}$/i;

function RefundChunk({ params, page, isLast, onMore, onAction }) {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListRefundsQuery({ ...params, page, limit: PAGE_SIZE });
  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  const items = data?.refunds ?? [];
  if (page === 1 && items.length === 0) return <EmptyState title={t('refunds.emptyTitle')} message={t('refunds.emptyMessage')} />;
  return (
    <>
      <div className="space-y-3">{items.map(r => <RefundCard key={r.id} refund={r} onAction={onAction} />)}</div>
      {isLast && page * PAGE_SIZE < (data?.total ?? 0) ? <div className="mt-4 text-center"><Button variant="outline" onClick={onMore}>{t('queue.loadMore')}</Button></div> : null}
    </>
  );
}

export function RefundsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.refunds'));
  const [params, setParams] = useSearchParams();
  const status = REFUND_STATUSES.includes(params.get('status')) ? params.get('status') : params.get('status') === 'ALL' ? 'ALL' : 'REQUESTED';
  const orderIdRaw = params.get('orderId');
  const orderId = orderIdRaw && UUID.test(orderIdRaw) ? orderIdRaw : '';
  const [pages, setPages] = useState(1);
  const [active, setActive] = useState(null); // { refund, action }
  const query = { ...(status !== 'ALL' ? { status } : {}), ...(orderId ? { orderId } : {}) };
  const select = next => { setPages(1); setParams({ ...(next !== 'REQUESTED' ? { status: next } : {}), ...(orderId ? { orderId } : {}) }, { replace: true }); };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.refunds')}</h1>
      <div role="tablist" aria-label={t('refunds.filters')} className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} role="tab" type="button" aria-selected={status === f} onClick={() => select(f)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status === f ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-primary hover:bg-border'}`}>
            {f === 'ALL' ? t('refunds.all') : t(`refunds.status.${f}`)}
          </button>
        ))}
      </div>
      {orderId ? <p className="text-sm text-text-secondary">{t('refunds.forOrder', { id: orderId.slice(0, 8) })} <button type="button" className="font-semibold text-primary" onClick={() => setParams(status !== 'REQUESTED' ? { status } : {}, { replace: true })}>{t('common.clear')}</button></p> : null}
      {Array.from({ length: pages }, (_, i) => (
        <RefundChunk key={`${status}-${orderId}-${i + 1}`} params={query} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages(p => p + 1)} onAction={(refund, action) => setActive({ refund, action })} />
      ))}
      {active ? <RefundActionDialog refund={active.refund} action={active.action} onClose={() => setActive(null)} /> : null}
    </div>
  );
}
