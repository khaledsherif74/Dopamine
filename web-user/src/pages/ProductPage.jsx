import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, ErrorView, LoadingView, apiErrorMessage, formatMoney, useI18n } from '@dopamine/web-shared';
import { useGetProductQuery } from '@/api/endpoints.js';
import { useAppDispatch, useAppSelector } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { addItem, MAX_CUSTOMIZATION, MAX_QUANTITY } from '@/features/cart/cartLogic.js';
import { itemAdded } from '@/features/cart/cartSlice.js';
import { ProductImage } from '@/components/Media.jsx';

export function ProductPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cart = useAppSelector(s => s.cart);
  const { data: product, isLoading, isError, error, refetch } = useGetProductQuery(id);
  useDocumentTitle(product?.name ?? '');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) {
    return <ErrorView message={error?.status === 404 ? t('product.notFound') : apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;
  }

  const stock = product.stock ?? null;
  const soldOut = product.isAvailable === false || (stock !== null && stock <= 0);
  const maxQty = stock !== null ? Math.max(1, Math.min(MAX_QUANTITY, stock)) : MAX_QUANTITY;
  const supplier = product.supplier;

  function handleAdd(buyNow = false) {
    const args = { product, supplier, quantity, customization: note };
    const outcome = addItem(cart, args);
    dispatch(itemAdded(args)); // on a conflict the store opens the "start a new cart?" dialog
    setAdded(!outcome.conflict);
    if (buyNow && !outcome.conflict) navigate('/checkout');
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square w-full rounded-3xl" />
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{product.name}</h1>
          {supplier ? (
            <p className="mt-1 text-sm text-text-secondary">
              {t('product.soldBy')} <Link className="font-semibold text-primary hover:underline" to={`/suppliers/${supplier.id}`}>{supplier.shopName}</Link>
            </p>
          ) : null}
        </div>
        <p className="text-2xl font-extrabold text-primary">{formatMoney(product.price, lang)}</p>
        <div className="flex flex-wrap gap-2">
          {product.category ? <Badge>{product.category}</Badge> : null}
          {product.requiresAdvanceOrder ? <Badge tone="primary">{t('products.preorder')}</Badge> : null}
          {soldOut ? <Badge tone="danger">{t('product.outOfStock')}</Badge> : stock !== null && stock <= 5 ? <Badge tone="warning">{t('product.onlyLeft', { count: stock })}</Badge> : null}
        </div>
        {product.description ? (
          <section aria-labelledby="desc-title">
            <h2 id="desc-title" className="sr-only">{t('product.description')}</h2>
            <p className="whitespace-pre-line text-text-secondary">{product.description}</p>
          </section>
        ) : null}
        {product.requiresAdvanceOrder ? <Alert tone="info">{t('product.preorderNotice')}</Alert> : null}
        {supplier && supplier.isOpenNow === false && !product.requiresAdvanceOrder ? <Alert tone="warning">{t('product.shopClosed')}</Alert> : null}

        {!soldOut ? (
          <div className="space-y-4 rounded-2xl border border-border p-4">
            <div>
              <label htmlFor="note" className="mb-1 block text-sm font-medium text-text-primary">{t('product.customization')}</label>
              <textarea id="note" rows={2} maxLength={MAX_CUSTOMIZATION} value={note} onChange={e => setNote(e.target.value)} placeholder={t('product.customizationPlaceholder')} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-text-primary" />
            </div>
            <div className="flex items-center gap-4">
              <div role="group" aria-label={t('product.quantity')} className="inline-flex items-center rounded-xl border border-border">
                <button type="button" aria-label={t('product.decrease')} disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-lg disabled:text-disabled">−</button>
                <span aria-live="polite" className="min-w-8 text-center font-semibold">{quantity}</span>
                <button type="button" aria-label={t('product.increase')} disabled={quantity >= maxQty} onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} className="px-3 py-2 text-lg disabled:text-disabled">+</button>
              </div>
              <Button className="flex-1" onClick={() => handleAdd(false)}>{t('product.addToCart')} · {formatMoney(product.price * quantity, lang)}</Button>
              <Button variant="outline" onClick={() => handleAdd(true)}>{t('product.buyNow')}</Button>
            </div>
            {added ? (
              <Alert tone="success">
                {t('product.added')} · <Link className="font-semibold underline" to="/cart">{t('product.viewCart')}</Link>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
