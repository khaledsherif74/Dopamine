import { useI18n } from '@dopamine/web-shared';
import { TIMELINE, isFailed, stepIndex } from '@/features/orders/status.js';

export function OrderTimeline({ status }) {
  const { t } = useI18n();
  if (isFailed(status)) {
    return <p role="status" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">{t(`orderStatus.${status}`)}</p>;
  }
  const current = stepIndex(status);
  return (
    <ol aria-label={t('orders.timeline')} className="flex flex-wrap gap-x-1 gap-y-2">
      {TIMELINE.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} aria-current={i === current ? 'step' : undefined} className="flex items-center gap-1 text-xs">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-primary text-text-inverse' : 'bg-disabled text-text-secondary'}`} aria-hidden="true">{done ? '✓' : i + 1}</span>
            <span className={i === current ? 'font-bold text-primary' : done ? 'text-text-primary' : 'text-text-secondary'}>{t(`orderStatus.${step}`)}</span>
            {i < TIMELINE.length - 1 ? <span className="mx-1 h-px w-3 bg-border" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
