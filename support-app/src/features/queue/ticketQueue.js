// Pure queue logic for the agent ticket list. No React, no I/O: every live event is applied
// to the already-loaded list so the UI never has to refetch for ordinary activity.
//
// state = { tickets: Ticket[], total: number }   (Ticket = a row of GET /support-agent/tickets)

export const PRIORITY_WEIGHT = { LOW: 1, NORMAL: 2, HIGH: 3, URGENT: 4 };
export const OPEN_STATUSES = ['OPEN', 'IN_PROGRESS'];
export const TABS = ['unassigned', 'mine', 'all'];
export const STATUS_FILTERS = ['ACTIVE', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ANY'];
export const DEFAULT_FILTER = { tab: 'unassigned', status: 'ACTIVE', priority: '', category: '', search: '' };
const SEARCH_MAX = 100;

export const weightOf = priority => PRIORITY_WEIGHT[priority] ?? PRIORITY_WEIGHT.NORMAL;

const recency = t => Date.parse(t.lastMessageAt ?? t.updatedAt ?? t.createdAt) || 0;
const ticketWeight = t => t.priorityWeight ?? weightOf(t.priority);

// Same order as the server: priorityWeight desc, then lastMessageAt desc (id only breaks ties).
export function compareTickets(a, b) {
  return ticketWeight(b) - ticketWeight(a) || recency(b) - recency(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}
export const sortTickets = tickets => [...tickets].sort(compareTickets);

/**
 * Does a ticket belong in the view described by `filter`?
 * `partial` is for live events that carry no subject/category: those two checks are skipped.
 */
export function matchesFilter(t, filter, myId, { partial = false } = {}) {
  if (filter.tab === 'unassigned' && t.assignedAgentId) return false;
  if (filter.tab === 'mine' && t.assignedAgentId !== myId) return false;
  if (filter.status === 'ACTIVE' && !OPEN_STATUSES.includes(t.status)) return false;
  if (filter.status && filter.status !== 'ACTIVE' && filter.status !== 'ANY' && t.status !== filter.status) return false;
  if (filter.priority && t.priority !== filter.priority) return false;
  if (partial) return true;
  if (filter.category && t.category !== filter.category) return false;
  const q = (filter.search ?? '').trim().toLowerCase();
  if (q && !(String(t.subject ?? '').toLowerCase().includes(q) || String(t.id).toLowerCase().startsWith(q))) return false;
  return true;
}

// Query string for GET /support-agent/tickets.
export function toQueryParams(filter, page = 1, limit = 30) {
  const params = { assignee: filter.tab === 'mine' ? 'me' : filter.tab === 'unassigned' ? 'unassigned' : 'all' };
  if (filter.status && filter.status !== 'ANY') params.status = filter.status;
  if (filter.priority) params.priority = filter.priority;
  if (filter.category) params.category = filter.category;
  const search = (filter.search ?? '').trim().slice(0, SEARCH_MAX);
  if (search) params.search = search;
  params.page = page;
  params.limit = limit;
  return params;
}

// ---- live events -------------------------------------------------------------------------

// support:ticket_created
export function applyTicketCreated(state, evt, filter, myId) {
  if (state.tickets.some(t => t.id === evt.ticketId)) return state;
  const ticket = {
    id: evt.ticketId,
    subject: evt.subject,
    category: evt.category,
    priority: evt.priority,
    priorityWeight: weightOf(evt.priority),
    status: evt.status,
    createdAt: evt.createdAt,
    lastMessageAt: evt.createdAt,
    assignedAgentId: null,
    assignedAgent: null,
    ownerRole: evt.ownerRole,
    ownerId: evt.ownerId,
    unreadCount: 1,
  };
  if (!matchesFilter(ticket, filter, myId)) return state;
  return { tickets: sortTickets([ticket, ...state.tickets]), total: state.total + 1 };
}

// ticket:updated -> { tickets, total, refetch }
export function applyTicketUpdated(state, evt, filter, myId) {
  const current = state.tickets.find(t => t.id === evt.ticketId);
  if (!current) {
    // Not loaded: we cannot build a row from this event. Ask for a refetch only if it could belong here.
    const bare = { id: evt.ticketId, status: evt.status, priority: evt.priority, assignedAgentId: evt.assignedAgentId ?? null };
    return { ...state, refetch: matchesFilter(bare, filter, myId, { partial: true }) };
  }
  const assignedAgentId = evt.assignedAgentId ?? null;
  const assignedAgent = !assignedAgentId
    ? null
    : evt.assignedAgent ?? (current.assignedAgent?.id === assignedAgentId ? current.assignedAgent : null);
  const merged = {
    ...current,
    status: evt.status,
    priority: evt.priority,
    priorityWeight: weightOf(evt.priority),
    assignedAgentId,
    assignedAgent,
    resolution: evt.resolution ?? null,
    resolvedAt: evt.resolvedAt ?? null,
  };
  if (!matchesFilter(merged, filter, myId)) {
    return { tickets: state.tickets.filter(t => t.id !== evt.ticketId), total: Math.max(0, state.total - 1), refetch: false };
  }
  return { tickets: sortTickets(state.tickets.map(t => (t.id === evt.ticketId ? merged : t))), total: state.total, refetch: false };
}

// support:ticket_message. A ticket outside the loaded pages is ignored on purpose: a refetch per
// message anywhere in the system would be far more expensive than the rare missed re-ordering.
export function applyTicketMessage(state, evt, openTicketId, _myId) {
  const current = state.tickets.find(t => t.id === evt.ticketId);
  if (!current || (evt.messageId && current.lastMessageId === evt.messageId)) return state;
  const fromCustomer = evt.authorRole !== 'SUPPORT';
  const lookingAtIt = evt.ticketId === openTicketId;
  const newer = Date.parse(evt.createdAt) > recency(current);
  const next = {
    ...current,
    lastMessageId: evt.messageId ?? current.lastMessageId,
    lastMessageAt: newer ? evt.createdAt : current.lastMessageAt,
    unreadCount: (current.unreadCount ?? 0) + (fromCustomer && !lookingAtIt ? 1 : 0),
  };
  return { ...state, tickets: sortTickets(state.tickets.map(t => (t.id === evt.ticketId ? next : t))) };
}

export function markTicketRead(state, ticketId) {
  const current = state.tickets.find(t => t.id === ticketId);
  if (!current || !current.unreadCount) return state;
  return { ...state, tickets: state.tickets.map(t => (t.id === ticketId ? { ...t, unreadCount: 0 } : t)) };
}

export const unreadTotal = tickets => tickets.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
