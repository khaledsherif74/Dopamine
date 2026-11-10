import { useEffect, useRef } from "react";
import { api } from "@/api/api.js";
import { useAppDispatch } from "@/lib/hooks.js";
import { socketClient } from "@/lib/socket.js";

const DEBOUNCE_MS = 500;

export function useLiveJobs() {
  const dispatch = useAppDispatch();
  const timer = useRef(null);
  useEffect(() => {
    const refresh = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(
        () => dispatch(api.util.invalidateTags(["Jobs", "Notifications"])),
        DEBOUNCE_MS,
      );
    };
    const off = socketClient.onNotification(refresh, refresh);
    return () => {
      clearTimeout(timer.current);
      off();
    };
  }, [dispatch]);
}
