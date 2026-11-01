import { Navigate, useLocation } from 'react-router-dom';
import { LoadingView, useI18n } from '@dopamine/web-shared';
import { useAuth } from '@/lib/hooks.js';

export function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  if (status === 'loading') return <LoadingView label={t('common.loading')} />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}
