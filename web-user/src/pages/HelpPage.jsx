import { Link } from 'react-router-dom';
import { Card, useI18n } from '@dopamine/web-shared';
import { useGetPublicSettingsQuery } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { FAQ_IDS } from '@/features/help/faq.js';

export function HelpPage() {
  const { t } = useI18n();
  useDocumentTitle(t('help.title'));
  const { status } = useAuth();
  const { data: settings } = useGetPublicSettingsQuery();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t('help.title')}</h1>
        <p className="text-text-secondary">{t('help.subtitle')}</p>
      </header>

      <section aria-label={t('help.title')} className="divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQ_IDS.map(id => (
          <details key={id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-text-primary">
              {t(`faq.${id}.q`)}
              <span aria-hidden="true" className="text-primary transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t(`faq.${id}.a`)}</p>
          </details>
        ))}
      </section>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-text-primary">{t('help.contactTitle')}</h2>
        <p className="text-sm text-text-secondary">{t('help.contactBody')}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          {settings?.supportPhone ? <a className="font-semibold text-primary" dir="ltr" href={`tel:${settings.supportPhone}`}>{t('help.phone')}: {settings.supportPhone}</a> : null}
          {settings?.supportEmail ? <a className="font-semibold text-primary" dir="ltr" href={`mailto:${settings.supportEmail}`}>{t('help.email')}: {settings.supportEmail}</a> : null}
        </div>
        {status === 'authenticated' ? (
          <div className="flex flex-wrap gap-3">
            <Link to="/support/new" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-text-inverse">{t('help.openTicket')}</Link>
            <Link to="/support" className="rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary">{t('help.myTickets')}</Link>
          </div>
        ) : (
          <Link to="/login" state={{ from: '/support/new' }} className="inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-text-inverse">{t('help.signInToContact')}</Link>
        )}
      </Card>
    </div>
  );
}
