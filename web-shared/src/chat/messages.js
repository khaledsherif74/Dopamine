// Chat message helpers shared by order chat and support tickets. Messages differ in shape
// (senderId / authorId), so "is this mine?" is passed in as a function: isMine(message).
const time = m => new Date(m.createdAt).getTime() || 0;

// Oldest-first, de-duplicated by id; a newer copy of a message wins (e.g. it gained readAt).
export function mergeMessages(existing, incoming) {
  const byId = new Map(existing.map(m => [m.id, m]));
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m });
  return [...byId.values()].sort((a, b) => time(a) - time(b) || String(a.id).localeCompare(String(b.id)));
}

// my messages the other side has read -> marked locally when a read receipt arrives
export function markMineRead(messages, isMine, at = new Date().toISOString()) {
  return messages.map(m => (isMine(m) && !m.readAt ? { ...m, readAt: at } : m));
}

export const unreadFromOthers = (messages, isMine) => messages.filter(m => !isMine(m) && !m.readAt).length;

// index of the last of MY messages that was read (for a single "Seen" marker)
export function lastSeenIndex(messages, isMine) {
  let idx = -1;
  messages.forEach((m, i) => {
    if (isMine(m) && m.readAt) idx = i;
  });
  return idx;
}

// createdAt of the newest message: the `after=` cursor for catching up after a reconnect
export function newestCreatedAt(messages) {
  let best = null;
  for (const m of messages) if (!best || time(m) > time(best)) best = m;
  return best?.createdAt ?? null;
}
