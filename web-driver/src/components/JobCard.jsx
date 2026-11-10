import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  apiErrorMessage,
  formatMoney,
  useI18n,
} from "@dopamine/web-shared";
import { api } from "@/api/api.js";
import { useAcceptDeliveryMutation } from "@/api/endpoints.js";
import { useAppDispatch } from "@/lib/hooks.js";
import { shortId } from "@/lib/ids.js";
import { cashToCollect, driverFee } from "@/features/jobs/jobRules.js";
import { mapsLink } from "@/features/geo/geo.js";
import { DeliveryActions } from "@/components/DeliveryActions.jsx";

function Place({ label, name, line, link }) {
  const { t } = useI18n();
  return (
    <div className="text-sm">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className="font-semibold text-text-primary">{name}</p>
      {line ? <p className="text-text-secondary">{line}</p> : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary"
        >
          {t("jobs.openMap")}
        </a>
      ) : null}
    </div>
  );
}

const shopLine = (shop) => shop?.address ?? "";
const shopLink = (shop) =>
  mapsLink({ lat: shop?.lat, lng: shop?.lng, text: shop?.address });
const addressLine = (a) => [a?.line1, a?.city].filter(Boolean).join(", ");

export function JobCard({ delivery, kind, blockReason }) {
  const { t, lang } = useI18n();
  const dispatch = useAppDispatch();
  const [accept, { isLoading }] = useAcceptDeliveryMutation();
  const [error, setError] = useState("");
  const { order } = delivery;
  const cash = cashToCollect(order);
  const itemCount = (order.items ?? []).reduce((n, i) => n + i.quantity, 0);

  async function onAccept() {
    setError("");
    try {
      await accept(delivery.id).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err, t));
      if (err?.status === 409) dispatch(api.util.invalidateTags(["Jobs"]));
    }
  }

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-text-primary">
          #{shortId(order.id)}
        </span>
        <div className="flex flex-wrap gap-1">
          <Badge tone="success">
            {t("jobs.fee", { amount: formatMoney(driverFee(order), lang) })}
          </Badge>
          {delivery.distanceKm != null ? (
            <Badge tone="primary">
              {t("jobs.distance", { km: delivery.distanceKm.toFixed(1) })}
            </Badge>
          ) : null}
          {kind === "mine" ? (
            <Badge tone="primary">{t(`jobs.status.${delivery.status}`)}</Badge>
          ) : null}
          {order.chatUnread?.DRIVER > 0 ? (
            <Badge tone="warning">
              {t("jobs.chatUnread", { count: order.chatUnread.DRIVER })}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Place
          label={t("jobs.pickupFrom")}
          name={order.supplier?.shopName ?? "—"}
          line={shopLine(order.supplier)}
          link={kind === "mine" ? shopLink(order.supplier) : null}
        />
        {kind === "mine" ? (
          <Place
            label={t("jobs.deliverTo")}
            name={order.user?.name ?? "—"}
            line={addressLine(order.address)}
            link={mapsLink({
              lat: order.address?.lat,
              lng: order.address?.lng,
              text: addressLine(order.address),
            })}
          />
        ) : (
          <Place
            label={t("jobs.deliverTo")}
            name={order.address?.city ?? "—"}
            line={t("jobs.addressAfterAccept")}
          />
        )}
      </div>
      <p className="text-xs text-text-secondary">
        {t("jobs.items", { count: itemCount })}
        {cash > 0
          ? ` · ${t("jobs.cashOrder", { amount: formatMoney(cash, lang) })}`
          : ""}
      </p>
      {kind === "mine" && order.user?.phone ? (
        <a
          href={`tel:${order.user.phone}`}
          dir="ltr"
          className="inline-block text-sm font-semibold text-primary"
        >
          {t("jobs.callCustomer")}: {order.user.phone}
        </a>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {kind === "available" ? (
        <div className="space-y-1">
          {blockReason ? (
            <p className="text-sm text-warning">
              {t(`jobs.blocked.${blockReason}`)}
            </p>
          ) : null}
          <Button
            disabled={!!blockReason}
            loading={isLoading}
            onClick={onAccept}
          >
            {t("jobs.action.accept")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-3">
          <DeliveryActions delivery={delivery} />
          <Link
            to={`/deliveries/${delivery.id}`}
            className="self-center text-sm font-semibold text-primary"
          >
            {t("jobs.details")}
          </Link>
        </div>
      )}
    </li>
  );
}
