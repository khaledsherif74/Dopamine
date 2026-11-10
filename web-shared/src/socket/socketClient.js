import { io as defaultIo } from 'socket.io-client';

/**
 * One Socket.IO connection per app, authenticated with the in-memory access token.
 *  - `auth` is a callback, so every (re)connect sends the CURRENT token
 *  - server `auth_expired`  -> refresh the token, reconnect
 *  - `connect_error: unauthorized` -> one refresh + reconnect attempt per cool-down
 *  - every active subscription re-joins its room after a reconnect
 *
 * @param {object} o
 * @param {string} o.url
 * @param {()=>string|null} o.getToken
 * @param {()=>Promise<string|null>} o.refreshAccessToken  resolves a fresh token (and stores it) or null
 * @param {Function} [o.ioFactory]  override (tests)
 */
export function createSocketClient({ url, getToken, refreshAccessToken, ioFactory = defaultIo, retryCooldownMs = 10000 }) {
  let socket = null;
  const joins = new Map(); // subscription key -> () => void (re-emits the join)
  let lastAuthRetry = 0;
  let seq = 0;

  async function reauthAndReconnect() {
    const token = await refreshAccessToken();
    if (!token || !socket) return;
    socket.disconnect();
    socket.connect();
  }

  function getSocket() {
    if (socket) return socket;
    socket = ioFactory(url, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      auth: cb => cb({ token: getToken() }),
    });
    socket.on('connect', () => joins.forEach(join => join()));
    socket.on('auth_expired', () => {
      reauthAndReconnect();
    });
    socket.on('connect_error', err => {
      if (err?.message !== 'unauthorized') return;
      const now = Date.now();
      if (now - lastAuthRetry < retryCooldownMs) return;
      lastAuthRetry = now;
      reauthAndReconnect();
    });
    return socket;
  }

  function subscribe(events, join) {
    const s = getSocket();
    const key = `sub-${++seq}`;
    Object.entries(events).forEach(([event, handler]) => s.on(event, handler));
    joins.set(key, join);
    if (s.connected) join();
    return () => {
      Object.entries(events).forEach(([event, handler]) => s.off(event, handler));
      joins.delete(key);
    };
  }

  const emit = (event, payload) => socket?.connected && socket.emit(event, payload);

  return {
    getSocket,
    disconnect() {
      joins.clear();
      socket?.disconnect();
      socket = null;
    },

    // order status (existing mobile-compatible events)
    subscribeOrder(orderId, onStatus) {
      const handler = payload => {
        if (payload?.orderId === orderId) onStatus(payload);
      };
      const off = subscribe({ 'order:status_changed': handler }, () => getSocket().emit('join_order', orderId));
      return () => {
        off();
        emit('leave_order', orderId);
      };
    },

    // support tickets
    subscribeTicket(ticketId, { onMessage, onUpdated, onTyping, onRead, onJoined } = {}) {
      const only = fn => payload => {
        if (fn && payload?.ticketId === ticketId) fn(payload);
      };
      const off = subscribe(
        {
          'ticket:message': only(onMessage),
          'ticket:updated': only(onUpdated),
          'ticket:typing': only(onTyping),
          'ticket:read': only(onRead),
        },
        () => getSocket().emit('ticket:join', { ticketId }, ack => onJoined?.(ack)),
      );
      return {
        unsubscribe() {
          off();
          emit('ticket:leave', { ticketId });
        },
        typing: isTyping => emit('ticket:typing', { ticketId, isTyping }),
        read: () => emit('ticket:read', { ticketId }),
      };
    },

    // SUPPORT agents: live queue. The server already puts the socket in `role:SUPPORT`, so nothing is
    // joined. `onConnected` fires on every (re)connect: the caller refetches to catch up on missed events.
    subscribeSupportQueue({ onCreated, onUpdated, onMessage, onConnected } = {}) {
      const relay = fn => payload => {
        if (fn && payload?.ticketId) fn(payload);
      };
      return subscribe(
        {
          'support:ticket_created': relay(onCreated),
          'ticket:updated': relay(onUpdated),
          'support:ticket_message': relay(onMessage),
        },
        () => onConnected?.(),
      );
    },

    // per-order chat (channel: 'SUPPLIER' | 'DRIVER')
    subscribeOrderChat(orderId, channel, { onMessage, onTyping, onRead, onJoined } = {}) {
      const only = fn => payload => {
        if (fn && payload?.orderId === orderId && payload?.channel === channel) fn(payload);
      };
      const off = subscribe(
        {
          'order_chat:message': only(onMessage),
          'order_chat:typing': only(onTyping),
          'order_chat:read': only(onRead),
        },
        () => getSocket().emit('order_chat:join', { orderId, channel }, ack => onJoined?.(ack)),
      );
      return {
        unsubscribe() {
          off();
          emit('order_chat:leave', { orderId, channel });
        },
        typing: isTyping => emit('order_chat:typing', { orderId, channel, isTyping }),
        read: () => emit('order_chat:read', { orderId, channel }),
      };
    },

    // `onConnected` (optional) fires on every (re)connect: lets a caller refetch what it may have missed.
    onNotification(handler, onConnected) {
      return subscribe({ 'notification:new': handler }, () => onConnected?.());
    },
  };
}
