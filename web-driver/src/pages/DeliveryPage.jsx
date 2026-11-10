import { Link, useParams } from 'react-router-dom';
import { Card, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useListAssignedQuery } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { shortId } from '@/lib/ids.js';
import { JobCard } from '@/components/JobCard.jsx';
import { OrderChat } from '@/components/OrderChat.jsx';

// There is no "get one delivery" endpoint: the active deliveries list is the source. A delivery that is
// no longer in it (delivered, cancelled or reassigned) is shown as finished.
export function DeliveryPage() {
  const { t } = useI18n();
  const { deliveryId } = useParams();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useListAssignedQuery(undefined, { pollingInterval: 20000 });
  const delivery = data?.find(d => d.id === deliveryId);
  useDocumentTitle(delivery ? t('jobs.title', { id: shortId(delivery.order.id) }) : t('nav.jobs'));

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <Link to="/?tab=mine" className="text-sm font-semibold text-primary"><span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {t('jobs.tab.mine')}</Link>
      {!delivery ? (
        <EmptyState title={t('jobs.finishedTitle')} message={t('jobs.finishedMessage')} />
      ) : (
        <>
          <ul><JobCard delivery={delivery} kind="mine" /></ul>
          <Card className="space-y-2 p-4">
            <h2 className="text-sm font-semibold text-text-secondary">{t('jobs.chatTitle')}</h2>
            <OrderChat orderId={delivery.order.id} channel="DRIVER" myId={user.id} />
          </Card>
        </>
      )}
    </div>
  );
}
