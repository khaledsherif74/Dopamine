import { describe, it, expect } from 'vitest';
import {
  weightOf, compareTickets, sortTickets, matchesFilter, toQueryParams, DEFAULT_FILTER,
  applyTicketCreated, applyTicketUpdated, applyTicketMessage, markTicketRead, unreadTotal,
} from '../src/features/queue/ticketQueue.js';

const T = (id, over = {}) => ({
  id, subject: `Subject ${id}`, category: 'ORDER', priority: 'NORMAL', priorityWeight: 2, status: 'OPEN',
  assignedAgentId: null, assignedAgent: null, createdAt: '2026-11-01T10:00:00.000Z', lastMessageAt: '2026-11-01T10:00:00.000Z', unreadCount: 0, ...over,
});
const state = (...tickets) => ({ tickets, total: tickets.length });
const ids = s => s.tickets.map(t => t.id);
const F = over => ({ ...DEFAULT_FILTER, ...over });

describe('ordering: priority weight first, then most recent', () => {
  it('weights', () => {
    expect([weightOf('LOW'), weightOf('NORMAL'), weightOf('HIGH'), weightOf('URGENT')]).toEqual([1, 2, 3, 4]);
    expect(weightOf('???')).toBe(2);
  });
  it('urgent old beats normal new; same priority -> newer first; stable tie on id', () => {
    const urgentOld = T('u', { priority: 'URGENT', priorityWeight: 4, lastMessageAt: '2026-10-01T00:00:00Z' });
    const normalNew = T('n', { lastMessageAt: '2026-11-05T00:00:00Z' });
    const normalOlder = T('o', { lastMessageAt: '2026-11-02T00:00:00Z' });
    expect(sortTickets([normalOlder, normalNew, urgentOld]).map(t => t.id)).toEqual(['u', 'n', 'o']);
    const a = T('a'); const b = T('b');
    expect(compareTickets(a, b)).toBeLessThan(0);
    expect(compareTickets(b, a)).toBeGreaterThan(0);
  });
  it('does not mutate its input and uses priority when priorityWeight is missing', () => {
    const list = [T('x', { priority: 'HIGH', priorityWeight: undefined }), T('y')];
    const copy = [...list];
    expect(sortTickets(list).map(t => t.id)).toEqual(['x', 'y']);
    expect(list).toEqual(copy);
  });
});

describe('filters', () => {
  it('tabs', () => {
    const mine = T('m', { assignedAgentId: 'me' });
    const other = T('o', { assignedAgentId: 'else' });
    const free = T('f');
    expect(matchesFilter(free, F({ tab: 'unassigned' }), 'me')).toBe(true);
    expect(matchesFilter(mine, F({ tab: 'unassigned' }), 'me')).toBe(false);
    expect(matchesFilter(mine, F({ tab: 'mine' }), 'me')).toBe(true);
    expect(matchesFilter(other, F({ tab: 'mine' }), 'me')).toBe(false);
    expect(matchesFilter(other, F({ tab: 'all' }), 'me')).toBe(true);
  });
  it('status: ACTIVE = open + in progress, ANY = everything, else exact', () => {
    const f = s => F({ tab: 'all', status: s });
    expect(matchesFilter(T('a', { status: 'IN_PROGRESS' }), f('ACTIVE'), 'me')).toBe(true);
    expect(matchesFilter(T('a', { status: 'RESOLVED' }), f('ACTIVE'), 'me')).toBe(false);
    expect(matchesFilter(T('a', { status: 'CLOSED' }), f('ANY'), 'me')).toBe(true);
    expect(matchesFilter(T('a', { status: 'RESOLVED' }), f('RESOLVED'), 'me')).toBe(true);
    expect(matchesFilter(T('a', { status: 'OPEN' }), f('RESOLVED'), 'me')).toBe(false);
  });
  it('priority, category and search (subject contains, id prefix, case-insensitive)', () => {
    const t = T('abc123', { subject: 'Cake arrived LATE', priority: 'HIGH', category: 'DELIVERY' });
    const f = o => F({ tab: 'all', ...o });
    expect(matchesFilter(t, f({ priority: 'HIGH' }), 'me')).toBe(true);
    expect(matchesFilter(t, f({ priority: 'LOW' }), 'me')).toBe(false);
    expect(matchesFilter(t, f({ category: 'DELIVERY' }), 'me')).toBe(true);
    expect(matchesFilter(t, f({ category: 'PAYMENT' }), 'me')).toBe(false);
    expect(matchesFilter(t, f({ search: ' late ' }), 'me')).toBe(true);
    expect(matchesFilter(t, f({ search: 'ABC1' }), 'me')).toBe(true);
    expect(matchesFilter(t, f({ search: 'bc12' }), 'me')).toBe(false);
  });
  it('partial mode ignores what a bare event cannot tell (subject/category/search)', () => {
    const bare = { id: 'z', status: 'OPEN', priority: 'NORMAL', assignedAgentId: null };
    expect(matchesFilter(bare, F({ search: 'cake', category: 'PAYMENT' }), 'me', { partial: true })).toBe(true);
    expect(matchesFilter(bare, F({ priority: 'HIGH' }), 'me', { partial: true })).toBe(false);
  });
});

