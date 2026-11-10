import { useState } from 'react';
import { Alert, Button, Card, Checkbox, ErrorView, LoadingView, TextField, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useGetShopQuery, useUpdateShopMutation } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { shopFormFrom, validateShop } from '@/features/shop/shopForm.js';

function ShopForm({ shop }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => shopFormFrom(shop));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tone: '', text: '' });
  const [update, { isLoading }] = useUpdateShopMutation();
  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setMessage({ tone: '', text: '' });
    const result = validateShop(form, shop);
    setErrors(result.errors);
    if (!result.ok) return;
    if (Object.keys(result.body).length === 0) {
      setMessage({ tone: 'info', text: t('shop.nothingChanged') });
      return;
    }
    try {
      const saved = await update(result.body).unwrap();
      setForm(shopFormFrom(saved));
      setMessage({ tone: 'success', text: t('shop.saved') });
    } catch (err) {
      setMessage({ tone: 'danger', text: apiErrorMessage(err, t) });
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {message.text ? <Alert tone={message.tone} role="status">{message.text}</Alert> : null}
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">{t('shop.details')}</h2>
        <TextField label={t('shop.name')} value={form.shopName} maxLength={120} error={errors.shopName && t(errors.shopName)} onChange={set('shopName')} />
        <TextField label={t('shop.phone')} type="tel" dir="ltr" hint={t('shop.phoneHint')} value={form.phone} error={errors.phone && t(errors.phone)} onChange={set('phone')} />
        <TextField label={t('shop.address')} value={form.address} maxLength={255} error={errors.address && t(errors.address)} hint={shop.address ? t('shop.cannotClear') : undefined} onChange={set('address')} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('shop.lat')} inputMode="decimal" dir="ltr" value={form.lat} error={errors.lat && t(errors.lat)} onChange={set('lat')} />
          <TextField label={t('shop.lng')} inputMode="decimal" dir="ltr" value={form.lng} error={errors.lng && t(errors.lng)} onChange={set('lng')} />
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">{t('shop.ordering')}</h2>
        <Checkbox label={t('shop.acceptingLabel')} checked={form.isAcceptingOrders} onChange={e => setForm(f => ({ ...f, isAcceptingOrders: e.target.checked }))} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t('shop.opensAt')} type="time" dir="ltr" value={form.opensAt} onChange={set('opensAt')} />
          <TextField label={t('shop.closesAt')} type="time" dir="ltr" value={form.closesAt} onChange={set('closesAt')} />
        </div>
        <p className="text-xs text-text-secondary">{t('shop.hoursHint')}</p>
        {errors.hours ? <p role="alert" className="text-sm text-danger">{t(errors.hours)}</p> : null}
      </Card>
      <Button type="submit" loading={isLoading}>{t('common.save')}</Button>
    </form>
  );
}

export function ShopPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.shop'));
  const { data: shop, isLoading, isError, error, refetch } = useGetShopQuery();
  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.shop')}</h1>
      <p className="text-sm text-text-secondary">{t('shop.statusLine', { status: t(`shop.status.${shop.status}`), commission: Math.round((shop.commissionRate ?? 0) * 100) })}</p>
      <ShopForm key={shop.updatedAt ?? 'form'} shop={shop} />
    </div>
  );
}
