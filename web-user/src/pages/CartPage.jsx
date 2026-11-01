import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, EmptyState, formatMoney, useI18n } from '@dopamine/web-shared';
import { useAppDispatch, useAppSelector } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { cartCount, cartSubtotal, hasPreorderItems, MAX_CUSTOMIZATION, stockProblems } from '@/features/cart/cartLogic.js';
import { cartCleared, customizationChanged, itemRemoved, quantityChanged } from '@/features/cart/cartSlice.js';
import { ProductImage } from '@/components/Media.jsx';

function CartLine({ item }) {
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.customization);
  const maxQty = item.stock !== null ? Math.max(1, item.stock) : 99;

  return (
    <li className="flex gap-3 py-4">
      <Link to={`/products/${item.productId}`} tabIndex={-1} aria-hidden="true">
        <ProductImage src={item.imageUrl} className="h-20 w-20 rounded-xl" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/products/${item.productId}`} className="font-semibold text-text-primary hover:text-primary">{item.name}</Link>
          <span className="font-bold text-text-primary">{formatMoney(item.price * item.quantity, lang)}</span>
        </div>
        <p className="text-sm text-text-secondary">{formatMoney(item.price, lang)}</p>

        {editing ? (
          <div className="mt-2 space-y-2">
            <label htmlFor={`note-${item.key}`} className="sr-only">{t('cart.noteLabel')}</label>
            <textarea id={`note-${item.key}`} rows={2} maxLength={MAX_CUSTOMIZATION} value={draft} onChange={e => setDraft(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { dispatch(customizationChanged({ key: item.key, customization: draft })); setEditing(false); }}>{t('cart.saveNote')}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraft(item.customization); setEditing(false); }}>{t('common.cancel')}</Button>
            </div>
          </div>
        ) : item.customization ? (
          <p className="mt-1 text-sm italic text-text-secondary">“{item.customization}”</p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t('cart.quantityFor', { name: item.name })} className="inline-flex items-center rounded-xl border border-border">
            <button type="button" aria-label={t('product.decrease')} onClick={() => dispatch(quantityChanged({ key: item.key, quantity: item.quantity - 1 }))} className="px-3 py-1 text-lg">−</button>
            <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
            <button type="button" aria-label={t('product.increase')} disabled={item.quantity >= maxQty} onClick={() => dispatch(quantityChanged({ key: item.key, quantity: item.quantity + 1 }))} className="px-3 py-1 text-lg disabled:text-disabled">+</button>
          </div>
          {!editing ? <button type="button" onClick={() => setEditing(true)} className="text-sm text-primary hover:underline">{t('cart.editNote')}</button> : null}
          <button type="button" onClick={() => dispatch(itemRemoved(item.key))} className="text-sm text-danger hover:underline">{t('cart.remove')}</button>
        </div>
      </div>
    </li>
  );
}

export function CartPage() {
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(s => s.cart);
  useDocumentTitle(t('cart.title'));

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title={t('cart.empty')}
        message={t('cart.emptyHint')}
        action={<Link to="/products" className="inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold text-text-inverse">{t('cart.browse')}</Link>}
      />
    );
  }

  const problems = stockProblems(cart);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="cart-title">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 id="cart-title" className="text-2xl font-bold text-text-primary">{t('cart.title')}</h1>
            <p className="text-sm text-text-secondary">{t('cart.from', { shop: cart.supplierName ?? '' })}</p>
          </div>
          <button type="button" onClick={() => dispatch(cartCleared())} className="text-sm text-danger hover:underline">{t('cart.clear')}</button>
        </div>
        {problems.map(key => {
          const item = cart.items.find(i => i.key === key);
          return <Alert key={key} tone="warning" className="mb-2">{t('cart.stockWarning', { count: item.stock, name: item.name })}</Alert>;
        })}
        <ul className="divide-y divide-border">
          {cart.items.map(item => <CartLine key={item.key} item={item} />)}
        </ul>
      </section>

      <aside>
        <Card className="space-y-3 lg:sticky lg:top-24">
          <div className="flex items-center justify-between text-text-primary">
            <span>{t('cart.subtotal')} ({cartCount(cart)})</span>
            <span className="text-lg font-bold">{formatMoney(cartSubtotal(cart), lang)}</span>
          </div>
          <p className="text-xs text-text-secondary">{t('cart.note')}</p>
          {hasPreorderItems(cart) ? <Alert tone="info">{t('cart.preorderNote')}</Alert> : null}
          <Link to="/checkout" className={`block rounded-xl px-4 py-3 text-center font-semibold ${problems.length ? 'pointer-events-none bg-disabled text-text-secondary' : 'bg-primary text-text-inverse'}`} aria-disabled={problems.length > 0}>
            {t('cart.checkout')}
          </Link>
        </Card>
      </aside>
    </div>
  );
}
