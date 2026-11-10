import { useState } from 'react';
import { Alert, Button, Card, TextField, useI18n } from '@dopamine/web-shared';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { useCanned } from '@/features/canned/useCanned.js';
import { MAX_BODY, MAX_CANNED, MAX_TITLE } from '@/features/canned/canned.js';

function CannedEditor() {
  const { t } = useI18n();
  const canned = useCanned();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', body: '' });
  const [errors, setErrors] = useState({});

  function reset() {
    setEditingId(null);
    setForm({ title: '', body: '' });
    setErrors({});
  }
  function save(e) {
    e.preventDefault();
    const r = editingId ? canned.update(editingId, form) : canned.add(form);
    setErrors(r.errors);
    if (r.ok) reset();
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-text-primary">{t('canned.title')}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t('canned.help', { max: MAX_CANNED })}</p>
      <form onSubmit={save} noValidate className="mt-4 space-y-3">
        <TextField label={t('canned.name')} maxLength={MAX_TITLE} value={form.title} error={errors.title && t(errors.title)} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <div>
          <label htmlFor="canned-body" className="mb-1 block text-sm font-medium text-text-primary">{t('canned.text')}</label>
          <textarea id="canned-body" rows={4} maxLength={MAX_BODY} value={form.body} aria-invalid={!!errors.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
          {errors.body ? <p role="alert" className="text-sm text-danger">{t(errors.body)}</p> : null}
        </div>
        <div className="flex gap-2">
          <Button type="submit">{editingId ? t('common.save') : t('canned.add')}</Button>
          {editingId ? <Button variant="ghost" onClick={reset}>{t('common.cancel')}</Button> : null}
        </div>
      </form>
      {canned.list.length === 0 ? <p className="mt-4 text-sm text-text-secondary">{t('canned.empty')}</p> : (
        <ul className="mt-4 space-y-2">
          {canned.list.map(r => (
            <li key={r.id} className="rounded-2xl border border-border p-3">
              <p className="font-semibold text-text-primary">{r.title}</p>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{r.body}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditingId(r.id); setForm({ title: r.title, body: r.body }); setErrors({}); }}>{t('common.edit')}</Button>
                <Button size="sm" variant="ghost" onClick={() => { canned.remove(r.id); if (editingId === r.id) reset(); }}>{t('common.delete')}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Alert tone="info" className="mt-4">{t('canned.localOnly')}</Alert>
    </Card>
  );
}

export function SettingsPage() {
  const { t } = useI18n();
  useDocumentTitle(t('nav.settings'));
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
      <CannedEditor />
    </div>
  );
}
