import { useEffect, useMemo, useState } from 'react';
import { Alert, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useListMyOrdersQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { groupBoard } from '@/features/orders/orderBoard.js';
import { OrderCard } from '@/components/OrderCard.jsx';

const POLL_MS = 30000; // safety net next to the live notification refetch
const DONE_SHOWN = 10;
const COLUMNS = ['new', 'inProgress', 'handover'];

export function OrdersPage() {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListMyOrdersQuery({ limit: 100 }, { pollingInterval: POLL_MS });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000); // keeps "waiting N min" honest
    return () => clearInterval(id);
  }, []);
  const board = useMemo(() => groupBoard(data?.orders), [data]);
  useDocumentTitle(board.new.length ? `(${board.new.length}) ${t('nav.orders')}` : t('nav.orders'));

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  const total = (data?.orders ?? []).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.orders')}</h1>
      {board.new.length > 0 ? <Alert tone="warning" role="status">{t('orders.newBanner', { count: board.new.length })}</Alert> : null}
      {total === 0 ? <EmptyState title={t('orders.emptyTitle')} message={t('orders.emptyMessage')} /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map(col => (
            <section key={col} aria-labelledby={`col-${col}`} className="space-y-2 rounded-2xl bg-surface-alt p-3">
              <h2 id={`col-${col}`} className="text-sm font-semibold text-text-secondary">{t(`orders.column.${col}`)} ({board[col].length})</h2>
              {board[col].length === 0 ? <p className="text-sm text-text-secondary">{t('orders.columnEmpty')}</p> : <ul className="space-y-2">{board[col].map(o => <OrderCard key={o.id} order={o} now={now} />)}</ul>}
            </section>
          ))}
        </div>
      )}
      {board.done.length > 0 ? (
        <section aria-labelledby="col-done" className="space-y-2">
          <h2 id="col-done" className="text-sm font-semibold text-text-secondary">{t('orders.column.done')}</h2>
          <ul className="grid gap-2 md:grid-cols-2">{board.done.slice(0, DONE_SHOWN).map(o => <OrderCard key={o.id} order={o} now={now} />)}</ul>
        </section>
      ) : null}
    </div>
  );
}
