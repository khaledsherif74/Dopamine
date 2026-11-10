import { useEffect, useRef, useState } from 'react';
import { Alert } from './Alert.jsx';
import { Button } from './Button.jsx';
import { LoadingView } from './states.jsx';
import { useI18n } from '../i18n/I18nProvider.jsx';
import { formatTime } from '../format/index.js';
import { lastSeenIndex } from '../chat/messages.js';

/**
 * Presentational chat used by order chat and support tickets.
 *  messages      oldest-first, each { id, body, createdAt, readAt }
 *  isMine(m)     is this message mine?     authorName(m)  display name of the sender
 *  onSend(body)  returns a promise (rejects with an Error whose .message is shown)
 *  canWrite      false -> composer hidden, `readOnlyText` shown instead
 */
export function ChatThread({
  messages, isMine, authorName, loading = false, error = '', hasOlder = false, onLoadOlder,
  onSend, canWrite = true, readOnlyText = '', typing = false, onTyping, label, maxLength = 1000, inputId = 'chat-input',
  multiline = false, insert = null,
}) {
  const { t, lang } = useI18n();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const seenAt = lastSeenIndex(messages, isMine);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages.length]);

  // `insert` = { nonce, text }: a new nonce appends the text to the draft (canned replies) and focuses the box.
  const insertNonce = insert?.nonce;
  const insertText = insert?.text;
  useEffect(() => {
    if (insertNonce === undefined || !insertText) return;
    setText(prev => `${prev ? `${prev}\n` : ''}${insertText}`.slice(0, maxLength));
    inputRef.current?.focus?.();
  }, [insertNonce, insertText, maxLength]);

  async function submit(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    if (body.length > maxLength) return setSendError(t('chat.tooLong', { max: maxLength }));
    setSending(true);
    setSendError('');
    try {
      await onSend(body);
      setText('');
    } catch (err) {
      setSendError(err?.message || t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingView label={t('common.loading')} />;
  if (error && messages.length === 0) return <Alert tone="warning">{error}</Alert>;

  return (
    <div className="flex flex-col gap-3">
      {hasOlder ? (
        <Button variant="ghost" size="sm" onClick={onLoadOlder}>
          {t('chat.loadOlder')}
        </Button>
      ) : null}

      <div role="log" aria-live="polite" aria-label={label} className="flex max-h-96 min-h-40 flex-col gap-2 overflow-y-auto rounded-2xl border border-border bg-surface-alt p-3">
        {messages.length === 0 ? <p className="m-auto text-sm text-text-secondary">{t('chat.empty')}</p> : null}
        {messages.map((m, i) => {
          const mine = isMine(m);
          return (
            <div key={m.id} className={`flex max-w-[85%] flex-col ${mine ? 'items-end self-end' : 'items-start self-start'}`}>
              <div className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-text-inverse' : 'bg-surface text-text-primary'}`}>{m.body}</div>
              <span className="mt-0.5 text-[11px] text-text-secondary">
                {mine ? t('chat.you') : authorName(m)} · {formatTime(m.createdAt, lang)}
                {mine && i === seenAt ? ` · ${t('chat.seen')}` : ''}
              </span>
            </div>
          );
        })}
        {typing ? <p className="self-start text-xs italic text-text-secondary">{t('chat.typing')}</p> : null}
        <div ref={endRef} />
      </div>

      {!canWrite && readOnlyText ? <Alert tone="info">{readOnlyText}</Alert> : null}
      {sendError ? <Alert tone="danger">{sendError}</Alert> : null}
      {canWrite ? (
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            {t('chat.placeholder')}
          </label>
          {multiline ? (
            <textarea
              id={inputId}
              ref={inputRef}
              rows={3}
              value={text}
              maxLength={maxLength}
              onChange={e => {
                setText(e.target.value);
                onTyping?.(e.target.value.length > 0);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e);
              }}
              onBlur={() => onTyping?.(false)}
              placeholder={t('chat.placeholder')}
              className="min-w-0 flex-1 resize-y rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-text-primary"
            />
          ) : (
            <input
              id={inputId}
              ref={inputRef}
              value={text}
              maxLength={maxLength}
              onChange={e => {
                setText(e.target.value);
                onTyping?.(e.target.value.length > 0);
              }}
              onBlur={() => onTyping?.(false)}
              placeholder={t('chat.placeholder')}
              className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-primary"
            />
          )}
          <Button type="submit" loading={sending} disabled={!text.trim()} className="self-end rounded-full">
            {t('chat.send')}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
