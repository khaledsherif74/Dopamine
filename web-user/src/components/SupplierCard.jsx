import { Link } from 'react-router-dom';
import { Badge, RatingStars, formatClock, useI18n } from '@dopamine/web-shared';
import { ShopAvatar } from './Media.jsx';

export function SupplierCard({ supplier }) {
  const { t, lang } = useI18n();
  const open = supplier.isOpenNow && supplier.isAcceptingOrders !== false;
  return (
    <Link to={`/suppliers/${supplier.id}`} className="flex gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:shadow-md">
      <ShopAvatar name={supplier.shopName} size={56} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-text-primary">{supplier.shopName}</h3>
          <Badge tone={open ? 'success' : 'neutral'}>{open ? t('suppliers.open') : t('suppliers.closed')}</Badge>
        </div>
        <div className="mt-1 text-sm text-text-secondary">
          {supplier.averageRating ? (
            <RatingStars value={supplier.averageRating} count={supplier.reviewCount} label={t('suppliers.rating')} size={14} />
          ) : (
            <span>{t('suppliers.noReviews')}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          {supplier.opensAt && supplier.closesAt ? `${formatClock(supplier.opensAt, lang)} – ${formatClock(supplier.closesAt, lang)}` : null}
          {supplier.distanceKm != null ? ` · ${t('suppliers.km', { distance: supplier.distanceKm.toFixed(1) })}` : null}
        </p>
      </div>
    </Link>
  );
}
