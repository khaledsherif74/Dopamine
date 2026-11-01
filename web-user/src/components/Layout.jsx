import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Spinner, SUPPORTED_LANGS, THEME_MODES, useI18n, useTheme } from '@dopamine/web-shared';
import { config } from '@/config.js';
import { bootstrapAuth, authActions } from '@/lib/session.js';
import { useAppDispatch, useAppSelector, useAuth } from '@/lib/hooks.js';
import { cartCount } from '@/features/cart/cartLogic.js';
import { useGetUnreadCountQuery, useLogoutMutation } from '@/api/endpoints.js';
import { api } from '@/api/api.js';
import { socketClient } from '@/lib/socket.js';
import { LocationPicker } from './LocationPicker.jsx';
import { CartConflictDialog } from './CartConflictDialog.jsx';

const navClass = ({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-primary-tint text-primary' : 'text-text-primary hover:bg-surface-alt'}`;

function SearchForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={e => {
        e.preventDefault();
        navigate(`/products${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
      }}
    >
      <label htmlFor="global-search" className="sr-only">{t('nav.searchLabel')}</label>
      <input
        id="global-search"
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-primary"
      />
    </form>
  );
}

function SettingsMenu() {
  const { t, lang, setLang } = useI18n();
  const { mode, setMode } = useTheme();
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="lang-select">{t('language.label')}</label>
      <select id="lang-select" value={lang} onChange={e => setLang(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary">
        {SUPPORTED_LANGS.map(l => (
          <option key={l} value={l}>{t(`language.${l}`)}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="theme-select">{t('theme.label')}</label>
      <select id="theme-select" value={mode} onChange={e => setMode(e.target.value)} className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-primary">
        {THEME_MODES.map(m => (
          <option key={m} value={m}>{t(`theme.${m}`)}</option>
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
  const { status, user, bootstrapError } = useAuth();
  const cart = useAppSelector(s => s.cart);
  const location = useAppSelector(s => s.location);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const count = cartCount(cart);
  const signedIn = status === 'authenticated';
  const { data: unread } = useGetUnreadCountQuery(undefined, { skip: !signedIn });
  const unreadCount = unread?.count ?? 0;

  // route change: back to the top and move keyboard/screen-reader focus to the new page content
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('content')?.focus({ preventScroll: true });
  }, [routerLocation.pathname]);

  // a notification pushed over the socket refreshes the badge and the list
  useEffect(() => {
    if (!signedIn) return undefined;
    return socketClient.onNotification(() => dispatch(api.util.invalidateTags(['Notifications'])));
  }, [signedIn, dispatch]);

  async function signOut() {
    try {
      await logout().unwrap(); // revokes the refresh token and clears the cookie
    } catch {
      /* even if the server is unreachable, drop the local session */
    }
    socketClient.disconnect();
    dispatch(authActions.loggedOut());
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="text-xl font-extrabold text-primary">{t('brand')}</Link>
          <nav aria-label={t('nav.menu')} className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>{t('nav.home')}</NavLink>
            <NavLink to="/products" className={navClass}>{t('nav.products')}</NavLink>
            <NavLink to="/suppliers" className={navClass}>{t('nav.suppliers')}</NavLink>
            {signedIn ? <NavLink to="/orders" className={navClass}>{t('nav2.orders')}</NavLink> : null}
          </nav>
          <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:px-4"><SearchForm /></div>
          <div className="ms-auto flex items-center gap-2">
            <button type="button" onClick={() => setPickerOpen(true)} className="max-w-[10rem] truncate rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-primary hover:bg-surface-alt" aria-haspopup="dialog">
              <span className="text-text-secondary">{t('nav.deliverTo')}: </span>
              <span className="font-semibold">{location.label || t('nav.chooseLocation')}</span>
            </button>
            <Link to="/cart" aria-label={t('nav.cartWithCount', { count })} className="relative rounded-full p-2 text-text-primary hover:bg-surface-alt">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11h10.2l2-8H6.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="19" r="1.6" fill="currentColor" /><circle cx="17" cy="19" r="1.6" fill="currentColor" /></svg>
              {count > 0 ? <span className="absolute -end-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-text-inverse">{count}</span> : null}
            </Link>
            {status === 'authenticated' ? (
              <>
                <Link to="/notifications" aria-label={unreadCount ? t('nav2.notificationsWithCount', { count: unreadCount }) : t('nav2.notifications')} className="relative rounded-full p-2 text-text-primary hover:bg-surface-alt">
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4L6 17zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {unreadCount > 0 ? <span className="absolute -end-0.5 -top-0.5 min-w-5 rounded-full bg-primary px-1 text-center text-[11px] font-bold leading-5 text-text-inverse">{unreadCount}</span> : null}
                </Link>
                <Link to="/profile" className="hidden max-w-[8rem] truncate text-sm text-text-secondary hover:text-primary sm:inline">{user?.name}</Link>
                <Button size="sm" variant="outline" loading={loggingOut} onClick={signOut}>{t('nav.logout')}</Button>
              </>
            ) : status === 'loading' ? (
              <Spinner size={18} label={t('common.loading')} />
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-tint">{t('nav.login')}</Link>
                <Link to="/register" className="hidden rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-text-inverse sm:inline">{t('nav.register')}</Link>
              </>
            )}
            <SettingsMenu />
          </div>
        </div>
      </header>

      {bootstrapError ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3">
          <Alert tone="warning">
            <span className="me-3">{t('auth.bootstrapError')}</span>
            <button type="button" className="font-semibold underline" onClick={() => dispatch(bootstrapAuth())}>{t('common.retry')}</button>
          </Alert>
        </div>
      ) : null}

      <main id="content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-text-secondary">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4">
          <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
          <Link className="hover:text-primary" to="/help">{t('nav3.help')}</Link>
          {signedIn ? <Link className="hover:text-primary" to="/support">{t('nav3.support')}</Link> : null}
          <Link className="hover:text-primary" to="/settings">{t('nav3.settings')}</Link>
          {config.termsUrl ? <a className="hover:text-primary" href={config.termsUrl} target="_blank" rel="noreferrer">{t('footer.terms')}</a> : null}
          {config.privacyUrl ? <a className="hover:text-primary" href={config.privacyUrl} target="_blank" rel="noreferrer">{t('footer.privacy')}</a> : null}
        </div>
      </footer>

      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      <CartConflictDialog />
    </div>
  );
}
