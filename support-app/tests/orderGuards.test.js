import { describe, it, expect } from 'vitest';
import {
  canForceCancel, needsRefundDecision, refundableRemaining, buildForceCancelBody, canReassignDriver, FORCE_CANCEL_STATUSES,
} from '../src/features/orders/orderGuards.js';

const order = (status, over = {}) => ({ id: 'o1', status, total: 120, payment: { id: 'p1', method: 'CARD', status: 'PAID', amount: 120 }, delivery: null, ...over });

describe('force-cancel eligibility (mirrors order.service.forceCancel)', () => {
  it('allowed statuses', () => {
    expect(FORCE_CANCEL_STATUSES).toEqual(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']);
    for (const s of FORCE_CANCEL_STATUSES) expect(canForceCancel(order(s))).toBe(true);
  });
  it('terminal orders cannot be cancelled', () => {
    for (const s of ['DELIVERED', 'CANCELLED', 'REJECTED']) expect(canForceCancel(order(s))).toBe(false);
    expect(canForceCancel(null)).toBe(false);
  });
});

describe('does the agent have to choose a refund?', () => {
  it('yes for online payments that were paid (also partially refunded)', () => {
    expect(needsRefundDecision(order('PREPARING'))).toBe(true);
    expect(needsRefundDecision(order('PREPARING', { payment: { method: 'WALLET', status: 'PARTIALLY_REFUNDED', amount: 50 } }))).toBe(true);
  });
  it('no for cash, unpaid, failed, fully refunded, or no payment', () => {
    expect(needsRefundDecision(order('PENDING', { payment: { method: 'CASH', status: 'PENDING', amount: 50 } }))).toBe(false);
    expect(needsRefundDecision(order('PENDING', { payment: { method: 'CARD', status: 'PENDING', amount: 50 } }))).toBe(false);
    expect(needsRefundDecision(order('PENDING', { payment: { method: 'CARD', status: 'FAILED', amount: 50 } }))).toBe(false);
    expect(needsRefundDecision(order('PENDING', { payment: { method: 'CARD', status: 'REFUNDED', amount: 50 } }))).toBe(false);
    expect(needsRefundDecision(order('PENDING', { payment: null }))).toBe(false);
  });
  it('cash is never refunded online, even when its payment row says PAID', () => {
    expect(needsRefundDecision(order('OUT_FOR_DELIVERY', { payment: { method: 'CASH', status: 'PAID', amount: 50 } }))).toBe(false);
  });
});

describe('refundableRemaining', () => {
  const pay = { id: 'p1', amount: 120 };
  it('subtracts REQUESTED / APPROVED / PROCESSING / COMPLETED refunds, ignores REJECTED / FAILED', () => {
    const refunds = [
      { status: 'COMPLETED', amount: 20 }, { status: 'REQUESTED', amount: 10 }, { status: 'APPROVED', amount: 5 },
      { status: 'PROCESSING', amount: 5 }, { status: 'REJECTED', amount: 99 }, { status: 'FAILED', amount: 99 },
    ];
    expect(refundableRemaining(pay, refunds)).toBe(80);
  });
  it('cent-exact and never negative', () => {
    expect(refundableRemaining({ amount: 0.3 }, [{ status: 'COMPLETED', amount: 0.1 }, { status: 'COMPLETED', amount: 0.2 }])).toBe(0);
    expect(refundableRemaining({ amount: 10 }, [{ status: 'COMPLETED', amount: 12 }])).toBe(0);
    expect(refundableRemaining(null, [])).toBe(0);
    expect(refundableRemaining(pay, undefined)).toBe(120);
  });
});

describe('force-cancel request body (mirrors forceCancelSchema + service rules)', () => {
  const paid = order('PREPARING');
  const cash = order('PENDING', { payment: { method: 'CASH', status: 'PENDING', amount: 50 } });
  it('reason is required, 3..300, trimmed', () => {
    expect(buildForceCancelBody({ reason: ' ' }, cash).errors.reason).toBe('orders.errors.reasonRequired');
    expect(buildForceCancelBody({ reason: 'ab' }, cash).errors.reason).toBe('orders.errors.reasonRequired');
    expect(buildForceCancelBody({ reason: 'x'.repeat(301) }, cash).errors.reason).toBe('orders.errors.reasonTooLong');
    expect(buildForceCancelBody({ reason: '  Shop closed ' }, cash)).toEqual({ ok: true, body: { reason: 'Shop closed' }, errors: {} });
  });
  it('cash / unpaid: no refund object at all', () => {
    expect('refund' in buildForceCancelBody({ reason: 'Shop closed', decision: 'FULL' }, cash).body).toBe(false);
  });
  it('paid online: a decision is required', () => {
    expect(buildForceCancelBody({ reason: 'Shop closed' }, paid).errors.decision).toBe('orders.errors.decisionRequired');
    expect(buildForceCancelBody({ reason: 'Shop closed', decision: 'BOGUS' }, paid).errors.decision).toBe('orders.errors.decisionRequired');
  });
  it('FULL / NONE carry no amount', () => {
    expect(buildForceCancelBody({ reason: 'Shop closed', decision: 'FULL', amount: '5' }, paid).body).toEqual({ reason: 'Shop closed', refund: { type: 'FULL' } });
    expect(buildForceCancelBody({ reason: 'Shop closed', decision: 'NONE' }, paid).body).toEqual({ reason: 'Shop closed', refund: { type: 'NONE' } });
  });
  it('PARTIAL needs an amount > 0, 2 dp, within what is left', () => {
    const b = (amount, remaining = 120) => buildForceCancelBody({ reason: 'Shop closed', decision: 'PARTIAL', amount }, paid, { remaining });
    expect(b('').errors.amount).toBe('orders.errors.amount');
    expect(b('0').errors.amount).toBe('orders.errors.amount');
    expect(b('2.555').errors.amount).toBe('orders.errors.amount');
    expect(b('120.01').errors.amount).toBe('orders.errors.amountTooHigh');
    expect(b('40.5').body).toEqual({ reason: 'Shop closed', refund: { type: 'PARTIAL', amount: 40.5 } });
    expect(b('120').ok).toBe(true);
  });
});

describe('driver reassignment', () => {
  const withDelivery = (status, dStatus) => order(status, { delivery: { id: 'd1', status: dStatus, driver: { id: 'dr1' } } });
  it('only while there is a live delivery on a live order', () => {
    expect(canReassignDriver(withDelivery('READY', 'ASSIGNED'))).toBe(true);
    expect(canReassignDriver(withDelivery('OUT_FOR_DELIVERY', 'PICKED_UP'))).toBe(true);
    expect(canReassignDriver(withDelivery('READY', 'UNASSIGNED'))).toBe(true);
  });
  it('never without a delivery, after delivery, or on a cancelled order', () => {
    expect(canReassignDriver(order('READY'))).toBe(false);
    expect(canReassignDriver(withDelivery('DELIVERED', 'DELIVERED'))).toBe(false);
    expect(canReassignDriver(withDelivery('CANCELLED', 'CANCELLED'))).toBe(false);
    expect(canReassignDriver(withDelivery('OUT_FOR_DELIVERY', 'DELIVERED'))).toBe(false);
    expect(canReassignDriver(null)).toBe(false);
  });
});
