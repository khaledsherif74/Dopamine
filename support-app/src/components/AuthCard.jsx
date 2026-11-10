import { Card, useI18n } from '@dopamine/web-shared';

export function AuthCard({ title, subtitle, children, footer }) {
  const { t } = useI18n();
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <p className="mb-6 text-center text-2xl font-bold text-primary">{t('brand')}</p>
      <Card className="p-6">
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
        <div className="mt-5">{children}</div>
      </Card>
      {footer ? <div className="mt-4 text-center text-sm text-text-secondary">{footer}</div> : null}
    </main>
  );
}
