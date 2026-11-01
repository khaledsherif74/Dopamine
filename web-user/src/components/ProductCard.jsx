import { Link } from 'react-router-dom';
import { Badge, formatMoney, useI18n } from '@dopamine/web-shared';
import { ProductImage } from './Media.jsx';

export function ProductCard({ product }) {
  const { t, lang } = useI18n();
  const soldOut = product.isAvailable === false || (product.stock !== null && product.stock !== undefined && product.stock <= 0);
  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-md"
    >
      <ProductImage src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-semibold text-text-primary group-hover:text-primary">{product.name}</h3>
        {product.supplier?.shopName ? <p className="line-clamp-1 text-xs text-text-secondary">{product.supplier.shopName}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <span className="font-bold text-primary">{formatMoney(product.price, lang)}</span>
          {soldOut ? <Badge tone="danger">{t('products.outOfStock')}</Badge> : null}
          {product.requiresAdvanceOrder ? <Badge tone="primary">{t('products.preorder')}</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
