import { useState } from "react";
import { Alert, Button, apiErrorMessage, useI18n } from "@dopamine/web-shared";
import {
  useAcceptOrderMutation,
  useCancelOrderMutation,
  useMarkReadyMutation,
  useRejectOrderMutation,
  useStartPreparingMutation,
} from "@/api/endpoints.js";
import {
  availableActions,
  buildCancelBody,
  buildRejectBody,
  paymentBlocksAccept,
} from "@/features/orders/orderBoard.js";
import { ReasonDialog } from "@/components/ReasonDialog.jsx";

export function OrderActions({ order, compact = false }) {
  const { t } = useI18n();
  const [accept, a] = useAcceptOrderMutation();
  const [start, s] = useStartPreparingMutation();
  const [ready, r] = useMarkReadyMutation();
  const [reject] = useRejectOrderMutation();
  const [cancel] = useCancelOrderMutation();
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const can = availableActions(order);
  const size = compact ? "sm" : "md";

  async function run(mutation, arg) {
    setError("");
    try {
      await mutation(arg).unwrap();
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }

  if (!Object.values(can).some(Boolean) && !paymentBlocksAccept(order))
    return null;
  return (
    <div className="space-y-2">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {paymentBlocksAccept(order) ? (
        <Alert tone="info">{t("orders.waitingPayment")}</Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {can.accept ? (
          <Button
            size={size}
            loading={a.isLoading}
            onClick={() => run(accept, order.id)}
          >
            {t("orders.action.accept")}
          </Button>
        ) : null}
        {can.startPreparing ? (
          <Button
            size={size}
            loading={s.isLoading}
            onClick={() => run(start, order.id)}
          >
            {t("orders.action.startPreparing")}
          </Button>
        ) : null}
        {can.markReady ? (
          <Button
            size={size}
            loading={r.isLoading}
            onClick={() => run(ready, order.id)}
          >
            {t("orders.action.markReady")}
          </Button>
        ) : null}
        {can.reject ? (
          <Button
            size={size}
            variant="outline"
            onClick={() => setDialog("reject")}
          >
            {t("orders.action.reject")}
          </Button>
        ) : null}
        {can.cancel ? (
          <Button
            size={size}
            variant="outline"
            onClick={() => setDialog("cancel")}
          >
            {t("orders.action.cancel")}
          </Button>
        ) : null}
      </div>
      {dialog === "reject" ? (
        <ReasonDialog
          title={t("orders.rejectTitle")}
          help={t("orders.rejectHelp")}
          confirmLabel={t("orders.action.reject")}
          build={buildRejectBody}
          onSubmit={(reason) => reject({ id: order.id, reason }).unwrap()}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "cancel" ? (
        <ReasonDialog
          title={t("orders.cancelTitle")}
          help={t("orders.cancelHelp")}
          confirmLabel={t("orders.action.cancel")}
          build={buildCancelBody}
          onSubmit={(reason) => cancel({ id: order.id, reason }).unwrap()}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
