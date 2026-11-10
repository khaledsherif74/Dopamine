import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorView,
  LoadingView,
  Modal,
  apiErrorMessage,
  formatMoney,
  useI18n,
} from "@dopamine/web-shared";
import {
  useListMyProductsQuery,
  useRemoveProductMutation,
  useUpdateProductMutation,
} from "@/api/endpoints.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import { ProductDialog } from "@/components/ProductDialog.jsx";
import { ProductImage } from "@/components/Media.jsx";

const PAGE_SIZE = 20;

function ProductRow({ product, onEdit, onRemove }) {
  const { t, lang } = useI18n();
  const [update, { isLoading }] = useUpdateProductMutation();
  const [error, setError] = useState("");
  const hidden = product.isAvailable === false;

  async function toggle() {
    setError("");
    const body = new FormData();
    body.append("isAvailable", String(hidden));
    try {
      await update({ id: product.id, body }).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }

  return (
    <li>
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <ProductImage
          src={product.imageUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">
            {product.name}
          </p>
          <p className="text-sm text-text-secondary">
            {formatMoney(product.price, lang)}
            {product.category ? ` · ${product.category}` : ""} ·{" "}
            {t("products.inStock", { count: product.stock })}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge tone={hidden ? "neutral" : "success"}>
              {hidden ? t("products.hidden") : t("products.visible")}
            </Badge>
            {!hidden && product.stock === 0 ? (
              <Badge tone="warning">{t("products.soldOut")}</Badge>
            ) : null}
            {product.requiresAdvanceOrder ? (
              <Badge tone="primary">{t("products.advanceBadge")}</Badge>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="mt-1 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            loading={isLoading}
            onClick={toggle}
          >
            {hidden ? t("products.show") : t("products.hide")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
            {t("common.edit")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(product)}>
            {t("products.remove")}
          </Button>
        </div>
      </Card>
    </li>
  );
}

function Chunk({ page, isLast, onMore, onEdit, onRemove }) {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListMyProductsQuery({
    page,
    limit: PAGE_SIZE,
  });
  if (isLoading) return <LoadingView label={t("common.loading")} />;
  if (isError)
    return (
      <ErrorView
        message={apiErrorMessage(error, t)}
        retryLabel={t("common.retry")}
        onRetry={refetch}
      />
    );
  const products = data?.products ?? [];
  if (page === 1 && products.length === 0)
    return (
      <EmptyState
        title={t("products.emptyTitle")}
        message={t("products.emptyMessage")}
      />
    );
  return (
    <>
      <ul className="space-y-2">
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            onEdit={onEdit}
            onRemove={onRemove}
          />
        ))}
      </ul>
      {isLast && page * PAGE_SIZE < (data?.total ?? 0) ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={onMore}>
            {t("common.loadMore")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function ProductsPage() {
  const { t } = useI18n();
  useDocumentTitle(t("nav.products"));
  const [pages, setPages] = useState(1);
  const [dialog, setDialog] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [remove, { isLoading: removingNow }] = useRemoveProductMutation();
  const [removeError, setRemoveError] = useState("");

  async function confirmRemove() {
    setRemoveError("");
    try {
      await remove(removing.id).unwrap();
      setRemoving(null);
    } catch (err) {
      setRemoveError(apiErrorMessage(err, t));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("nav.products")}</h1>
        <Button onClick={() => setDialog({ product: null })}>
          {t("products.add")}
        </Button>
      </div>
      {Array.from({ length: pages }, (_, i) => (
        <Chunk
          key={i + 1}
          page={i + 1}
          isLast={i + 1 === pages}
          onMore={() => setPages((p) => p + 1)}
          onEdit={(product) => setDialog({ product })}
          onRemove={setRemoving}
        />
      ))}
      {dialog ? (
        <ProductDialog
          key={dialog.product?.id ?? "new"}
          product={dialog.product}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {removing ? (
        <Modal
          open
          onClose={removingNow ? () => {} : () => setRemoving(null)}
          title={t("products.removeTitle")}
          closeLabel={t("common.close")}
        >
          <div className="space-y-3">
            <p className="text-sm text-text-primary">
              {t("products.removeHelp", { name: removing.name })}
            </p>
            {removeError ? <Alert tone="danger">{removeError}</Alert> : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setRemoving(null)}
                disabled={removingNow}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                loading={removingNow}
                onClick={confirmRemove}
              >
                {t("products.remove")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
