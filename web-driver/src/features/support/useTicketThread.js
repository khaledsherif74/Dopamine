import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage, markMineRead, mergeMessages, newestCreatedAt, unreadFromOthers, useI18n } from '@dopamine/web-shared';
import { api } from '@/api/api.js';
import { socketClient } from '@/lib/socket.js';
import { useAppDispatch } from '@/lib/hooks.js';
import { useLazyGetTicketQuery, useLazyListTicketMessagesQuery, useMarkTicketReadMutation, useSendTicketMessageMutation } from '@/api/endpoints.js';

const TYPING_VISIBLE_MS = 4000;

// History + sending over REST, live updates over the socket. After EVERY join (including the
// re-join after a reconnect) the messages missed in between are fetched with ?after=.
export function useTicketThread({ ticketId, myId }) {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const [loadTicket] = useLazyGetTicketQuery();
  const [loadAfter] = useLazyListTicketMessagesQuery();
  const [sendMessage] = useSendTicketMessageMutation();
  const [markRead] = useMarkTicketReadMutation();

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [typing, setTyping] = useState(false);
  const subRef = useRef(null);
  const typingTimer = useRef(null);
  const messagesRef = useRef([]);
  const isMine = useCallback(m => m.authorId === myId, [myId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    loadTicket(ticketId, false)
      .unwrap()
      .then(data => {
        if (cancelled) return;
        const { messages: history = [], ...rest } = data;
        setTicket(rest);
        setMessages(prev => mergeMessages(prev, history));
        setError('');
      })
      .catch(err => !cancelled && setError(apiErrorMessage(err, t)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ticketId, loadTicket, t]);

  useEffect(() => {
    const sub = socketClient.subscribeTicket(ticketId, {
      onMessage: m => setMessages(prev => mergeMessages(prev, [m])),
      onUpdated: u => {
        setTicket(prev => (prev ? { ...prev, status: u.status, priority: u.priority, resolution: u.resolution ?? prev.resolution, resolvedAt: u.resolvedAt ?? null, assignedAgent: u.assignedAgent ?? prev.assignedAgent } : prev));
        dispatch(api.util.invalidateTags(['Tickets']));
      },
      onTyping: p => {
        setTyping(!!p.isTyping);
        clearTimeout(typingTimer.current);
        if (p.isTyping) typingTimer.current = setTimeout(() => setTyping(false), TYPING_VISIBLE_MS);
      },
      onRead: () => setMessages(prev => markMineRead(prev, isMine)),
      onJoined: ack => {
        setJoined(!!ack?.ok);
        if (!ack?.ok) return;
        // catch up on anything that arrived while the socket was away
        const after = newestCreatedAt(messagesRef.current);
        loadAfter({ id: ticketId, after }, false)
          .unwrap()
          .then(out => out.messages?.length && setMessages(prev => mergeMessages(prev, out.messages)))
          .catch(() => {});
      },
    });
    subRef.current = sub;
    return () => {
      clearTimeout(typingTimer.current);
      sub.unsubscribe();
      subRef.current = null;
    };
  }, [ticketId, isMine, loadAfter, dispatch]);

  const send = useCallback(
    async body => {
      const message = await sendMessage({ id: ticketId, body }).unwrap();
      setMessages(prev => mergeMessages(prev, [message]));
      setTicket(prev => (prev && prev.status === 'RESOLVED' ? { ...prev, status: 'OPEN' } : prev)); // the server reopens it
      subRef.current?.typing(false);
      return message;
    },
    [sendMessage, ticketId],
  );

  const unread = unreadFromOthers(messages, isMine);
  useEffect(() => {
    if (unread === 0) return;
    if (subRef.current && joined) subRef.current.read();
    else markRead(ticketId);
  }, [unread, joined, markRead, ticketId]);

  return { ticket, messages, isMine, loading, error, typing, send, notifyTyping: v => subRef.current?.typing(v) };
}
