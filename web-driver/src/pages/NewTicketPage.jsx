import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, SelectField, TICKET_CATEGORIES, TextField, apiErrorMessage, ticketSchema, useI18n, validate } from '@dopamine/web-shared';
import { useCreateTicketMutation } from '@/api/endpoints.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { AuthCard } from '@/components/AuthCard.jsx';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function NewTicketPage() {
  const { t } = useI18n();
  useDocumentTitle(t('support.newTicket'));
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawOrder = params.get('orderId');
  const orderId = rawOrder && UUID.test(rawOrder) ? rawOrder : undefined; // only a well-formed id is ever sent
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [values, setValues] = useState({ subject: '', body: '', category: orderId ? 'ORDER' : 'OTHER' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setServerError('');
    const result = validate(ticketSchema, { ...values, ...(orderId ? { orderId } : {}) });
    setErrors(result.errors);
    if (!result.ok) return;
    try {
      const ticket = await createTicket(result.values).unwrap();
      navigate(`/support/${ticket.id}`, { replace: true });
    } catch (err) {
      setServerError(apiErrorMessage(err, t));
    }
  }

  return (
    <AuthCard title={t('support.newTicket')} subtitle={orderId ? t('support.linkedOrder', { id: orderId.slice(0, 8).toUpperCase() }) : undefined}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <TextField label={t('support.subject')} maxLength={140} value={values.subject} error={errors.subject && t(errors.subject)} onChange={e => setValues(v => ({ ...v, subject: e.target.value }))} />
        <SelectField label={t('support.category')} value={values.category} onChange={e => setValues(v => ({ ...v, category: e.target.value }))} options={TICKET_CATEGORIES.map(c => ({ value: c, label: t(`support.categories.${c}`) }))} />
        <div>
          <label htmlFor="ticket-body" className="mb-1 block text-sm font-medium text-text-primary">{t('support.message')}</label>
          <textarea id="ticket-body" rows={5} maxLength={4000} value={values.body} aria-invalid={errors.body ? true : undefined} aria-describedby="ticket-body-hint" onChange={e => setValues(v => ({ ...v, body: e.target.value }))} className={`w-full rounded-xl border bg-surface px-3 py-2 text-text-primary ${errors.body ? 'border-danger' : 'border-border'}`} />
          <p id="ticket-body-hint" className={`mt-1 text-xs ${errors.body ? 'text-danger' : 'text-text-secondary'}`} role={errors.body ? 'alert' : undefined}>{errors.body ? t(errors.body) : t('support.messageHint')}</p>
        </div>
        <Button type="submit" className="w-full" loading={isLoading}>{t('support.submit')}</Button>
      </form>
    </AuthCard>
  );
}
