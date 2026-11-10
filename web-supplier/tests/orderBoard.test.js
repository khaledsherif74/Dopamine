import { describe, it, expect } from 'vitest';
import { availableActions, primaryAction, boardColumn, groupBoard, buildRejectBody, buildCancelBody, minutesSince, paymentBlocksAccept } from '../src/features/orders/orderBoard.js';

const pay = (method = 'CARD', status = 'PAID') => ({ method, status, amount: 50 });
const O = (status, over = {}) => ({ id: `o-${status}`, status, createdAt: '2026-11-01T10:00:00Z', scheduledFor: null, payment: pay(), ...over });
const on = o => Object.entries(availableActions(o)).filter(([, v]) => v).map(([k]) => k);

describe('what the shop may do with an order (mirrors order.service)', () => {
  it('PENDING + paid online or cash: accept / reject', () => {
    expect(on(O('PENDING'))).toEqual(['accept', 'reject']);
    expect(on(O('PENDING', { payment: pay('CASH', 'PENDING') }))).toEqual(['accept', 'reject']);
  });
  it('PENDING but online payment not completed: reject only (the server refuses accept)', () => {
    expect(on(O('PENDING', { payment: pay('CARD', 'PENDING') }))).toEqual(['reject']);
    expect(paymentBlocksAccept(O('PENDING', { payment: pay('CARD', 'PENDING') }))).toBe(true);
    expect(paymentBlocksAccept(O('PENDING'))).toBe(false);
    expect(on(O('PENDING', { payment: null }))).toEqual(['reject']);
  });
  it('ACCEPTED: start preparing / cancel', () => expect(on(O('ACCEPTED'))).toEqual(['startPreparing', 'cancel']));
  it('PREPARING: mark ready / cancel', () => expect(on(O('PREPARING'))).toEqual(['markReady', 'cancel']));
  it('READY, OUT_FOR_DELIVERY and terminal states: nothing (support handles those)', () => {
    for (const s of ['READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED']) expect(on(O(s))).toEqual([]);
    expect(on(null)).toEqual([]);
  });
  it('primary action is the next forward step', () => {
    expect(primaryAction(O('PENDING'))).toBe('accept');
    expect(primaryAction(O('PENDING', { payment: pay('CARD', 'PENDING') }))).toBeNull();
    expect(primaryAction(O('ACCEPTED'))).toBe('startPreparing');
    expect(primaryAction(O('PREPARING'))).toBe('markReady');
    expect(primaryAction(O('READY'))).toBeNull();
  });
});

describe('board columns', () => {
  it('maps every status', () => {
    expect(boardColumn('PENDING')).toBe('new');
    expect(boardColumn('ACCEPTED')).toBe('inProgress');
    expect(boardColumn('PREPARING')).toBe('inProgress');
    expect(boardColumn('READY')).toBe('handover');
    expect(boardColumn('OUT_FOR_DELIVERY')).toBe('handover');
    for (const s of ['DELIVERED', 'CANCELLED', 'REJECTED']) expect(boardColumn(s)).toBe('done');
    expect(boardColumn('???')).toBe('done');
  });
  it('new: longest waiting first; in progress / handover: earliest due first (scheduled time wins); done: newest first', () => {
    const g = groupBoard([
      O('PENDING', { id: 'n2', createdAt: '2026-11-01T10:10:00Z' }), O('PENDING', { id: 'n1', createdAt: '2026-11-01T10:00:00Z' }),
      O('ACCEPTED', { id: 'a-late', createdAt: '2026-11-01T09:00:00Z', scheduledFor: '2026-11-03T12:00:00Z' }),
      O('PREPARING', { id: 'p-soon', createdAt: '2026-11-01T11:00:00Z' }),
      O('READY', { id: 'r2', createdAt: '2026-11-01T12:00:00Z' }), O('OUT_FOR_DELIVERY', { id: 'r1', createdAt: '2026-11-01T08:00:00Z' }),
      O('DELIVERED', { id: 'd1', createdAt: '2026-10-30T00:00:00Z' }), O('CANCELLED', { id: 'd2', createdAt: '2026-10-31T00:00:00Z' }),
    ]);
    expect(g.new.map(o => o.id)).toEqual(['n1', 'n2']);
    expect(g.inProgress.map(o => o.id)).toEqual(['p-soon', 'a-late']);
    expect(g.handover.map(o => o.id)).toEqual(['r1', 'r2']);
    expect(g.done.map(o => o.id)).toEqual(['d2', 'd1']);
  });
  it('empty input gives four empty columns', () => expect(groupBoard(undefined)).toEqual({ new: [], inProgress: [], handover: [], done: [] }));
});

describe('request bodies', () => {
  it('reject: reason required (server: 1..300)', () => {
    expect(buildRejectBody({ reason: '  ' }).errors.reason).toBe('orders.errors.reasonRequired');
    expect(buildRejectBody({ reason: 'x'.repeat(301) }).errors.reason).toBe('orders.errors.reasonTooLong');
    expect(buildRejectBody({ reason: ' Out of stock ' })).toEqual({ ok: true, body: { reason: 'Out of stock' }, errors: {} });
  });
  it('cancel: reason 3..300 trimmed (server: supplierCancelSchema)', () => {
    expect(buildCancelBody({ reason: 'ab' }).errors.reason).toBe('orders.errors.reasonShort');
    expect(buildCancelBody({ reason: '' }).errors.reason).toBe('orders.errors.reasonShort');
    expect(buildCancelBody({ reason: 'x'.repeat(301) }).errors.reason).toBe('orders.errors.reasonTooLong');
    expect(buildCancelBody({ reason: ' Oven broke ' }).body).toEqual({ reason: 'Oven broke' });
  });
});

describe('minutesSince', () => {
  const now = new Date('2026-11-01T10:30:00Z');
  it('whole minutes, never negative, junk -> null', () => {
    expect(minutesSince('2026-11-01T10:00:00Z', now)).toBe(30);
    expect(minutesSince('2026-11-01T11:00:00Z', now)).toBe(0);
    expect(minutesSince('nope', now)).toBeNull();
    expect(minutesSince(null, now)).toBeNull();
  });
});
