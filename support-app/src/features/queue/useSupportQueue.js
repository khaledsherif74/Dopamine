import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiErrorMessage, useI18n } from "@dopamine/web-shared";
import { useLazyListTicketsQuery } from "@/api/endpoints.js";
import { socketClient } from "@/lib/socket.js";
import {
  applyTicketCreated,
  applyTicketMessage,
  applyTicketUpdated,
  markTicketRead,
  toQueryParams,
} from "./ticketQueue.js";

const PAGE_SIZE = 30;
const REFETCH_DEBOUNCE_MS = 600;

export function useSupportQueue({ filter, myId, openTicketId = null }) {
  const { t } = useI18n();
  const [fetchPage] = useLazyListTicketsQuery();
  const [state, setState] = useState({ tickets: [], total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const filterRef = useRef(filter);
  const openRef = useRef(openTicketId);
  const requestId = useRef(0);
  const refetchTimer = useRef(null);
  useEffect(() => {
    filterRef.current = filter;
    openRef.current = openTicketId;
  }, [filter, openTicketId]);

  const filterKey = useMemo(() => JSON.stringify(filter), [filter]);

  const loadFirst = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const data = await fetchPage(
        toQueryParams(filterRef.current, 1, PAGE_SIZE),
        false,
      ).unwrap();
      if (id !== requestId.current) return;
      setState({ tickets: data.tickets ?? [], total: data.total ?? 0 });
      setPage(1);
      setError("");
    } catch (err) {
      if (id === requestId.current) setError(apiErrorMessage(err, t));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetchPage, t]);

  useEffect(() => {
    setLoading(true);
    loadFirst();
  }, [filterKey, loadFirst]);

  const scheduleReload = useCallback(() => {
    clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(loadFirst, REFETCH_DEBOUNCE_MS);
  }, [loadFirst]);

  useEffect(() => {
    const off = socketClient.subscribeSupportQueue({
      onCreated: (evt) =>
        setState((s) => applyTicketCreated(s, evt, filterRef.current, myId)),
      onUpdated: (evt) =>
        setState((s) => {
          const next = applyTicketUpdated(s, evt, filterRef.current, myId);
          if (next.refetch) scheduleReload();
          return { tickets: next.tickets, total: next.total };
        }),
      onMessage: (evt) =>
        setState((s) => applyTicketMessage(s, evt, openRef.current, myId)),
      onConnected: scheduleReload,
    });
    return () => {
      clearTimeout(refetchTimer.current);
      off();
    };
  }, [myId, scheduleReload]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchPage(
        toQueryParams(filterRef.current, next, PAGE_SIZE),
        false,
      ).unwrap();
      setState((s) => {
        const known = new Set(s.tickets.map((x) => x.id));
        return {
          tickets: [
            ...s.tickets,
            ...(data.tickets ?? []).filter((x) => !known.has(x.id)),
          ],
          total: data.total ?? s.total,
        };
      });
      setPage(next);
    } catch (err) {
      setError(apiErrorMessage(err, t));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, page, t]);

  const markRead = useCallback(
    (id) => setState((s) => markTicketRead(s, id)),
    [],
  );

  return {
    tickets: state.tickets,
    total: state.total,
    loading,
    loadingMore,
    error,
    hasMore: state.tickets.length < state.total,
    loadMore,
    reload: loadFirst,
    markRead,
  };
}