describe('query params for GET /support-agent/tickets', () => {
  it('maps tabs to assignee and drops empty / ANY values', () => {
    expect(toQueryParams(F({ tab: 'unassigned' }), 1)).toEqual({ assignee: 'unassigned', status: 'ACTIVE', page: 1, limit: 30 });
    expect(toQueryParams(F({ tab: 'mine', status: 'ANY' }), 2, 10)).toEqual({ assignee: 'me', page: 2, limit: 10 });
    expect(toQueryParams(F({ tab: 'all', status: 'RESOLVED', priority: 'URGENT', category: 'REFUND', search: '  x ' }), 1))
      .toEqual({ assignee: 'all', status: 'RESOLVED', priority: 'URGENT', category: 'REFUND', search: 'x', page: 1, limit: 30 });
  });
  it('clamps search to the 100 chars the server accepts and ignores blank search', () => {
    expect(toQueryParams(F({ search: 'a'.repeat(150) }), 1).search.length).toBe(100);
    expect('search' in toQueryParams(F({ search: '   ' }), 1)).toBe(false);
  });
});

describe('support:ticket_created', () => {
  const evt = { ticketId: 'new', subject: 'Help', category: 'PAYMENT', priority: 'URGENT', status: 'OPEN', createdAt: '2026-11-07T09:00:00Z', ownerRole: 'USER', ownerId: 'u1' };
  it('inserts in priority order with an unread dot and counts it', () => {
    const out = applyTicketCreated(state(T('a'), T('b')), evt, F({ tab: 'unassigned' }), 'me');
    expect(ids(out)).toEqual(['new', 'a', 'b']);
    expect(out.total).toBe(3);
    expect(out.tickets[0]).toMatchObject({ id: 'new', priorityWeight: 4, unreadCount: 1, assignedAgentId: null, lastMessageAt: '2026-11-07T09:00:00Z' });
  });
  it('is idempotent (a REST refetch may already hold it)', () => {
    const s = state(T('new'), T('a'));
    expect(applyTicketCreated(s, evt, F({ tab: 'all' }), 'me')).toBe(s);
  });
  it('is ignored when it cannot match the current view', () => {
    const s = state(T('a', { assignedAgentId: 'me' }));
    expect(applyTicketCreated(s, evt, F({ tab: 'mine' }), 'me')).toBe(s);
    expect(applyTicketCreated(s, evt, F({ tab: 'all', category: 'ORDER' }), 'me')).toBe(s);
    expect(applyTicketCreated(s, evt, F({ tab: 'all', search: 'zzz' }), 'me')).toBe(s);
  });
});

