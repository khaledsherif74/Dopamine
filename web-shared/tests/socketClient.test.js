import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSocketClient } from '../src/socket/socketClient.js';

function fakeSocketFactory() {
  const handlers = {};
  const emitted = [];
  const socket = {
    connected: false,
    on: (e, f) => { (handlers[e] ||= []).push(f); },
    off: (e, f) => { handlers[e] = (handlers[e] || []).filter(x => x !== f); },
    emit: (...args) => { emitted.push(args); },
    connect: vi.fn(() => { socket.connected = true; fire('connect'); }),
    disconnect: vi.fn(() => { socket.connected = false; }),
  };
  const fire = (e, payload) => (handlers[e] || []).slice().forEach(f => f(payload));
  const factory = vi.fn((url, opts) => { factory.opts = opts; return socket; });
  return { socket, factory, fire, emitted, handlers };
}

describe('createSocketClient', () => {
  let h; let token; let refresh; let client;
  beforeEach(() => {
    h = fakeSocketFactory();
    token = 'T1';
    refresh = vi.fn(async () => { token = 'T2'; return 'T2'; });
    client = createSocketClient({ url: 'http://x', getToken: () => token, refreshAccessToken: refresh, ioFactory: h.factory, retryCooldownMs: 1000 });
  });

  it('sends the CURRENT token on every (re)connect via the auth callback', () => {
    client.getSocket();
    let sent;
    h.factory.opts.auth(d => { sent = d; });
    expect(sent).toEqual({ token: 'T1' });
    token = 'T9';
    h.factory.opts.auth(d => { sent = d; });
    expect(sent).toEqual({ token: 'T9' });
    expect(h.factory.opts).toMatchObject({ transports: ['websocket'], withCredentials: true });
  });

  it('creates one socket lazily and reuses it', () => {
    client.subscribeOrder('o1', () => {});
    client.subscribeOrder('o2', () => {});
    expect(h.factory.mock.calls.length).toBe(1);
  });

  it('order: joins on connect, re-joins after a reconnect, filters by orderId, leaves on unsubscribe', () => {
    const got = [];
    const off = client.subscribeOrder('o1', p => got.push(p));
    h.socket.connected = true; h.fire('connect');
    expect(h.emitted).toContainEqual(['join_order', 'o1']);
    h.emitted.length = 0;
    h.fire('connect'); // reconnect
    expect(h.emitted).toContainEqual(['join_order', 'o1']);

    h.fire('order:status_changed', { orderId: 'o1', status: 'ACCEPTED' });
    h.fire('order:status_changed', { orderId: 'other', status: 'READY' });
    expect(got).toEqual([{ orderId: 'o1', status: 'ACCEPTED' }]);

    off();
    expect(h.emitted).toContainEqual(['leave_order', 'o1']);
    h.fire('order:status_changed', { orderId: 'o1', status: 'READY' });
    expect(got.length).toBe(1);
    h.emitted.length = 0; h.fire('connect');
    expect(h.emitted.length).toBe(0); // no longer re-joined
  });

  it('ticket: joins with an ack, filters events by ticketId, exposes typing/read helpers', () => {
    const msgs = []; const typing = []; const joined = [];
    const sub = client.subscribeTicket('t1', { onMessage: m => msgs.push(m), onTyping: m => typing.push(m), onJoined: a => joined.push(a) });
    h.socket.connected = true; h.fire('connect');
    const join = h.emitted.find(e => e[0] === 'ticket:join');
    expect(join[1]).toEqual({ ticketId: 't1' });
    join[2]({ ok: true });
    expect(joined).toEqual([{ ok: true }]);

    h.fire('ticket:message', { ticketId: 't1', body: 'hi' });
    h.fire('ticket:message', { ticketId: 't2', body: 'not mine' });
    h.fire('ticket:typing', { ticketId: 't1', role: 'SUPPORT', isTyping: true });
    expect(msgs).toEqual([{ ticketId: 't1', body: 'hi' }]);
    expect(typing.length).toBe(1);

    sub.typing(true); sub.read();
    expect(h.emitted).toContainEqual(['ticket:typing', { ticketId: 't1', isTyping: true }]);
    expect(h.emitted).toContainEqual(['ticket:read', { ticketId: 't1' }]);
    sub.unsubscribe();
    expect(h.emitted).toContainEqual(['ticket:leave', { ticketId: 't1' }]);
  });

  it('order chat: filters by order AND channel', () => {
    const got = [];
    const sub = client.subscribeOrderChat('o1', 'DRIVER', { onMessage: m => got.push(m) });
    h.socket.connected = true; h.fire('connect');
    expect(h.emitted.find(e => e[0] === 'order_chat:join')[1]).toEqual({ orderId: 'o1', channel: 'DRIVER' });
    h.fire('order_chat:message', { orderId: 'o1', channel: 'DRIVER', body: 'mine' });
    h.fire('order_chat:message', { orderId: 'o1', channel: 'SUPPLIER', body: 'other channel' });
    h.fire('order_chat:message', { orderId: 'o2', channel: 'DRIVER', body: 'other order' });
    expect(got.map(m => m.body)).toEqual(['mine']);
    sub.typing(false);
    expect(h.emitted).toContainEqual(['order_chat:typing', { orderId: 'o1', channel: 'DRIVER', isTyping: false }]);
  });

  it('auth_expired -> refresh the token, then reconnect', async () => {
    client.getSocket();
    h.fire('auth_expired');
    await Promise.resolve(); await Promise.resolve();
    expect(refresh).toHaveBeenCalled();
    expect(h.socket.disconnect).toHaveBeenCalled();
    expect(h.socket.connect).toHaveBeenCalled();
  });

  it('auth_expired with a failed refresh does not reconnect', async () => {
    refresh.mockResolvedValue(null);
    client.getSocket();
    h.fire('auth_expired');
    await Promise.resolve(); await Promise.resolve();
    expect(h.socket.connect).not.toHaveBeenCalled();
  });

  it('connect_error "unauthorized" retries once per cool-down; other errors do not', async () => {
    client.getSocket();
    h.fire('connect_error', new Error('xhr poll error'));
    expect(refresh).not.toHaveBeenCalled();
    h.fire('connect_error', new Error('unauthorized'));
    h.fire('connect_error', new Error('unauthorized'));
    await Promise.resolve();
    expect(refresh.mock.calls.length).toBe(1);
  });

  it('disconnect() closes the socket and forgets subscriptions', () => {
    client.subscribeOrder('o1', () => {});
    client.disconnect();
    expect(h.socket.disconnect).toHaveBeenCalled();
    client.subscribeOrder('o2', () => {});
    expect(h.factory.mock.calls.length).toBe(2); // a fresh socket is created
  });

  it('notification subscription', () => {
    const got = [];
    client.onNotification(n => got.push(n));
    h.fire('notification:new', { id: 'n1' });
    expect(got).toEqual([{ id: 'n1' }]);
  });
});
