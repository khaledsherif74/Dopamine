import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Badge, Button, EmptyState, ErrorView, LoadingView, SelectField, TextField, formatDateTime, useDebounce, useI18n } from '@dopamine/web-shared';
import { useGetStatsQuery } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { useSupportQueue } from '@/features/queue/useSupportQueue.js';
import { filterFromParams, filterToParams } from '@/features/queue/filterUrl.js';
import { STATUS_FILTERS, TABS, unreadTotal } from '@/features/queue/ticketQueue.js';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, priorityTone, ticketTone } from '@/features/tickets/ticketStatus.js';
import { ownerOf } from '@/features/tickets/owner.js';

function TicketRow({ ticket }) {
  const { t, lang } = useI18n();
  const owner = ownerOf(ticket);
  const unread = ticket.unreadCount ?? 0;
  return (
    <li>
      <Link to={`/tickets/${ticket.id}`} className={`block rounded-2xl border p-3 hover:bg-surface-alt ${unread ? 'border-primary/50 bg-primary-tint' : 'border-border bg-surface'}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="flex items-center gap-2 font-semibold text-text-primary">
            {unread ? <span role="img" aria-label={t('queue.unread', { count: unread })} className="inline-block h-2.5 w-2.5 rounded-full bg-primary" /> : null}
            {ticket.subject}
          </p>
          <div className="flex flex-wrap gap-1">
            <Badge tone={priorityTone(ticket.priority)}>{t(`priority.${ticket.priority}`)}</Badge>
            <Badge tone={ticketTone(ticket.status)}>{t(`ticketStatus.${ticket.status}`)}</Badge>
          </div>
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          {owner.name ?? (owner.role ? t(`roles.${owner.role}`) : '—')} · {t(`category.${ticket.category}`)} · #{ticket.id.slice(0, 8)}
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {ticket.assignedAgent?.name ? t('queue.assignedTo', { name: ticket.assignedAgent.name }) : t('queue.unassignedLabel')} · {formatDateTime(ticket.lastMessageAt ?? ticket.createdAt, lang)}
        </p>
      </Link>
    </li>
  );
}

export function QueuePage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.tickets'));
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const filter = useMemo(() => filterFromParams(params), [params]);
  const [search, setSearch] = useState(filter.search);
  const debounced = useDebounce(search, 400);
  const { data: stats } = useGetStatsQuery(undefined, { pollingInterval: 60000 });

  // The debounced search box is the only thing that writes `q` back to the URL.
  const effective = useMemo(() => ({ ...filter, search: debounced.trim() }), [filter, debounced]);
  const queue = useSupportQueue({ filter: effective, myId: user.id });
  const unreadInView = unreadTotal(queue.tickets);

  const update = patch => setParams(filterToParams({ ...filter, search: debounced.trim(), ...patch }), { replace: true });
  const counts = { unassigned: stats?.unassigned, mine: stats?.mine, all: undefined };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t('nav.tickets')}</h1>
        {unreadInView > 0 ? <Badge tone="primary">{t('queue.unreadTotal', { count: unreadInView })}</Badge> : null}
      </div>

      <div role="tablist" aria-label={t('queue.tabs')} className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            type="button"
            aria-selected={filter.tab === tab}
            onClick={() => update({ tab })}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter.tab === tab ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-primary hover:bg-border'}`}
          >
            {t(`queue.tab.${tab}`)}{counts[tab] !== undefined ? ` (${counts[tab]})` : ''}
          </button>
        ))}
      </div>

      <form role="search" onSubmit={e => e.preventDefault()} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label={t('queue.search')} type="search" value={search} maxLength={100} onChange={e => setSearch(e.target.value)} placeholder={t('queue.searchPlaceholder')} />
        <SelectField label={t('queue.status')} value={filter.status} onChange={e => update({ status: e.target.value })} options={STATUS_FILTERS.map(s => ({ value: s, label: t(`queue.statusFilter.${s}`) }))} />
        <SelectField label={t('queue.priority')} value={filter.priority} onChange={e => update({ priority: e.target.value })} options={[{ value: '', label: t('queue.any') }, ...TICKET_PRIORITIES.map(p => ({ value: p, label: t(`priority.${p}`) }))]} />
        <SelectField label={t('queue.category')} value={filter.category} onChange={e => update({ category: e.target.value })} options={[{ value: '', label: t('queue.any') }, ...TICKET_CATEGORIES.map(c => ({ value: c, label: t(`category.${c}`) }))]} />
      </form>

      <p className="text-sm text-text-secondary" aria-live="polite">{t('queue.count', { count: queue.total })}</p>

      {queue.loading ? <LoadingView label={t('common.loading')} /> : null}
      {!queue.loading && queue.error && queue.tickets.length === 0 ? <ErrorView message={queue.error} retryLabel={t('common.retry')} onRetry={queue.reload} /> : null}
      {!queue.loading && queue.error && queue.tickets.length > 0 ? <Alert tone="warning">{queue.error}</Alert> : null}
      {!queue.loading && !queue.error && queue.tickets.length === 0 ? <EmptyState title={t('queue.emptyTitle')} message={t('queue.emptyMessage')} /> : null}

      <ul className="space-y-2">{queue.tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} />)}</ul>
      {queue.hasMore ? <div className="text-center"><Button variant="outline" onClick={queue.loadMore} loading={queue.loadingMore}>{t('queue.loadMore')}</Button></div> : null}
    </div>
  );
}
