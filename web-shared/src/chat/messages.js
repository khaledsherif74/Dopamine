const time = (m) => new Date(m.createdAt).getTime() || 0;

export function mergeMessages(existing, incoming) {
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m });
  return [...byId.values()].sort(
    (a, b) => time(a) - time(b) || String(a.id).localeCompare(String(b.id)),
  );
}

export function markMineRead(messages, isMine, at = new Date().toISOString()) {
  return messages.map((m) =>
    isMine(m) && !m.readAt ? { ...m, readAt: at } : m,
  );
}

export const unreadFromOthers = (messages, isMine) =>
  messages.filter((m) => !isMine(m) && !m.readAt).length;

export function lastSeenIndex(messages, isMine) {
  let idx = -1;
  messages.forEach((m, i) => {
    if (isMine(m) && m.readAt) idx = i;
  });
  return idx;
}

export function newestCreatedAt(messages) {
  let best = null;
  for (const m of messages) if (!best || time(m) > time(best)) best = m;
  return best?.createdAt ?? null;
}
