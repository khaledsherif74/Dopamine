import { useEffect } from 'react';
import { useI18n } from '@dopamine/web-shared';

export function useDocumentTitle(title) {
  const { t } = useI18n();
  useEffect(() => {
    document.title = title ? `${title} · ${t('brand')}` : t('brand');
  }, [title, t]);
}
