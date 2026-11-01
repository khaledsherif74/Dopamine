import { Link } from 'react-router-dom';
import { Card, SUPPORTED_LANGS, THEME_MODES, useI18n, useTheme } from '@dopamine/web-shared';
import { config } from '@/config.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';

function Choice({ legend, name, value, options, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 font-semibold text-text-primary">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <label key={o.value} className={`cursor-pointer rounded-xl border px-4 py-2 text-sm ${value === o.value ? 'border-primary bg-primary-tint font-semibold text-primary' : 'border-border text-text-primary'}`}>
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { mode, setMode } = useTheme();
  useDocumentTitle(t('settings.title'));
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t('settings.title')}</h1>
      <Card className="space-y-6">
        <Choice legend={t('settings.language')} name="lang" value={lang} onChange={setLang} options={SUPPORTED_LANGS.map(l => ({ value: l, label: t(`language.${l}`) }))} />
        <Choice legend={t('settings.theme')} name="theme" value={mode} onChange={setMode} options={THEME_MODES.map(m => ({ value: m, label: t(`theme.${m}`) }))} />
      </Card>
      <Card className="space-y-2">
        <h2 className="font-semibold text-text-primary">{t('settings.legal')}</h2>
        <ul className="space-y-1 text-sm">
          <li><Link to="/help" className="text-primary hover:underline">{t('settings.help')}</Link></li>
          {config.termsUrl ? <li><a href={config.termsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{t('footer.terms')}</a></li> : null}
          {config.privacyUrl ? <li><a href={config.privacyUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{t('footer.privacy')}</a></li> : null}
        </ul>
      </Card>
    </div>
  );
}
