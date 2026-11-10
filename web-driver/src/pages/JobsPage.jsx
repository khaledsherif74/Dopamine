import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useGetMeQuery, useListAssignedQuery, useListAvailableQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { acceptBlockReason, withDistance } from '@/features/jobs/jobRules.js';
import { usePosition } from '@/features/geo/usePosition.jsx';
import { JobCard } from '@/components/JobCard.jsx';

const POLL_MS = 20000; // safety net next to the live notification refetch
const TABS = ['available', 'mine'];

export function JobsPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'available';
  const { data: me } = useGetMeQuery();
  const { position } = usePosition();
  const approved = me?.status === 'APPROVED';
  // the server refuses the available list to drivers who are not approved, so do not ask
  const available = useListAvailableQuery(undefined, { skip: !approved, pollingInterval: POLL_MS });
  const assigned = useListAssignedQuery(undefined, { pollingInterval: POLL_MS });
  const block = acceptBlockReason(me);
  const sorted = useMemo(() => withDistance(available.data, position), [available.data, position]);
  useDocumentTitle(assigned.data?.length ? `(${assigned.data.length}) ${t('nav.jobs')}` : t('nav.jobs'));

  const active = tab === 'available' ? { q: available, list: sorted, skip: !approved } : { q: assigned, list: assigned.data ?? [], skip: false };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.jobs')}</h1>
      <div role="tablist" aria-label={t('jobs.tabs')} className="flex gap-2">
        {TABS.map(k => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setParams(k === 'available' ? {} : { tab: k }, { replace: true })} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-primary hover:bg-border'}`}>
            {t(`jobs.tab.${k}`)} ({k === 'available' ? (approved ? sorted.length : 0) : (assigned.data?.length ?? 0)})
          </button>
        ))}
      </div>

      {tab === 'available' && block ? <Alert tone="info">{t(`jobs.blocked.${block}`)}</Alert> : null}
      {tab === 'available' && !block && !position ? <Alert tone="info">{t('jobs.noPosition')}</Alert> : null}

      {active.skip ? null : active.q.isLoading ? <LoadingView label={t('common.loading')} /> : null}
      {!active.skip && active.q.isError ? <ErrorView message={apiErrorMessage(active.q.error, t)} retryLabel={t('common.retry')} onRetry={active.q.refetch} /> : null}
      {!active.skip && active.q.isSuccess && active.list.length === 0 ? <EmptyState title={t(`jobs.empty.${tab}.title`)} message={t(`jobs.empty.${tab}.message`)} /> : null}
      <ul className="space-y-3">{active.list.map(d => <JobCard key={d.id} delivery={d} kind={tab} blockReason={block} />)}</ul>
    </div>
  );
}
