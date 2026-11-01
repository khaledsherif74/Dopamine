import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, EmptyState, ErrorView, LoadingView, TextField, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import {
  useAddAddressMutation, useCreateOrderMutation, useGetPublicSettingsQuery, useGetSupplierQuery,
  useInitiatePaymentMutation, useListAddressesQuery, useValidatePromoMutation,
} from '@/api/endpoints.js';
import { useAppDispatch, useAppSelector } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { cartSubtotal, hasPreorderItems, stockProblems, toOrderItems } from '@/features/cart/cartLogic.js';
import { cartCleared } from '@/features/cart/cartSlice.js';
import { computeTotals } from '@/features/checkout/totals.js';
import { MIN_LEAD_MINUTES, minScheduleDate, parseScheduleInput, toLocalInputValue } from '@/features/checkout/schedule.js';
import { fingerprint, nextAttempt, withOrder } from '@/features/checkout/attempt.js';
import { isSafePaymentRedirect } from '@/features/checkout/redirect.js';
import { AddressForm } from '@/components/AddressForm.jsx';

const METHODS = [
  { id: 'CASH', label: 'checkout.cash', hint: 'checkout.cashHint' },
  { id: 'CARD', label: 'checkout.card', hint: 'checkout.cardHint' },
  { id: 'WALLET', label: 'checkout.wallet', hint: 'checkout.walletHint' },
];

