import { useMemo, useState } from 'react';
import { Alert, Card, ErrorView, LoadingView, TextField, apiErrorMessage, formatDateTime, formatMoney, useI18n } from '@dopamine/web-shared';
import { useGetEarningsQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { RANGE_PRESETS, presetRange, validateRange } from '@/features/earnings/earningsRange.js';
import { shortId } from '@/lib/ids.js';

const Stat = ({ label, value, strong }) => (
  <Card className="p-4">
    <p className="text-sm text-text-secondary">{label}</p>
    <p className={`mt-1 ${strong ? 'text-3xl font-bold text-primary' : 'text-2xl font-semibold text-text-primary'}`}>{value}</p>
  </Card>
);

export function EarningsPage() {
  const { t, lang } = useI18n();
  useDocumentTitle(t('nav.earnings'));
  const [preset, setPreset] = useState('7d');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [useCustom, setUseCustom] = useState(false);
  const custom$ = useMemo(() => validateRange(custom), [custom]);
  const presetArg = useMemo(() => presetRange(preset), [preset]);
  const range = useCustom ? custom$.range : presetArg;
  const { data, isLoading, isFetching, isError, error, refetch } = useGetEarningsQuery(range, { skip: useCustom && !custom$.ok });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.earnings')}</h1>
      <div role="group" aria-label={t('earnings.range')} className="flex flex-wrap items-end gap-2">
        {RANGE_PRESETS.map(p => (
          <button key={p} type="button" aria-pressed={!useCustom && preset === p} onClick={() => { setUseCustom(false); setPreset(p); }} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!useCustom && preset === p ? 'bg-primary text-text-inverse' : 'bg-surface-alt text-text-primary hover:bg-border'}`}>{t(`earnings.preset.${p}`)}</button>
        ))}
        <TextField label={t('earnings.from')} type="date" value={custom.from} onChange={e => { setCustom(c => ({ ...c, from: e.target.value })); setUseCustom(true); }} />
        <TextField label={t('earnings.to')} type="date" value={custom.to} onChange={e => { setCustom(c => ({ ...c, to: e.target.value })); setUseCustom(true); }} />
      </div>
      {useCustom && custom$.error ? <Alert tone="warning">{t(custom$.error)}</Alert> : null}

      {isLoading ? <LoadingView label={t('common.loading')} /> : null}
      {isError ? <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} /> : null}
      {data ? (
        <div className={isFetching ? 'opacity-60' : ''} aria-busy={isFetching}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat strong label={t('earnings.total')} value={formatMoney(data.totalEarned, lang)} />
            <Stat label={t('earnings.deliveries')} value={data.totalDeliveries} />
          </div>
          <p className="mt-2 text-sm text-text-secondary">{t('earnings.explain')}</p>
          <h2 className="mb-2 mt-6 text-lg font-semibold">{t('earnings.breakdown')}</h2>
          {(data.breakdown ?? []).length === 0 ? <p className="text-sm text-text-secondary">{t('earnings.none')}</p> : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-alt text-text-secondary">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-start">{t('earnings.col.order')}</th>
                    <th scope="col" className="px-3 py-2 text-start">{t('earnings.col.date')}</th>
                    <th scope="col" className="px-3 py-2 text-end">{t('earnings.col.fee')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map(d => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono">#{shortId(d.order?.id ?? d.orderId)}</td>
                      <td className="px-3 py-2">{d.deliveredAt ? formatDateTime(d.deliveredAt, lang) : '—'}</td>
                      <td className="px-3 py-2 text-end font-semibold">{formatMoney(d.order?.deliveryFee ?? 0, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
