import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  apiErrorMessage,
  useDebounce,
  useI18n,
} from "@dopamine/web-shared";
import { useListProductsQuery } from "@/api/endpoints.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import {
  applyFilters,
  countActiveFilters,
  extractCategories,
  filtersFromParams,
  filtersToParams,
} from "@/features/browse/filters.js";
import { FilterModal } from "@/components/FilterModal.jsx";
import { ProductCard } from "@/components/ProductCard.jsx";

export function ProductsPage() {
  const { t } = useI18n();
  useDocumentTitle(t("nav.products"));
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const [open, setOpen] = useState(false);
  const [draftQ, setDraftQ] = useState(q);
  const debouncedQ = useDebounce(draftQ.trim(), 400);

  const { data, isLoading, isError, error, refetch } = useListProductsQuery({
    ...(q ? { search: q } : {}),
    limit: 100,
  });
  const all = data?.products ?? [];
  const categories = useMemo(() => extractCategories(all), [all]);
  const shown = useMemo(() => applyFilters(all, filters), [all, filters]);
  const active = countActiveFilters(filters);

  useEffect(() => {
    if (debouncedQ === q) return;
    const next = filtersToParams(filters);
    if (debouncedQ) next.set("q", debouncedQ);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const update = (nextFilters, nextQ = q) => {
    const next = filtersToParams(nextFilters);
    if (nextQ) next.set("q", nextQ);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="me-auto text-2xl font-bold text-text-primary">
          {t("products.title")}
        </h1>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update(filters, draftQ.trim());
          }}
        >
          <label htmlFor="products-q" className="sr-only">
            {t("nav.searchLabel")}
          </label>
          <input
            id="products-q"
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={t("nav.searchPlaceholder")}
            className="w-48 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-primary sm:w-64"
          />
          <Button type="submit" size="sm" className="rounded-full">
            {t("common.search")}
          </Button>
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          {active
            ? t("products.activeFilters", { count: active })
            : t("products.filters")}
        </Button>
      </div>

      {isLoading ? (
        <LoadingView label={t("common.loading")} />
      ) : isError ? (
        <ErrorView
          message={apiErrorMessage(error, t)}
          retryLabel={t("common.retry")}
          onRetry={refetch}
        />
      ) : shown.length === 0 ? (
        <EmptyState
          title={t("products.noResults")}
          message={t("products.noResultsHint")}
          action={
            active || q ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDraftQ("");
                  setParams({}, { replace: true });
                }}
              >
                {t("products.resetFilters")}
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-text-secondary" aria-live="polite">
            {t("products.results", { count: shown.length })}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      <FilterModal
        open={open}
        onClose={() => setOpen(false)}
        filters={filters}
        categories={categories}
        onApply={(f) => update(f)}
      />
    </div>
  );
}
