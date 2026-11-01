import { Link, useParams } from 'react-router-dom';
import { Alert, Badge, Card, ChatThread, ErrorView, LoadingView, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useAuth } from '@/lib/hooks.js';
import { useDocumentTitle } from '@/lib/useDocumentTitle.js';
import { useTicketThread } from '@/features/support/useTicketThread.js';
import { ticketTone } from '@/features/support/ticketStatus.js';
import { shortId } from '@/features/orders/status.js';

export function TicketPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const thread = useTicketThread({ ticketId: id, myId: user?.id });
  const { ticket } = thread;
  useDocumentTitle(ticket?.subject ?? '');

  if (thread.loading) return <LoadingView label={t('common.loading')} />;
  if (!ticket) return <ErrorView message={thread.error || t('support.notFound')} />;

  const closed = ticket.status === 'CLOSED';
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <Link to="/support" className="text-sm font-semibold text-primary"><span aria-hidden="true" className="inline-block rtl:rotate-180">←</span> {t('support.title')}</Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-text-primary">{ticket.subject}</h1>
          <Badge tone={ticketTone(ticket.status)}>{t(`support.status.${ticket.status}`)}</Badge>
        </div>
        <p className="text-xs text-text-secondary">
          {t('support.ticketNumber', { id: shortId(ticket.id) })} · {t(`support.categories.${ticket.category}`)}
          {ticket.assignedAgent?.name ? ` · ${t('support.assigned', { name: ticket.assignedAgent.name })}` : ''}
        </p>
        {ticket.orderId ? <Link to={`/orders/${ticket.orderId}`} className="text-sm text-primary underline">{t('support.linkedOrder', { id: shortId(ticket.orderId) })}</Link> : null}
      </header>

      {ticket.resolution && (ticket.status === 'RESOLVED' || closed) ? <Card><p className="text-sm font-semibold text-text-primary">{t('support.resolution')}</p><p className="text-sm text-text-secondary">{ticket.resolution}</p></Card> : null}
      {ticket.status === 'RESOLVED' ? <Alert tone="info">{t('support.resolvedNote')}</Alert> : null}

      <ChatThread
        messages={thread.messages}
        isMine={thread.isMine}
        authorName={m => (m.authorRole === 'SUPPORT' ? `${t('support.author')} · ${m.authorName}` : m.authorName)}
        error={thread.error}
        onSend={async body => {
          try {
            await thread.send(body);
          } catch (err) {
            throw new Error(apiErrorMessage(err, t));
          }
        }}
        canWrite={!closed}
        readOnlyText={t('support.closedNote')}
        typing={thread.typing}
        onTyping={thread.notifyTyping}
        label={t('support.thread')}
        maxLength={4000}
        inputId="ticket-input"
      />
    </div>
  );
}
