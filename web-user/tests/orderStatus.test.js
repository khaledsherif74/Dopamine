import { describe, it, expect } from 'vitest';
import { TIMELINE, stepIndex, isTerminal, isFailed, isActive, statusTone, canPayNow, canReview, paymentOutcome, shortId } from '../src/features/orders/status.js';

describe('timeline + flags', () => {
  it('the happy path is ordered', () => {
    expect(TIMELINE).toEqual(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']);
    expect(stepIndex('PREPARING')).toBe(2);
    expect(stepIndex('CANCELLED')).toBe(-1);
  });
  it('terminal / failed / active', () => {
    for (const s of ['DELIVERED', 'CANCELLED', 'REJECTED']) expect(isTerminal(s)).toBe(true);
    expect(isTerminal('READY')).toBe(false);
    expect(isFailed('REJECTED')).toBe(true);
    expect(isFailed('DELIVERED')).toBe(false);
    expect(isActive({ status: 'READY' })).toBe(true);
    expect(isActive({ status: 'DELIVERED' })).toBe(false);
    expect(isActive(null)).toBe(false);
  });
  it('tones', () => {
    expect(statusTone('DELIVERED')).toBe('success');
    expect(statusTone('REJECTED')).toBe('danger');
    expect(statusTone('PENDING')).toBe('warning');
    expect(statusTone('PREPARING')).toBe('primary');
  });
});

describe('canPayNow', () => {
  const o = (status, payment) => ({ status, payment });
  it('online order still waiting for money', () => {
    expect(canPayNow(o('PENDING', { method: 'CARD', status: 'PENDING' }))).toBe(true);
    expect(canPayNow(o('PENDING', { method: 'WALLET', status: 'FAILED' }))).toBe(true);
    expect(canPayNow(o('PENDING', null))).toBe(true);
  });
  it('not for paid, cash, or non-pending orders', () => {
    expect(canPayNow(o('PENDING', { method: 'CARD', status: 'PAID' }))).toBe(false);
    expect(canPayNow(o('PENDING', { method: 'CASH', status: 'PENDING' }))).toBe(false);
    expect(canPayNow(o('ACCEPTED', { method: 'CARD', status: 'PENDING' }))).toBe(false);
    expect(canPayNow(o('CANCELLED', null))).toBe(false);
    expect(canPayNow(undefined)).toBe(false);
  });
});

describe('canReview / paymentOutcome / shortId', () => {
  it('review only once, only after delivery', () => {
    expect(canReview({ status: 'DELIVERED', review: null })).toBe(true);
    expect(canReview({ status: 'DELIVERED', review: { id: 'r' } })).toBe(false);
    expect(canReview({ status: 'READY', review: null })).toBe(false);
  });
  it('payment outcomes', () => {
    expect(paymentOutcome({ method: 'CARD', status: 'PAID' })).toBe('paid');
    expect(paymentOutcome({ method: 'CARD', status: 'REFUNDED' })).toBe('paid');
    expect(paymentOutcome({ method: 'CARD', status: 'FAILED' })).toBe('failed');
    expect(paymentOutcome({ method: 'WALLET', status: 'PENDING' })).toBe('pending');
    expect(paymentOutcome({ method: 'CASH', status: 'PENDING' })).toBe('cash');
    expect(paymentOutcome(null)).toBe('unknown');
  });
  it('short ids', () => {
    expect(shortId('abcdef12-3456')).toBe('ABCDEF12');
    expect(shortId(undefined)).toBe('');
  });
});