describe('ticket:updated', () => {
  const upd = (over = {}) => ({ ticketId: 'a', status: 'IN_PROGRESS', priority: 'NORMAL', assignedAgentId: 'me', assignedAgent: { id: 'me', name: 'Me' }, resolution: null, resolvedAt: null, ...over });
  it('merges assignment + status in place', () => {
    const out = applyTicketUpdated(state(T('a'), T('b')), upd(), F({ tab: 'all' }), 'me');
    expect(out.tickets.find(t => t.id === 'a')).toMatchObject({ status: 'IN_PROGRESS', assignedAgentId: 'me', assignedAgent: { name: 'Me' } });
    expect(out.refetch).toBe(false);
  });
  it('removes a ticket that stopped matching (taken by someone else leaves Unassigned)', () => {
    const out = applyTicketUpdated(state(T('a'), T('b')), upd({ assignedAgentId: 'other', assignedAgent: { id: 'other', name: 'O' } }), F({ tab: 'unassigned' }), 'me');
    expect(ids(out)).toEqual(['b']);
    expect(out.total).toBe(1);
  });
  it('resolved leaves the ACTIVE view', () => {
    const out = applyTicketUpdated(state(T('a', { assignedAgentId: 'me' })), upd({ status: 'RESOLVED', resolution: 'ok', resolvedAt: '2026-11-07T10:00:00Z' }), F({ tab: 'mine' }), 'me');
    expect(ids(out)).toEqual([]);
  });
  it('priority change re-sorts using the new weight', () => {
    const out = applyTicketUpdated(state(T('a'), T('b', { lastMessageAt: '2026-11-09T00:00:00Z' })), upd({ priority: 'HIGH', assignedAgentId: null, assignedAgent: null, status: 'OPEN' }), F({ tab: 'all' }), 'me');
    expect(ids(out)).toEqual(['a', 'b']);
    expect(out.tickets[0].priorityWeight).toBe(3);
  });
  it('keeps the known assignee name when the event carries only the id (agent reply path)', () => {
    const s = state(T('a', { assignedAgentId: 'x', assignedAgent: { id: 'x', name: 'Xavier' } }));
    const out = applyTicketUpdated(s, upd({ assignedAgentId: 'x', assignedAgent: null }), F({ tab: 'all' }), 'me');
    expect(out.tickets[0].assignedAgent).toEqual({ id: 'x', name: 'Xavier' });
  });
  it('unassigning clears the name', () => {
    const s = state(T('a', { assignedAgentId: 'x', assignedAgent: { id: 'x', name: 'X' } }));
    const out = applyTicketUpdated(s, upd({ assignedAgentId: null, assignedAgent: null }), F({ tab: 'all' }), 'me');
    expect(out.tickets[0].assignedAgent).toBeNull();
  });
  it('an unknown ticket that could belong in this view asks for a refetch; one that cannot does not', () => {
    const s = state(T('b'));
    expect(applyTicketUpdated(s, upd({ ticketId: 'ghost', assignedAgentId: null, status: 'OPEN' }), F({ tab: 'unassigned' }), 'me')).toMatchObject({ refetch: true, tickets: s.tickets });
    expect(applyTicketUpdated(s, upd({ ticketId: 'ghost' }), F({ tab: 'unassigned' }), 'me').refetch).toBe(false);
  });
});

describe('support:ticket_message', () => {
  const msg = (over = {}) => ({ ticketId: 'a', messageId: 'm1', authorRole: 'USER', authorId: 'u1', createdAt: '2026-11-08T00:00:00Z', ...over });
  it('a customer message bumps recency + unread and moves the ticket up its priority band', () => {
    const s = state(T('b', { lastMessageAt: '2026-11-03T00:00:00Z' }), T('a'));
    const out = applyTicketMessage(s, msg(), null, 'me');
    expect(ids(out)).toEqual(['a', 'b']);
    expect(out.tickets[0]).toMatchObject({ unreadCount: 1, lastMessageAt: '2026-11-08T00:00:00Z', lastMessageId: 'm1' });
  });
  it('no unread dot for the ticket the agent is looking at, nor for an agent message', () => {
    expect(applyTicketMessage(state(T('a')), msg(), 'a', 'me').tickets[0].unreadCount).toBe(0);
    expect(applyTicketMessage(state(T('a')), msg({ authorRole: 'SUPPORT' }), null, 'me').tickets[0].unreadCount).toBe(0);
  });
  it('the same message delivered twice is counted once', () => {
    const once = applyTicketMessage(state(T('a')), msg(), null, 'me');
    const twice = applyTicketMessage(once, msg(), null, 'me');
    expect(twice).toBe(once);
    expect(twice.tickets[0].unreadCount).toBe(1);
  });
  it('unreads accumulate across different messages; a ticket outside the loaded pages is ignored', () => {
    let s = applyTicketMessage(state(T('a')), msg(), null, 'me');
    s = applyTicketMessage(s, msg({ messageId: 'm2' }), null, 'me');
    expect(s.tickets[0].unreadCount).toBe(2);
    const untouched = state(T('b'));
    expect(applyTicketMessage(untouched, msg(), null, 'me')).toBe(untouched);
  });
  it('an old message never moves lastMessageAt backwards', () => {
    const s = state(T('a', { lastMessageAt: '2026-11-09T00:00:00Z' }));
    expect(applyTicketMessage(s, msg({ createdAt: '2026-11-01T00:00:00Z' }), null, 'me').tickets[0].lastMessageAt).toBe('2026-11-09T00:00:00Z');
  });
});

describe('read tracking', () => {
  it('markTicketRead clears one ticket; unreadTotal sums dots', () => {
    const s = state(T('a', { unreadCount: 2 }), T('b', { unreadCount: 1 }));
    expect(unreadTotal(s.tickets)).toBe(3);
    const out = markTicketRead(s, 'a');
    expect(out.tickets.map(t => t.unreadCount)).toEqual([0, 1]);
    expect(markTicketRead(out, 'a')).toBe(out);
    expect(markTicketRead(out, 'nope')).toBe(out);
  });
});