export function CheckoutPage() {
  const { t, lang } = useI18n();
  useDocumentTitle(t('checkout.title'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cart = useAppSelector(s => s.cart);
  const savedLocation = useAppSelector(s => s.location);

  const settings = useGetPublicSettingsQuery();
  const addressesQ = useListAddressesQuery();
  const supplierQ = useGetSupplierQuery(cart.supplierId, { skip: !cart.supplierId });
  const [addAddress] = useAddAddressMutation();
  const [validatePromo, { isLoading: validating }] = useValidatePromoMutation();
  const [createOrder] = useCreateOrderMutation();
  const [initiatePayment] = useInitiatePaymentMutation();

  const [pickedAddress, setPickedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [scheduled, setScheduled] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null); // { code, discount, description, forSubtotal }
  const [promoError, setPromoError] = useState('');
  const [method, setMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const attemptRef = useRef(null);

  const addresses = addressesQ.data ?? [];
  const addressId = useMemo(() => {
    if (pickedAddress && addresses.some(a => a.id === pickedAddress)) return pickedAddress;
    return addresses.find(a => a.id === savedLocation.addressId)?.id ?? addresses.find(a => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  }, [pickedAddress, addresses, savedLocation.addressId]);

  const subtotal = cartSubtotal(cart);
  const preorder = hasPreorderItems(cart);
  // a promo only counts while the cart still has the subtotal it was validated for
  const activePromo = promo && promo.forSubtotal === subtotal ? promo : null;
  const totals = computeTotals({
    subtotal,
    discount: activePromo?.discount ?? 0,
    deliveryFee: settings.data?.deliveryFee ?? 0,
    minOrderAmount: settings.data?.minOrderAmount ?? 0,
  });

  if (cart.items.length === 0) {
    return <EmptyState title={t('checkout.emptyCart')} action={<Link to="/products" className="font-semibold text-primary">{t('cart.browse')}</Link>} />;
  }
  if (settings.isLoading || addressesQ.isLoading) return <LoadingView label={t('common.loading')} />;
  if (settings.isError) return <ErrorView message={apiErrorMessage(settings.error, t)} retryLabel={t('common.retry')} onRetry={settings.refetch} />;
  if (addressesQ.isError) return <ErrorView message={apiErrorMessage(addressesQ.error, t)} retryLabel={t('common.retry')} onRetry={addressesQ.refetch} />;

  async function applyPromo() {
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (code.length < 3) return;
    try {
      const out = await validatePromo({ code, supplierId: cart.supplierId, subtotal }).unwrap();
      if (out.valid) setPromo({ code, discount: out.discount, description: out.description, forSubtotal: subtotal });
      else {
        const key = `checkout.promoReasons.${out.reason}`;
        setPromoError(t('checkout.promoInvalid', { reason: t(key) === key ? String(out.reason ?? '') : t(key) }));
      }
    } catch (err) {
      setPromoError(apiErrorMessage(err, t));
    }
  }

  async function placeOrder() {
    setProblem('');
    const errs = {};
    if (!addressId) errs.address = t('checkout.noAddress');
    let scheduledFor = null;
    if (preorder) {
      const parsed = parseScheduleInput(scheduled, new Date());
      if (!parsed.ok) errs.schedule = t(`checkout.scheduleErrors.${parsed.error}`);
      else scheduledFor = parsed.iso;
    }
    if (totals.belowMinimum) errs.minimum = true;
    if (stockProblems(cart).length) errs.stock = true;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    // same purchase -> same Idempotency-Keys (and the already-created order): retries are safe
    const fp = fingerprint({ cart, addressId, scheduledFor, promoCode: activePromo?.code, method });
    attemptRef.current = nextAttempt(attemptRef.current, fp);
    const attempt = attemptRef.current;

    setSubmitting(true);
    let orderId = attempt.orderId;
    try {
      if (!orderId) {
        const order = await createOrder({
          key: attempt.orderKey,
          supplierId: cart.supplierId,
          addressId,
          items: toOrderItems(cart),
          ...(scheduledFor ? { scheduledFor } : {}),
          ...(activePromo ? { promoCode: activePromo.code } : {}),
        }).unwrap();
        orderId = order.id;
        attemptRef.current = withOrder(attempt, orderId);
      }
    } catch (err) {
      setProblem(apiErrorMessage(err, t));
      setSubmitting(false);
      return;
    }

    // the order exists server-side now: the cart has done its job
    dispatch(cartCleared());
    try {
      const pay = await initiatePayment({ orderId, key: attempt.payKey, method, returnOrigin: window.location.origin }).unwrap();
      if (pay.redirectUrl) {
        if (!isSafePaymentRedirect(pay.redirectUrl)) throw new Error('unsafe payment redirect');
        window.location.assign(pay.redirectUrl); // leave for the payment partner
        return;
      }
      navigate(`/orders/${orderId}`, { replace: true, state: { placed: true } });
    } catch {
      navigate(`/orders/${orderId}`, { replace: true, state: { paymentFailed: true } });
    }
  }

  const supplierClosed = supplierQ.data && supplierQ.data.isOpenNow === false && !cart.items.every(i => i.requiresAdvanceOrder);
  const minLead = toLocalInputValue(minScheduleDate(new Date(), MIN_LEAD_MINUTES));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">{t('checkout.title')}</h1>
        {supplierClosed ? <Alert tone="warning">{t('checkout.shopClosed')}</Alert> : null}

        <Card>
          <h2 className="mb-3 text-lg font-bold text-text-primary">{t('checkout.deliverTo')}</h2>
          {addresses.length === 0 && !showAddressForm ? <p className="mb-2 text-sm text-text-secondary">{t('checkout.noAddress')}</p> : null}
          <ul className="space-y-2">
            {addresses.map(a => (
              <li key={a.id}>
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${addressId === a.id ? 'border-primary bg-primary-tint' : 'border-border'}`}>
                  <input type="radio" name="address" className="mt-1 accent-[var(--c-primary)]" checked={addressId === a.id} onChange={() => setPickedAddress(a.id)} />
                  <span><span className="block font-semibold text-text-primary">{a.label}</span><span className="text-sm text-text-secondary">{a.line1}, {a.city}</span></span>
                </label>
              </li>
            ))}
          </ul>
          {fieldErrors.address ? <p role="alert" className="mt-2 text-sm text-danger">{fieldErrors.address}</p> : null}
          {showAddressForm ? (
            <div className="mt-3">
              <AddressForm
                submitLabel={t('location.save')}
                onCancel={() => setShowAddressForm(false)}
                onSubmit={async values => {
                  const created = await addAddress({ ...values, isDefault: addresses.length === 0 }).unwrap();
                  setPickedAddress(created.id);
                  setShowAddressForm(false);
                }}
              />
            </div>
          ) : (
            <Button variant="ghost" className="mt-2" onClick={() => setShowAddressForm(true)}>+ {t('checkout.addAddress')}</Button>
          )}
        </Card>

        {preorder ? (
          <Card>
            <h2 className="mb-1 text-lg font-bold text-text-primary">{t('checkout.schedule')}</h2>
            <p className="mb-3 text-sm text-text-secondary">{t('checkout.scheduleHint')}</p>
            <TextField label={t('checkout.schedule')} type="datetime-local" min={minLead} value={scheduled} dir="ltr" error={fieldErrors.schedule} onChange={e => setScheduled(e.target.value)} />
          </Card>
        ) : null}

        <Card>
          <h2 className="mb-3 text-lg font-bold text-text-primary">{t('checkout.promo')}</h2>
          {activePromo ? (
            <div className="flex items-center justify-between gap-3">
              <Alert tone="success" className="flex-1">{t('checkout.promoApplied', { amount: formatMoney(activePromo.discount, lang) })} · <strong>{activePromo.code}</strong></Alert>
              <Button variant="ghost" size="sm" onClick={() => { setPromo(null); setPromoInput(''); }}>{t('checkout.removePromo')}</Button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex-1"><TextField label={t('checkout.promo')} value={promoInput} placeholder={t('checkout.promoPlaceholder')} autoCapitalize="characters" maxLength={30} onChange={e => setPromoInput(e.target.value)} /></div>
                <Button variant="outline" className="mt-6" loading={validating} onClick={applyPromo}>{t('checkout.applyPromo')}</Button>
              </div>
              {promoError ? <p role="alert" className="mt-2 text-sm text-danger">{promoError}</p> : null}
            </>
          )}
        </Card>

        <Card>
          <fieldset>
            <legend className="mb-3 text-lg font-bold text-text-primary">{t('checkout.payment')}</legend>
            <div className="space-y-2">
              {METHODS.map(m => (
                <label key={m.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${method === m.id ? 'border-primary bg-primary-tint' : 'border-border'}`}>
                  <input type="radio" name="method" className="mt-1 accent-[var(--c-primary)]" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <span><span className="block font-semibold text-text-primary">{t(m.label)}</span><span className="text-sm text-text-secondary">{t(m.hint)}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      </div>

      <aside>
        <Card className="space-y-3 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-text-primary">{t('checkout.summary')}</h2>
          <p className="text-sm text-text-secondary">{t('cart.from', { shop: cart.supplierName ?? '' })}</p>
          <dl className="space-y-1 text-sm text-text-primary">
            <div className="flex justify-between"><dt>{t('checkout.subtotal')}</dt><dd>{formatMoney(totals.subtotal, lang)}</dd></div>
            {totals.discount > 0 ? <div className="flex justify-between text-success"><dt>{t('checkout.discount')}</dt><dd>−{formatMoney(totals.discount, lang)}</dd></div> : null}
            <div className="flex justify-between"><dt>{t('checkout.deliveryFee')}</dt><dd>{formatMoney(totals.deliveryFee, lang)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>{t('checkout.total')}</dt><dd>{formatMoney(totals.total, lang)}</dd></div>
          </dl>
          {totals.belowMinimum ? <Alert tone="warning">{t('checkout.belowMinimum', { min: formatMoney(settings.data.minOrderAmount, lang), shortfall: formatMoney(totals.shortfall, lang) })}</Alert> : null}
          {fieldErrors.stock ? <Alert tone="warning">{t('checkout.stockIssue')} <Link to="/cart" className="font-semibold underline">{t('nav.cart')}</Link></Alert> : null}
          {problem ? <Alert tone="danger">{problem}</Alert> : null}
          <Button className="w-full" size="lg" loading={submitting} disabled={totals.belowMinimum} onClick={placeOrder}>{submitting ? t('checkout.placing') : `${t('checkout.placeOrder')} · ${formatMoney(totals.total, lang)}`}</Button>
          <p className="text-xs text-text-secondary">{t('checkout.note')}</p>
        </Card>
      </aside>
    </div>
  );
}
