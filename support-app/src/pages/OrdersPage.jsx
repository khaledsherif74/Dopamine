import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, ErrorView, LoadingView, SelectField, TextField, apiErrorMessage, formatDateTime, formatMoney, useDebounce, useI18n } from '@dopamine/web-shared';
import { useListOrdersQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';

const PAGE_SIZE = 20;
const STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED'];

function OrdersChunk({ search, status, page, isLast, onMore }) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListOrdersQuery({ page, limit: PAGE_SIZE, ...(search ? { search } : {}), ...(status ? { status } : {}) });
  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  const orders = data?.orders ?? [];
  if (page === 1 && orders.length === 0) return <EmptyState title={t('orders.emptyTitle')} message={t('orders.emptyMessage')} />;
  return (
    <>
      <ul className="space-y-2">
        {orders.map(o => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="block rounded-2xl border border-border bg-surface p-3 hover:bg-surface-alt">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-text-primary">#{o.id.slice(0, 8)}</span>
                <Badge tone="primary">{t(`orderStatus.${o.status}`)}</Badge>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{o.user?.name ?? '—'} → {o.supplier?.shopName ?? '—'} · {formatMoney(o.total, lang)} · {formatDateTime(o.createdAt, lang)}</p>
            </Link>
          </li>
        ))}
      </ul>
      {isLast && page * PAGE_SIZE < (data?.total ?? 0) ? <div className="mt-4 text-center"><Button variant="outline" onClick={onMore}>{t('queue.loadMore')}</Button></div> : null}
    </>
  );
}

export function OrdersPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.orders'));
  const [raw, setRaw] = useState('');
  const [status, setStatus] = useState('');
  const [pages, setPages] = useState(1);
  const search = useDebounce(raw.trim().toLowerCase().replace(/[^0-9a-f-]/g, ''), 400);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.orders')}</h1>
      <form role="search" onSubmit={e => e.preventDefault()} className="grid gap-3 sm:grid-cols-2">
        <TextField label={t('orders.search')} type="search" dir="ltr" value={raw} onChange={e => { setRaw(e.target.value); setPages(1); }} hint={t('orders.searchHint')} />
        <SelectField label={t('queue.status')} value={status} onChange={e => { setStatus(e.target.value); setPages(1); }} options={[{ value: '', label: t('queue.any') }, ...STATUSES.map(s => ({ value: s, label: t(`orderStatus.${s}`) }))]} />
      </form>
      {Array.from({ length: pages }, (_, i) => (
        <OrdersChunk key={`${search}-${status}-${i + 1}`} search={search} status={status} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages(p => p + 1)} />
      ))}
    </div>
  );
}
