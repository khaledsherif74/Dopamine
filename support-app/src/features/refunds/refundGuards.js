import { parseAmount, toCents } from '../../lib/money.js';

export const REFUND_STATUSES = ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED'];
const NOTE_MAX = 500;
const REJECT_MIN = 3;

// Mirrors refund.service: approve/reject need REQUESTED; execute needs an online (ORIGINAL)
// refund in APPROVED or FAILED; manual-complete needs a MANUAL refund in APPROVED.
export function refundActions(refund) {
  const status = refund?.status;
  const method = refund?.method;
  return {
    approve: status === 'REQUESTED',
    reject: status === 'REQUESTED',
    execute: method === 'ORIGINAL' && (status === 'APPROVED' || status === 'FAILED'),
    manualComplete: method === 'MANUAL' && status === 'APPROVED',
  };
}

const result = (body, errors) => ({ ok: Object.keys(errors).length === 0, body, errors });

export function buildApproveBody({ note = '', amount = '' } = {}, { remaining } = {}) {
  const errors = {};
  const body = {};
  const n = String(note).trim();
  if (n.length > NOTE_MAX) errors.note = 'refunds.errors.noteTooLong';
  else if (n) body.note = n;
  if (String(amount).trim() !== '') {
    const value = parseAmount(amount);
    if (value === null) errors.amount = 'refunds.errors.amount';
    else if (remaining !== undefined && toCents(value) > toCents(remaining)) errors.amount = 'refunds.errors.amountTooHigh';
    else body.amount = value;
  }
  return result(body, errors);
}

export function buildRejectBody({ note = '' } = {}) {
  const n = String(note).trim();
  const errors = {};
  if (n.length < REJECT_MIN) errors.note = 'refunds.errors.reasonRequired';
  else if (n.length > NOTE_MAX) errors.note = 'refunds.errors.noteTooLong';
  return result({ note: n }, errors);
}

export function buildManualBody({ note = '' } = {}) {
  const n = String(note).trim();
  const errors = {};
  if (n.length > NOTE_MAX) errors.note = 'refunds.errors.noteTooLong';
  return result(n ? { note: n } : {}, errors);
}

export function refundTone(status) {
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'REJECTED') return 'neutral';
  if (status === 'PROCESSING' || status === 'APPROVED') return 'primary';
  return 'warning';
}
