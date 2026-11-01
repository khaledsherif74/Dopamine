import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Badge, ErrorView, LoadingView, apiErrorMessage, formatClock, useI18n } from '@dopamine/web-shared';
import { useGetSupplierQuery } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { extractCategories } from '@/features/browse/filters.js';
import { ProductCard } from '@/components/ProductCard.jsx';
import { ShopAvatar } from '@/components/Media.jsx';

export function SupplierPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { data: supplier, isLoading, isError, error, refetch } = useGetSupplierQuery(id);
  useDocumentTitle(supplier?.shopName ?? '');
  const [category, setCategory] = useState('');

  const products = useMemo(
    () => (supplier?.products ?? []).map(p => ({ ...p, supplier: { id: supplier.id, shopName: supplier.shopName } })),
    [supplier],
  );
  const categories = useMemo(() => extractCategories(products), [products]);
  const shown = category ? products.filter(p => String(p.category ?? '').toLowerCase() === category.toLowerCase()) : products;

  if (isLoading) return <LoadingView label={t('common.loading')} />;
  if (isError) return <ErrorView message={apiErrorMessage(error, t)} retryLabel={t('common.retry')} onRetry={refetch} />;

  const open = supplier.isOpenNow && supplier.isAcceptingOrders !== false;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <ShopAvatar name={supplier.shopName} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-text-primary">{supplier.shopName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <Badge tone={open ? 'success' : 'neutral'}>{open ? t('suppliers.open') : t('suppliers.closed')}</Badge>
            {supplier.opensAt && supplier.closesAt ? <span>{t('suppliers.hours')}: {formatClock(supplier.opensAt, lang)} – {formatClock(supplier.closesAt, lang)}</span> : null}
          </div>
          {supplier.address ? <p className="mt-1 text-sm text-text-secondary">{t('suppliers.address')}: {supplier.address}</p> : null}
        </div>
      </header>

      {supplier.isAcceptingOrders === false ? <Alert tone="warning">{t('suppliers.notAccepting')}</Alert> : !open ? <Alert tone="info">{t('suppliers.closedBanner')}</Alert> : null}

      <section aria-labelledby="menu-title">
        <h2 id="menu-title" className="mb-3 text-xl font-bold text-text-primary">{t('suppliers.menu')}</h2>
        {categories.length > 1 ? (
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('filters.categories')}>
            {['', ...categories].map(c => (
              <button key={c || 'all'} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1 text-sm ${category === c ? 'border-primary bg-primary text-text-inverse' : 'border-border text-text-primary hover:bg-surface-alt'}`}>
                {c || t('suppliers.allCategories')}
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {shown.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
