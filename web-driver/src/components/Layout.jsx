import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  SUPPORTED_LANGS,
  THEME_MODES,
  apiErrorMessage,
  useI18n,
  useTheme,
} from "@dopamine/web-shared";
import {
  useGetMeQuery,
  useGetUnreadCountQuery,
  useLogoutMutation,
  useSetAvailabilityMutation,
} from "@/api/endpoints.js";
import { authActions } from "@/lib/session.js";
import { socketClient } from "@/lib/socket.js";
import { useAppDispatch, useAuth } from "@/lib/hooks.js";
import { useLiveJobs } from "@/features/jobs/useLiveJobs.js";
import { availabilityBody } from "@/features/geo/location.js";
import { PositionProvider, usePosition } from "@/features/geo/usePosition.jsx";

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-primary-tint text-primary" : "text-text-primary hover:bg-surface-alt"}`;

function Preferences() {
  const { t, lang, setLang } = useI18n();
  const { mode, setMode } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="lang-select">
        {t("language.label")}
      </label>
      <select
        id="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l} value={l}>
            {t(`language.${l}`)}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="theme-select">
        {t("theme.label")}
      </label>
      <select
        id="theme-select"
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary"
      >
        {THEME_MODES.map((m) => (
          <option key={m} value={m}>
            {t(`theme.${m}`)}
          </option>
        ))}
      </select>
    </div>
  );
}

function OnlineSwitch({ me }) {
  const { t } = useI18n();
  const { locate, errorKey, markSent } = usePosition();
  const [setAvailability, { isLoading }] = useSetAvailabilityMutation();
  const [error, setError] = useState("");
  const blocked = me.status !== "APPROVED";

  async function toggle() {
    setError("");
    const goOnline = !me.isOnline;
    try {
      const position = goOnline ? await locate() : null;
      await setAvailability(availabilityBody(goOnline, position)).unwrap();
      if (goOnline) markSent(position);
    } catch (err) {
      setError(apiErrorMessage(err, t));
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        role="switch"
        aria-checked={!!me.isOnline}
        disabled={blocked || isLoading}
        onClick={toggle}
        className={`rounded-full px-3 py-1 text-sm font-semibold disabled:opacity-50 ${me.isOnline ? "bg-success/15 text-success" : "bg-surface-alt text-text-secondary"}`}
      >
        {me.isOnline ? t("driver.online") : t("driver.offline")}
      </button>
      {error ? (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      ) : null}
      {!error && me.isOnline && errorKey ? (
        <span className="text-xs text-warning">{t(errorKey)}</span>
      ) : null}
    </div>
  );
}

function Shell() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const firstRender = useRef(true);
  const { user, bootstrapError } = useAuth();
  const { data: me } = useGetMeQuery();
  const { data: unread } = useGetUnreadCountQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const unreadCount = unread?.count ?? 0;
  useLiveJobs();

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus();
  }, [routerLocation.pathname]);

  async function onLogout() {
    try {
      await logout().unwrap();
    } catch {
      // the local session is cleared either way
    }
    socketClient.disconnect();
    dispatch(authActions.loggedOut());
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3"
      >
        {t("common.skipToContent")}
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2">
          <span className="text-lg font-bold text-primary">{t("brand")}</span>
          <nav
            aria-label={t("nav.main")}
            className="flex flex-1 flex-wrap items-center gap-1"
          >
            <NavLink to="/" end className={navClass}>
              {t("nav.jobs")}
            </NavLink>
            <NavLink to="/earnings" className={navClass}>
              {t("nav.earnings")}
            </NavLink>
            <NavLink to="/support" className={navClass}>
              {t("nav.support")}
            </NavLink>
            <NavLink to="/profile" className={navClass}>
              {t("nav.profile")}
            </NavLink>
          </nav>
          {me ? <OnlineSwitch me={me} /> : null}
          <Preferences />
          <NavLink
            to="/notifications"
            aria-label={
              unreadCount
                ? t("nav.notificationsUnread", { count: unreadCount })
                : t("nav.notifications")
            }
            className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
          >
            {t("nav.notifications")}
            {unreadCount > 0 ? (
              <span className="ms-1 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-text-inverse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </NavLink>
          <span className="hidden text-sm text-text-secondary sm:inline">
            {user?.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            loading={loggingOut}
          >
            {t("nav.signOut")}
          </Button>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-6 outline-none"
      >
        {bootstrapError ? (
          <Alert tone="warning" className="mb-4">
            {t("errors.network")}
          </Alert>
        ) : null}
        {me?.status === "PENDING" ? (
          <Alert tone="warning" className="mb-4">
            {t("driver.pendingApproval")}
          </Alert>
        ) : null}
        {me?.status === "SUSPENDED" ? (
          <Alert tone="danger" className="mb-4">
            {t("driver.suspended")}
          </Alert>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  const { data: me } = useGetMeQuery();
  return (
    <PositionProvider online={!!me?.isOnline && me.status === "APPROVED"}>
      <Shell />
    </PositionProvider>
  );
}
