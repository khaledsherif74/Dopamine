import { useMemo, useState } from 'react';
import { Button, Checkbox, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useListSuppliersQuery } from '@/api/endpoints.js';
import { useAppSelector } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { SupplierCard } from '@/components/SupplierCard.jsx';

export function SuppliersPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.suppliers'));
  const { lat, lng } = useAppSelector(s => s.location);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const { data, isLoading, isError, error, refetch } = useListSuppliersQuery({
    ...(search ? { search } : {}),
    ...(lat != null ? { lat, lng } : {}),
  });
  const shown = useMemo(() => (data ?? []).filter(s => !openOnly || (s.isOpenNow && s.isAcceptingOrders !== false)), [data, openOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="me-auto text-2xl font-bold text-text-primary">{t('suppliers.title')}</h1>
        <form role="search" className="flex gap-2" onSubmit={e => { e.preventDefault(); setSearch(q.trim()); }}>
          <label htmlFor="suppliers-q" className="sr-only">{t('common.search')}</label>
          <input id="suppliers-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('common.search')} className="w-48 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-primary sm:w-64" />
          <Button type="submit" size="sm" className="rounded-full">{t('common.search')}</Button>
        </form>
        <Checkbox label={t('suppliers.openNow')} checked={openOnly} onChange={e => setOpenOnly(e.target.checked)} />
      </div>
      {isLoading ? (
        <LoadingView label={t('common.loading')} />
      ) : isError ? (
        <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />
      ) : shown.length === 0 ? (
        <EmptyState title={t('suppliers.noResults')} />
      ) : (
        <>
          <p className="mb-3 text-sm text-text-secondary" aria-live="polite">{t('suppliers.results', { count: shown.length })}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(s => <SupplierCard key={s.id} supplier={s} />)}
          </div>
        </>
      )}
    </div>
  );
}
