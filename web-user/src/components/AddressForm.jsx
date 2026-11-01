import { useState } from 'react';
import { Alert, Button, TextField, addressSchema, apiErrorMessage, useI18n, validate } from '@dopamine/web-shared';

// onSubmit(values) must return a promise (rejects on failure); the form shows the error.
export function AddressForm({ initial, submitLabel, onSubmit, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ label: initial?.label ?? '', line1: initial?.line1 ?? '', city: initial?.city ?? '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const result = validate(addressSchema, form);
    setErrors(result.errors);
    if (!result.ok) return;
    setBusy(true);
    setServerError('');
    try {
      await onSubmit(result.values);
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-xl border border-border p-3">
      <TextField label={t('location.label')} value={form.label} error={errors.label && t(errors.label)} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
      <TextField label={t('location.line1')} value={form.line1} error={errors.line1 && t(errors.line1)} autoComplete="street-address" onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} />
      <TextField label={t('location.city')} value={form.city} error={errors.city && t(errors.city)} autoComplete="address-level2" onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit" loading={busy} className="flex-1">{submitLabel}</Button>
        {onCancel ? <Button variant="ghost" onClick={onCancel}>{t('common.cancel')}</Button> : null}
      </div>
    </form>
  );
}
