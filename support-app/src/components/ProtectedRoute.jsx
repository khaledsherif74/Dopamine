import { Navigate, useLocation } from 'react-router-dom';
import { LoadingView, useI18n } from '@dopamine/web-shared';
import { useAuth } from '@/lib/hooks.js';

// Signed-in SUPPORT agents only. An account flagged `mustChangePassword` can reach nothing
// except the change-password screen (the API is not blocked server-side, so this is a UX guard).
export function ProtectedRoute({ children, allowForcedChange = false }) {
  const { status, user } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (user?.mustChangePassword && !allowForcedChange) return <Navigate to="/change-password" replace />;
  return children;
}
