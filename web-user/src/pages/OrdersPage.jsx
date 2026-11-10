import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  EmptyState,
  ErrorView,
  LoadingView,
  apiErrorMessage,
  formatDate,
  formatMoney,
  useI18n,
} from "@dopamine/web-shared";
import { useListMyOrdersQuery } from "@/api/endpoints.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";
import {
  matchesFilter,
  shortId,
  statusTone,
} from "@/features/orders/status.js";

const PAGE_SIZE = 10;

function OrderCard({ order }) {
  const { t, lang } = useI18n();
  const unread =
    (order.chatUnread?.SUPPLIER ?? 0) + (order.chatUnread?.DRIVER ?? 0);
  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="block rounded-2xl border border-border bg-surface p-4 transition hover:shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-text-primary">
            {t("orders.orderNumber", { id: shortId(order.id) })}
          </span>
          <span className="flex items-center gap-2">
            {unread > 0 ? (
              <Badge tone="primary">
                {t("orders.unread")} · {unread}
              </Badge>
            ) : null}
            <Badge tone={statusTone(order.status)}>
              {t(`orderStatus.${order.status}`)}
            </Badge>
          </span>
        </div>
        {order.supplier?.shopName ? (
          <p className="mt-1 text-sm text-text-secondary">
            {t("orders.from", { shop: order.supplier.shopName })}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-text-secondary">
          <span>
            {formatDate(order.createdAt, lang)} ·{" "}
            {t("orders.itemsCount", { count: order.items?.length ?? 0 })}
          </span>
          <span className="font-bold text-text-primary">
            {formatMoney(order.total, lang)}
          </span>
        </div>
      </Link>
    </li>
  );
}

function OrdersChunk({ page, filter, isLast, onMore, onEmptyFirst }) {
  const { t } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListMyOrdersQuery({
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
  const orders = (data?.orders ?? []).filter((o) => matchesFilter(o, filter));
  const hasMore = data.page * data.limit < data.total;
  if (page === 1 && data.total === 0) return onEmptyFirst;
  return (
    <>
      <ul className="space-y-3">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </ul>
      {isLast && hasMore ? (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={onMore}>
            {t("orders.loadMore")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function OrdersPage() {
  const { t } = useI18n();
  useDocumentTitle(t("orders.title"));
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState("all");
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("orders.title")}
        </h1>
        <div
          role="group"
          aria-label={t("orders.title")}
          className="inline-flex rounded-full border border-border p-0.5"
        >
          {["all", "active", "delivered", "cancelled"].map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-primary text-text-inverse" : "text-text-primary"}`}
            >
              {t(
                f === "delivered"
                  ? "orders.delivered"
                  : f === "cancelled"
                    ? "orders.tabCancelled"
                    : `orders.${f}`,
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: pages }, (_, i) => (
          <OrdersChunk
            key={i + 1}
            page={i + 1}
            filter={filter}
            isLast={i + 1 === pages}
            onMore={() => setPages((p) => p + 1)}
            onEmptyFirst={
              <EmptyState
                title={t("orders.empty")}
                message={t("orders.emptyHint")}
                action={
                  <Link to="/products" className="font-semibold text-primary">
                    {t("cart.browse")}
                  </Link>
                }
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
