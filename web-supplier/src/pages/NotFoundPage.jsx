import { Link } from 'react-router-dom';
import { EmptyState, useI18n } from '@dopamine/web-shared';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';

export function NotFoundPage() {
  const { t } = useI18n();
  useDocumentTitle(t('notFound.title'));
  return <EmptyState title={t('notFound.title')} message={t('notFound.body')} action={<Link to="/" className="font-semibold text-primary">{t('notFound.home')}</Link>} />;
}
