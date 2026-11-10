import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiErrorMessage,
  markMineRead,
  mergeMessages,
  unreadFromOthers,
  useI18n,
} from "@dopamine/web-shared";
import { socketClient } from "@/lib/socket.js";
import {
  useLazyListChatQuery,
  useMarkChatReadMutation,
  useSendChatMutation,
} from "@/api/endpoints.js";

const TYPING_VISIBLE_MS = 4000;

export function useOrderChat({ orderId, channel, myId, enabled = true }) {
  const { t } = useI18n();
  const [loadPage] = useLazyListChatQuery();
  const [sendChat] = useSendChatMutation();
  const [markRead] = useMarkChatReadMutation();

  const [messages, setMessages] = useState([]);
  const [olderCursor, setOlderCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [access, setAccess] = useState({
    joined: false,
    canWrite: false,
    reason: null,
  });
  const [typing, setTyping] = useState(false);
  const isMine = useCallback((m) => m.senderId === myId, [myId]);
  const subRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    loadPage({ orderId, channel }, false)
      .unwrap()
      .then((page) => {
        if (cancelled) return;
        setMessages((prev) => mergeMessages(prev, page.messages));
        setOlderCursor(page.nextCursor ?? null);
        setError("");
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [enabled, orderId, channel, loadPage, t]);

  useEffect(() => {
    if (!enabled) return undefined;
    const sub = socketClient.subscribeOrderChat(orderId, channel, {
      onMessage: (m) => setMessages((prev) => mergeMessages(prev, [m])),
      onTyping: (p) => {
        setTyping(!!p.isTyping);
        clearTimeout(typingTimer.current);
        if (p.isTyping)
          typingTimer.current = setTimeout(
            () => setTyping(false),
            TYPING_VISIBLE_MS,
          );
      },
      onRead: () => setMessages((prev) => markMineRead(prev, isMine)),
      onJoined: (ack) =>
        setAccess({
          joined: !!ack?.ok,
          canWrite: !!ack?.ok && !!ack.canWrite,
          reason: ack?.reason ?? null,
        }),
    });
    subRef.current = sub;
    return () => {
      clearTimeout(typingTimer.current);
      sub.unsubscribe();
      subRef.current = null;
    };
  }, [enabled, orderId, channel, isMine]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor) return;
    try {
      const page = await loadPage(
        { orderId, channel, cursor: olderCursor },
        false,
      ).unwrap();
      setMessages((prev) => mergeMessages(prev, page.messages));
      setOlderCursor(page.nextCursor ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }, [olderCursor, loadPage, orderId, channel, t]);

  const send = useCallback(
    async (body) => {
      const message = await sendChat({ orderId, channel, body }).unwrap();
      setMessages((prev) => mergeMessages(prev, [message]));
      subRef.current?.typing(false);
      return message;
    },
    [sendChat, orderId, channel],
  );

  const unread = unreadFromOthers(messages, isMine);
  useEffect(() => {
    if (!enabled || unread === 0) return;
    if (subRef.current && access.joined) subRef.current.read();
    else markRead({ orderId, channel });
  }, [enabled, unread, access.joined, markRead, orderId, channel]);

  return {
    messages,
    isMine,
    loading,
    error,
    access,
    typing,
    hasOlder: !!olderCursor,
    loadOlder,
    send,
    notifyTyping: (isTyping) => subRef.current?.typing(isTyping),
  };
}
