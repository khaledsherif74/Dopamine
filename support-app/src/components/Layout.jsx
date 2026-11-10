import { useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  SUPPORTED_LANGS,
  THEME_MODES,
  useI18n,
  useTheme,
} from "@dopamine/web-shared";
import { api } from "@/api/api.js";
import { useGetUnreadCountQuery, useLogoutMutation } from "@/api/endpoints.js";
import { authActions } from "@/lib/session.js";
import { socketClient } from "@/lib/socket.js";
import { useAppDispatch, useAuth } from "@/lib/hooks.js";

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

export function Layout() {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const firstRender = useRef(true);
  const { user, bootstrapError } = useAuth();
  const { data: unread } = useGetUnreadCountQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const unreadCount = unread?.count ?? 0;

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus();
  }, [routerLocation.pathname]);

  useEffect(
    () =>
      socketClient.onNotification(() =>
        dispatch(api.util.invalidateTags(["Notifications"])),
      ),
    [dispatch],
  );

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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <span className="text-lg font-bold text-primary">{t("brand")}</span>
          <nav
            aria-label={t("nav.main")}
            className="flex flex-1 flex-wrap items-center gap-1"
          >
            <NavLink to="/" end className={navClass}>
              {t("nav.dashboard")}
            </NavLink>
            <NavLink to="/tickets" className={navClass}>
              {t("nav.tickets")}
            </NavLink>
            <NavLink to="/refunds" className={navClass}>
              {t("nav.refunds")}
            </NavLink>
            <NavLink to="/orders" className={navClass}>
              {t("nav.orders")}
            </NavLink>
            <NavLink to="/settings" className={navClass}>
              {t("nav.settings")}
            </NavLink>
          </nav>
          <Preferences />
          <NavLink
            to="/notifications"
            aria-label={
              unreadCount
                ? t("nav.notificationsUnread", { count: unreadCount })
                : t("nav.notifications")
            }
            className="relative rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
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
        className="mx-auto max-w-7xl px-4 py-6 outline-none"
      >
        {bootstrapError ? (
          <Alert tone="warning" className="mb-4">
            {t("errors.network")}
          </Alert>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
