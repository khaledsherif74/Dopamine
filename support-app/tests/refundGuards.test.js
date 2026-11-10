import { describe, it, expect } from 'vitest';
import { refundActions, buildApproveBody, buildRejectBody, buildManualBody, refundTone, REFUND_STATUSES } from '../src/features/refunds/refundGuards.js';

const R = (status, method = 'ORIGINAL', over = {}) => ({ id: 'r1', status, method, amount: 100, ...over });
const acts = r => Object.entries(refundActions(r)).filter(([, v]) => v).map(([k]) => k);

describe('which refund actions the UI offers (mirrors refund.service guards)', () => {
  it('REQUESTED: approve / reject only', () => expect(acts(R('REQUESTED'))).toEqual(['approve', 'reject']));
  it('APPROVED online refund: execute only', () => expect(acts(R('APPROVED'))).toEqual(['execute']));
  it('APPROVED manual (cash) refund: manual-complete only', () => expect(acts(R('APPROVED', 'MANUAL'))).toEqual(['manualComplete']));
  it('FAILED online refund can be retried (execute)', () => expect(acts(R('FAILED'))).toEqual(['execute']));
  it('FAILED manual refund offers nothing (server only completes APPROVED)', () => expect(acts(R('FAILED', 'MANUAL'))).toEqual([]));
  it('PROCESSING / COMPLETED / REJECTED offer nothing', () => {
    for (const s of ['PROCESSING', 'COMPLETED', 'REJECTED']) expect(acts(R(s))).toEqual([]);
  });
  it('unknown / missing refund is safe', () => {
    expect(acts(null)).toEqual([]);
    expect(acts({ status: 'WHAT' })).toEqual([]);
  });
});

describe('request bodies (mirror the Joi schemas)', () => {
  it('approve: note optional (trimmed, <=500), amount optional (>0, 2 dp, <= remaining)', () => {
    expect(buildApproveBody({})).toEqual({ ok: true, body: {}, errors: {} });
    expect(buildApproveBody({ note: '  ok  ', amount: '45.5' }, { remaining: 100 }).body).toEqual({ note: 'ok', amount: 45.5 });
    expect(buildApproveBody({ amount: '0' }).errors.amount).toBe('refunds.errors.amount');
    expect(buildApproveBody({ amount: '-3' }).ok).toBe(false);
    expect(buildApproveBody({ amount: '1.234' }).errors.amount).toBe('refunds.errors.amount');
    expect(buildApproveBody({ amount: 'abc' }).errors.amount).toBe('refunds.errors.amount');
    expect(buildApproveBody({ amount: '100.01' }, { remaining: 100 }).errors.amount).toBe('refunds.errors.amountTooHigh');
    expect(buildApproveBody({ amount: '100' }, { remaining: 100 }).ok).toBe(true);
    expect(buildApproveBody({ note: 'x'.repeat(501) }).errors.note).toBe('refunds.errors.noteTooLong');
  });
  it('approve: float-safe cap', () => {
    expect(buildApproveBody({ amount: '0.3' }, { remaining: 0.30000000000000004 }).ok).toBe(true);
  });
  it('reject: reason required, 3..500', () => {
    expect(buildRejectBody({ note: '' }).errors.note).toBe('refunds.errors.reasonRequired');
    expect(buildRejectBody({ note: ' ab ' }).errors.note).toBe('refunds.errors.reasonRequired');
    expect(buildRejectBody({ note: ' Not eligible ' })).toEqual({ ok: true, body: { note: 'Not eligible' }, errors: {} });
    expect(buildRejectBody({ note: 'x'.repeat(501) }).errors.note).toBe('refunds.errors.noteTooLong');
  });
  it('manual-complete: optional note <=500', () => {
    expect(buildManualBody({ note: '' }).body).toEqual({});
    expect(buildManualBody({ note: 'paid cash' }).body).toEqual({ note: 'paid cash' });
    expect(buildManualBody({ note: 'x'.repeat(501) }).ok).toBe(false);
  });
});

describe('status tones', () => {
  it('covers every backend status', () => {
    expect(REFUND_STATUSES).toEqual(['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED']);
    expect(refundTone('COMPLETED')).toBe('success');
    expect(refundTone('FAILED')).toBe('danger');
    expect(refundTone('REJECTED')).toBe('neutral');
    expect(refundTone('REQUESTED')).toBe('warning');
    expect(refundTone('PROCESSING')).toBe('primary');
  });
});
