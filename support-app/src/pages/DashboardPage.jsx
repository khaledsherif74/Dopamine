import { Link } from 'react-router-dom';
import { Card, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useGetStatsQuery, useListRefundsQuery } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';

const POLL_MS = 60000;

function Stat({ to, label, value }) {
  return (
    <Link to={to} className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-alt">
      <p className="text-3xl font-bold text-text-primary">{value ?? '–'}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.dashboard'));
  const { user } = useAuth();
  const stats = useGetStatsQuery(undefined, { pollingInterval: POLL_MS });
  // only the total matters: limit=1 keeps the payload tiny
  const pendingRefunds = useListRefundsQuery({ status: 'REQUESTED', limit: 1 }, { pollingInterval: POLL_MS });

  if (stats.isLoading) return <LoadingView label={t('common.loading')} />;
  if (stats.isError) return <ErrorView message={apiErrorMessage(stats.error, t)} retryLabel={t('common.retry')} onRetry={stats.refetch} />;
  const s = stats.data ?? {};

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.welcome', { name: user?.name ?? '' })}</h1>
      <section aria-label={t('dashboard.title')} className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat to="/tickets?tab=unassigned" label={t('dashboard.unassigned')} value={s.unassigned} />
        <Stat to="/tickets?tab=mine" label={t('dashboard.mine')} value={s.mine} />
        <Stat to="/tickets?tab=all&status=OPEN" label={t('dashboard.open')} value={s.open} />
        <Stat to="/tickets?tab=all&status=RESOLVED" label={t('dashboard.resolvedToday')} value={s.resolvedToday} />
        <Stat to="/refunds" label={t('dashboard.pendingRefunds')} value={pendingRefunds.data?.total} />
      </section>
      <Card className="p-4">
        <p className="text-sm text-text-secondary">{t('dashboard.hint')}</p>
      </Card>
    </div>
  );
}
