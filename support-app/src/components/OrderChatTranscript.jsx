import { useState } from "react";
import {
  Button,
  ErrorView,
  LoadingView,
  apiErrorMessage,
  formatDateTime,
  useI18n,
} from "@dopamine/web-shared";
import { useListOrderChatQuery } from "@/api/endpoints.js";

function Page({ orderId, channel, cursor, isLast, onMore }) {
  const { t, lang } = useI18n();
  const { data, isLoading, isError, error, refetch } = useListOrderChatQuery({
    orderId,
    channel,
    cursor,
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
  const messages = [...(data?.messages ?? [])].reverse();
  if (messages.length === 0 && !cursor)
    return <p className="text-sm text-text-secondary">{t("chat.empty")}</p>;
  return (
    <>
      {isLast && data?.nextCursor ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMore(data.nextCursor)}
        >
          {t("chat.loadOlder")}
        </Button>
      ) : null}
      <ul className="space-y-2">
        {messages.map((m) => (
          <li key={m.id} className="rounded-2xl bg-surface px-3 py-2 text-sm">
            <p className="whitespace-pre-wrap break-words text-text-primary">
              {m.body}
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              {m.senderName || (m.senderRole ? t(`roles.${m.senderRole}`) : "")}{" "}
              · {formatDateTime(m.createdAt, lang)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

export function OrderChatTranscript({ orderId, channel }) {
  const { t } = useI18n();
  const [cursors, setCursors] = useState([undefined]);
  const shown = [...cursors].reverse();
  return (
    <div
      role="log"
      aria-label={t(`orders.chat.${channel}`)}
      className="max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-border bg-surface-alt p-3"
    >
      {shown.map((cursor, i) => (
        <Page
          key={cursor ?? "first"}
          orderId={orderId}
          channel={channel}
          cursor={cursor}
          isLast={i === 0}
          onMore={(next) => setCursors((c) => [...c, next])}
        />
      ))}
    </div>
  );
}
