import { ChatThread, apiErrorMessage, useI18n } from '@dopamine/web-shared';
import { useOrderChat } from '@/features/chat/useOrderChat.js';

export function OrderChat({ orderId, channel, myId }) {
  const { t } = useI18n();
  const chat = useOrderChat({ orderId, channel, myId });

  const reason = chat.access.joined && !chat.access.canWrite ? chat.access.reason : null;
  const reasonKey = reason ? `chat.reason.${reason}` : null;
  const readOnlyText = reason ? (t(reasonKey) === reasonKey ? t('chat.readOnly') : t(reasonKey)) : '';

  return (
    <ChatThread
      messages={chat.messages}
      isMine={chat.isMine}
      authorName={m => m.senderName}
      loading={chat.loading}
      error={chat.error}
      hasOlder={chat.hasOlder}
      onLoadOlder={chat.loadOlder}
      onSend={async body => {
        try {
          await chat.send(body);
        } catch (err) {
          throw new Error(apiErrorMessage(err, t)); // ChatThread shows the message
        }
      }}
      canWrite={chat.access.canWrite || !chat.access.joined}
      readOnlyText={readOnlyText}
      typing={chat.typing}
      onTyping={chat.notifyTyping}
      label={t(`chat.${channel.toLowerCase()}`)}
      inputId={`chat-${channel}`}
    />
  );
}
