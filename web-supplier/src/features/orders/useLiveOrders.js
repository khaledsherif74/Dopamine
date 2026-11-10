import { useEffect, useRef } from 'react';
import { api } from '@/api/api.js';
import { useAppDispatch } from '@/lib/hooks.js';
import { socketClient } from '@/lib/socket.js';

const DEBOUNCE_MS = 500;

// The API sends no order event to the shop, but every new order / customer message / status change
// creates a notification, which does arrive over the socket. Refetch the order board on each one
// (debounced), and also after every (re)connect, so nothing is missed while the socket was away.
export function useLiveOrders() {
  const dispatch = useAppDispatch();
  const timer = useRef(null);
  useEffect(() => {
    const refresh = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => dispatch(api.util.invalidateTags(['Orders', 'Order', 'Notifications'])), DEBOUNCE_MS);
    };
    const off = socketClient.onNotification(refresh, refresh);
    return () => {
      clearTimeout(timer.current);
      off();
    };
  }, [dispatch]);
}
