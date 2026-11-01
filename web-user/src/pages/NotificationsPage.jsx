import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, ErrorView, LoadingView, apiErrorMessage, formatDateTime, useI18n } from '@dopamine/web-shared';
import { useGetUnreadCountQuery, useListNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { notificationTarget } from '@/features/notifications/target.js';

const PAGE_SIZE = 20;

function NotificationsChunk({ page, isLast, onMore, empty }) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListNotificationsQuery({ page, limit: PAGE_SIZE });
  const [markRead] = useMarkNotificationReadMutation();
  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  const items = data?.notifications ?? data?.items ?? [];
  if (page === 1 && items.length === 0) return empty;
  const total = data?.total ?? 0;
  return (
    <>
      <ul className="space-y-2">
        {items.map(n => {
          const target = notificationTarget(n);
          const body = (
            <div className={`rounded-2xl border p-3 ${n.readAt ? 'border-border bg-surface' : 'border-primary/40 bg-primary-tint'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-text-primary">{n.title}</p>
                {!n.readAt ? <Badge tone="primary">•</Badge> : null}
              </div>
              <p className="text-sm text-text-secondary">{n.body}</p>
              <p className="mt-1 text-xs text-text-secondary">{formatDateTime(n.createdAt, lang)}</p>
            </div>
          );
          return (
            <li key={n.id} onClick={() => !n.readAt && markRead(n.id)}>
              {target ? <Link to={target} aria-label={`${n.title} — ${t('notifications.open')}`}>{body}</Link> : body}
            </li>
          );
        })}
      </ul>
      {isLast && page * PAGE_SIZE < total ? <div className="mt-4 text-center"><Button variant="outline" onClick={onMore}>{t('orders.loadMore')}</Button></div> : null}
    </>
  );
}

export function NotificationsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('notifications.title'));
  const [pages, setPages] = useState(1);
  const { data: unread } = useGetUnreadCountQuery();
  const [markAll, { isLoading }] = useMarkAllNotificationsReadMutation();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">{t('notifications.title')}{unread?.count ? <span className="ms-2 text-sm font-normal text-text-secondary">{t('notifications.unreadCount', { count: unread.count })}</span> : null}</h1>
        {unread?.count ? <Button variant="outline" size="sm" loading={isLoading} onClick={() => markAll()}>{t('notifications.markAll')}</Button> : null}
      </div>
      <div className="space-y-2">
        {Array.from({ length: pages }, (_, i) => (
          <NotificationsChunk key={i + 1} page={i + 1} isLast={i + 1 === pages} onMore={() => setPages(p => p + 1)} empty={<EmptyState title={t('notifications.empty')} />} />
        ))}
      </div>
    </div>
  );
}
