import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiErrorMessage,
  markMineRead,
  mergeMessages,
  newestCreatedAt,
  unreadFromOthers,
  useI18n,
} from "@dopamine/web-shared";
import { socketClient } from "@/lib/socket.js";
import {
  useLazyGetTicketQuery,
  useLazyListTicketMessagesQuery,
  useMarkTicketReadMutation,
  useReplyToTicketMutation,
} from "@/api/endpoints.js";

const TYPING_VISIBLE_MS = 4000;

export const isAgentMessage = (m) => m.authorRole === "SUPPORT";

export function useAgentTicket({ ticketId, onChanged }) {
  const { t } = useI18n();
  const [loadTicket] = useLazyGetTicketQuery();
  const [loadAfter] = useLazyListTicketMessagesQuery();
  const [reply] = useReplyToTicketMutation();
  const [markRead] = useMarkTicketReadMutation();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [typing, setTyping] = useState(false);
  const subRef = useRef(null);
  const typingTimer = useRef(null);
  const messagesRef = useRef([]);
  const changedRef = useRef(onChanged);
  useEffect(() => {
    messagesRef.current = messages;
    changedRef.current = onChanged;
  }, [messages, onChanged]);

  const reload = useCallback(async () => {
    try {
      const data = await loadTicket(ticketId, false).unwrap();
      const { messages: history = [], ...rest } = data;
      setTicket(rest);
      setMessages((prev) => mergeMessages(prev, history));
      setError("");
    } catch (err) {
      setError(apiErrorMessage(err, t));
    } finally {
      setLoading(false);
    }
  }, [loadTicket, ticketId, t]);

  useEffect(() => {
    setLoading(true);
    setTicket(null);
    setMessages([]);
    reload();
  }, [reload]);

  useEffect(() => {
    const sub = socketClient.subscribeTicket(ticketId, {
      onMessage: (m) => setMessages((prev) => mergeMessages(prev, [m])),
      onUpdated: (u) => {
        setTicket((prev) =>
          prev
            ? {
                ...prev,
                status: u.status,
                priority: u.priority,
                assignedAgentId: u.assignedAgentId ?? null,
                assignedAgent: u.assignedAgentId
                  ? (u.assignedAgent ??
                    (prev.assignedAgent?.id === u.assignedAgentId
                      ? prev.assignedAgent
                      : null))
                  : null,
                resolution: u.resolution ?? prev.resolution,
                resolvedAt: u.resolvedAt ?? null,
              }
            : prev,
        );
        changedRef.current?.();
      },
      onTyping: (p) => {
        if (p.role === "SUPPORT") return;
        setTyping(!!p.isTyping);
        clearTimeout(typingTimer.current);
        if (p.isTyping)
          typingTimer.current = setTimeout(
            () => setTyping(false),
            TYPING_VISIBLE_MS,
          );
      },
      onRead: () => setMessages((prev) => markMineRead(prev, isAgentMessage)),
      onJoined: (ack) => {
        setJoined(!!ack?.ok);
        if (!ack?.ok) return;
        const after = newestCreatedAt(messagesRef.current);
        loadAfter({ id: ticketId, after }, false)
          .unwrap()
          .then(
            (out) =>
              out.messages?.length &&
              setMessages((prev) => mergeMessages(prev, out.messages)),
          )
          .catch(() => {});
      },
    });
    subRef.current = sub;
    return () => {
      clearTimeout(typingTimer.current);
      sub.unsubscribe();
      subRef.current = null;
      setJoined(false);
    };
  }, [ticketId, loadAfter]);

  const send = useCallback(
    async (body) => {
      const message = await reply({ id: ticketId, body }).unwrap();
      setMessages((prev) => mergeMessages(prev, [message]));
      subRef.current?.typing(false);
      reload();
      changedRef.current?.();
      return message;
    },
    [reply, ticketId, reload],
  );

  const unread = unreadFromOthers(messages, isAgentMessage);
  useEffect(() => {
    if (unread === 0) return;
    if (subRef.current && joined) subRef.current.read();
    else markRead(ticketId);
  }, [unread, joined, markRead, ticketId]);

  return {
    ticket,
    messages,
    loading,
    error,
    typing,
    send,
    reload,
    notifyTyping: (v) => subRef.current?.typing(v),
  };
}
