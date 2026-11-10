import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Button, ChatThread, ErrorView, LoadingView, Modal, apiErrorMessage, formatDateTime, useI18n } from '@dopamine/web-shared';
import { useAssignTicketMutation, useUpdateTicketMutation } from '@/api/endpoints.js';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { useAgentTicket } from '@/features/tickets/useAgentTicket.js';
import { priorityTone, ticketTone } from '@/features/tickets/ticketStatus.js';
import { useCanned } from '@/features/canned/useCanned.js';
import { CannedPicker } from '@/components/CannedPicker.jsx';
import { OwnerPanel } from '@/components/OwnerPanel.jsx';

const RESOLUTION_MAX = 1000;

function ResolveDialog({ open, onClose, onConfirm, busy, error }) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={t('ticket.resolveTitle')} closeLabel={t('common.close')}>
      <div className="space-y-3">
        <label htmlFor="resolution" className="block text-sm font-medium text-text-primary">{t('ticket.resolution')}</label>
        <textarea id="resolution" rows={4} maxLength={RESOLUTION_MAX} value={text} onChange={e => setText(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
        <p className="text-xs text-text-secondary">{t('ticket.resolutionHint')}</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={busy} onClick={() => onConfirm(text.trim())}>{t('ticket.markResolved')}</Button>
        </div>
      </div>
    </Modal>
  );
}

export function TicketPage() {
  const { t, lang } = useI18n();
  const { ticketId } = useParams();
  const { user } = useAuth();
  const canned = useCanned();
  const [insert, setInsert] = useState(null);
  const [actionError, setActionError] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [assign, { isLoading: assigning }] = useAssignTicketMutation();
  const [update, { isLoading: updating }] = useUpdateTicketMutation();
  const th = useAgentTicket({ ticketId });
  const { ticket } = th;
  useDocumentTitle(ticket?.subject);

  if (th.loading) return <LoadingView label={t('common.loading')} />;
  if (!ticket) return <ErrorView message={th.error || t('errors.notFound')} retryLabel={t('common.retry')} onRetry={th.reload} />;

  const mine = ticket.assignedAgentId === user.id;
  const closed = ticket.status === 'CLOSED';
  const takenByOther = !!ticket.assignedAgentId && !mine;

  async function run(fn) {
    setActionError('');
    try {
      await fn();
      await th.reload();
      return true;
    } catch (err) {
      setActionError(apiErrorMessage(err, t));
      return false;
    }
  }
  const setStatus = (status, resolution) => run(() => update({ id: ticketId, status, resolution }).unwrap());

  return (
    <div className="space-y-4">
      <Link to="/tickets" className="text-sm font-semibold text-primary">← {t('ticket.back')}</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="text-sm text-text-secondary">#{ticket.id.slice(0, 8)} · {t(`category.${ticket.category}`)} · {formatDateTime(ticket.createdAt, lang)}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge tone={priorityTone(ticket.priority)}>{t(`priority.${ticket.priority}`)}</Badge>
          <Badge tone={ticketTone(ticket.status)}>{t(`ticketStatus.${ticket.status}`)}</Badge>
        </div>
      </div>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
      {takenByOther ? <Alert tone="info">{t('ticket.takenBy', { name: ticket.assignedAgent?.name ?? '—' })}</Alert> : null}
      {ticket.status === 'RESOLVED' && ticket.resolution ? <Alert tone="success">{t('ticket.resolvedWith', { text: ticket.resolution })}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        {!ticket.assignedAgentId && !closed ? <Button size="sm" loading={assigning} onClick={() => run(() => assign({ id: ticketId }).unwrap())}>{t('ticket.takeIt')}</Button> : null}
        {takenByOther && !closed ? <Button size="sm" variant="outline" loading={assigning} onClick={() => run(() => assign({ id: ticketId }).unwrap())}>{t('ticket.takeOver')}</Button> : null}
        {ticket.status === 'OPEN' ? <Button size="sm" variant="outline" loading={updating} onClick={() => setStatus('IN_PROGRESS')}>{t('ticket.markInProgress')}</Button> : null}
        {ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' ? <Button size="sm" variant="outline" onClick={() => setResolveOpen(true)}>{t('ticket.markResolved')}</Button> : null}
        {ticket.status !== 'CLOSED' ? <Button size="sm" variant="ghost" loading={updating} onClick={() => setStatus('CLOSED')}>{t('ticket.close')}</Button> : null}
        {ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? <Button size="sm" variant="outline" loading={updating} onClick={() => setStatus('OPEN')}>{t('ticket.reopen')}</Button> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label={t('ticket.conversation')} className="space-y-3">
          <ChatThread
            messages={th.messages}
            isMine={m => m.authorRole === 'SUPPORT' && m.authorId === user.id}
            authorName={m => m.authorName || t(`roles.${m.authorRole}`)}
            canWrite={!closed}
            readOnlyText={t('ticket.closedNotice')}
            typing={th.typing}
            onTyping={th.notifyTyping}
            label={t('ticket.conversation')}
            maxLength={4000}
            multiline
            insert={insert}
            inputId="agent-reply"
            onSend={async body => {
              try {
                await th.send(body);
              } catch (err) {
                throw new Error(apiErrorMessage(err, t));
              }
            }}
          />
          {!closed ? <CannedPicker list={canned.list} onPick={text => setInsert({ nonce: Date.now(), text })} /> : null}
          {!closed ? <p className="text-xs text-text-secondary">{t('ticket.sendHint')}</p> : null}
        </section>
        <aside aria-label={t('ticket.details')}><OwnerPanel ticket={ticket} /></aside>
      </div>

      <ResolveDialog
        key={resolveOpen ? 'open' : 'closed'}
        open={resolveOpen}
        busy={updating}
        onClose={() => setResolveOpen(false)}
        onConfirm={async resolution => { if (await setStatus('RESOLVED', resolution)) setResolveOpen(false); }}
      />
    </div>
  );
}
