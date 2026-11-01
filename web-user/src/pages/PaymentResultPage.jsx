import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, LoadingView, Card, useI18n } from '@dopamine/web-shared';
import { endpoints } from '@/api/endpoints.js';
import { useAppDispatch } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { pollUntil } from '@/lib/poll.js';
import { paymentOutcome } from '@/features/orders/status.js';

// Paymob sends the customer back here with a pile of query parameters. NONE of them is trusted:
// only the order id is used, and the real outcome comes from our own server (the Paymob webhook).
export function PaymentResultPage() {
  const { t } = useI18n();
  useDocumentTitle(t('payment.title'));
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [state, setState] = useState({ phase: 'checking', run: 0 });

  useEffect(() => {
    if (!orderId) return undefined;
    const controller = new AbortController();
    pollUntil(
      async () => {
        const sub = dispatch(endpoints.endpoints.getPayment.initiate(orderId, { forceRefetch: true }));
        try {
          return await sub.unwrap();
        } finally {
          sub.unsubscribe();
        }
      },
      { isDone: p => paymentOutcome(p) !== 'pending' && !p?.error, intervalMs: 2500, maxMs: 40000, signal: controller.signal },
    ).then(result => {
      if (result.aborted) return;
      const outcome = result.done ? paymentOutcome(result.value) : 'pending';
      setState(s => ({ ...s, phase: outcome === 'cash' ? 'paid' : outcome === 'unknown' ? 'pending' : outcome }));
    });
    return () => controller.abort();
  }, [orderId, dispatch, state.run]);

  if (!orderId) {
    return <Card className="mx-auto max-w-md text-center"><Alert tone="warning">{t('payment.missingOrder')}</Alert><Link to="/orders" className="mt-4 inline-block font-semibold text-primary">{t('nav2.orders')}</Link></Card>;
  }
  if (state.phase === 'checking') return <LoadingView label={t('payment.checking')} />;

  const view = {
    paid: { tone: 'success', title: t('payment.paid'), body: t('payment.paidBody') },
    failed: { tone: 'danger', title: t('payment.failed'), body: t('payment.failedBody') },
    pending: { tone: 'warning', title: t('payment.pending'), body: t('payment.pendingBody') },
  }[state.phase] ?? { tone: 'warning', title: t('payment.pending'), body: t('payment.pendingBody') };

  return (
    <Card className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-bold text-text-primary">{view.title}</h1>
      <Alert tone={view.tone}>{view.body}</Alert>
      <div className="flex flex-col gap-2">
        <Button onClick={() => navigate(`/orders/${orderId}`, { replace: true })}>{state.phase === 'failed' ? t('payment.tryAgain') : t('payment.viewOrder')}</Button>
        {state.phase === 'pending' ? <Button variant="outline" onClick={() => setState({ phase: 'checking', run: state.run + 1 })}>{t('payment.refresh')}</Button> : null}
      </div>
    </Card>
  );
}
