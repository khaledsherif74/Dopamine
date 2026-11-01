import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useListProductsQuery, useListSuppliersQuery } from '@/api/endpoints.js';
import { useAppSelector } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { extractCategories } from '@/features/browse/filters.js';
import { ProductCard } from '@/components/ProductCard.jsx';
import { SupplierCard } from '@/components/SupplierCard.jsx';

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  useDocumentTitle('');
  const { lat, lng } = useAppSelector(s => s.location);
  const [q, setQ] = useState('');
  const suppliers = useListSuppliersQuery(lat != null ? { lat, lng } : undefined);
  const products = useListProductsQuery({ limit: 12 });
  const productList = products.data?.products ?? [];
  const categories = extractCategories(productList);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-primary-tint px-6 py-10 text-center sm:py-14">
        <h1 className="text-3xl font-extrabold text-primary sm:text-4xl">{t('home.heroTitle')}</h1>
        <p className="mx-auto mt-2 max-w-xl text-text-secondary">{t('home.heroSubtitle')}</p>
        <form
          role="search"
          className="mx-auto mt-6 flex max-w-lg gap-2"
          onSubmit={e => {
            e.preventDefault();
            navigate(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
          }}
        >
          <label htmlFor="hero-search" className="sr-only">{t('nav.searchLabel')}</label>
          <input id="hero-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('nav.searchPlaceholder')} className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-text-primary" />
          <Button type="submit" className="rounded-full">{t('common.search')}</Button>
        </form>
      </section>

      {categories.length ? (
        <section aria-labelledby="cat-title">
          <h2 id="cat-title" className="mb-3 text-xl font-bold text-text-primary">{t('home.categories')}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <Link key={c} to={`/products?cat=${encodeURIComponent(c)}`} className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-primary hover:border-primary hover:text-primary">{c}</Link>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="near-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="near-title" className="text-xl font-bold text-text-primary">{t('home.nearYou')}</h2>
          <Link to="/suppliers" className="text-sm font-semibold text-primary">{t('common.viewAll')}</Link>
        </div>
        {suppliers.isLoading ? (
          <LoadingView label={t('common.loading')} />
        ) : suppliers.isError ? (
          <ErrorView message={apiErrorMessage(suppliers.error, t)} retryLabel={t('common.retry')} onRetry={suppliers.refetch} />
        ) : !suppliers.data?.length ? (
          <EmptyState title={t('home.noShops')} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.data.slice(0, 6).map(s => <SupplierCard key={s.id} supplier={s} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="popular-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="popular-title" className="text-xl font-bold text-text-primary">{t('home.popular')}</h2>
          <Link to="/products" className="text-sm font-semibold text-primary">{t('common.viewAll')}</Link>
        </div>
        {products.isLoading ? (
          <LoadingView label={t('common.loading')} />
        ) : products.isError ? (
          <ErrorView message={apiErrorMessage(products.error, t)} retryLabel={t('common.retry')} onRetry={products.refetch} />
        ) : !productList.length ? (
          <EmptyState title={t('home.noProducts')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {productList.slice(0, 8).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
