import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, ErrorView, LoadingView, apiErrorMessage, formatDate, useI18n } from '@dopamine/web-shared';
import { useListTicketsQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { shortId } from '@/features/orders/status.js';
import { ticketTone } from '@/features/support/ticketStatus.js';

const PAGE_SIZE = 20;

function TicketsChunk({ page, isLast, onMore }) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListTicketsQuery({ page, limit: PAGE_SIZE });
  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  const tickets = data?.tickets ?? [];
  if (page === 1 && tickets.length === 0) {
    return <EmptyState title={t('support.empty')} message={t('support.emptyHint')} action={<Link to="/support/new" className="font-semibold text-primary">{t('support.newTicket')}</Link>} />;
  }
  return (
    <>
      <ul className="space-y-3">
        {tickets.map(tk => (
          <li key={tk.id}>
            <Link to={`/support/${tk.id}`} className="block rounded-2xl border border-border bg-surface p-4 transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-semibold text-text-primary">{tk.subject}</span>
                <span className="flex items-center gap-2">
                  {tk.unreadCount > 0 ? <Badge tone="primary">{t('support.unread', { count: tk.unreadCount })}</Badge> : null}
                  <Badge tone={ticketTone(tk.status)}>{t(`support.status.${tk.status}`)}</Badge>
                </span>
              </div>
              <p className="mt-1 line-clamp-1 text-sm text-text-secondary">{tk.messages?.[0]?.body}</p>
              <p className="mt-1 text-xs text-text-secondary">{t('support.ticketNumber', { id: shortId(tk.id) })} · {t(`support.categories.${tk.category}`)} · {formatDate(tk.lastMessageAt ?? tk.updatedAt, lang)}</p>
            </Link>
          </li>
        ))}
      </ul>
      {isLast && page * PAGE_SIZE < (data?.total ?? 0) ? <div className="mt-4 text-center"><Button variant="outline" onClick={onMore}>{t('support.loadMore')}</Button></div> : null}
    </>
  );
}

export function TicketsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('support.title'));
  const [pages, setPages] = useState(1);
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">{t('support.title')}</h1>
        <Link to="/support/new" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-text-inverse">{t('support.newTicket')}</Link>
      </div>
      <div className="space-y-3">
        {Array.from({ length: pages }, (_, i) => <TicketsChunk key={i + 1} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages(p => p + 1)} />)}
      </div>
    </div>
  );
}
