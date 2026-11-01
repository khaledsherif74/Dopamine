import { describe, it, expect } from 'vitest';
import { en } from '../src/i18n/en.js';
import { ar } from '../src/i18n/ar.js';
import { FAQ_IDS } from '../src/features/help/faq.js';
import { ticketTone, TICKET_STATUSES } from '../src/features/support/ticketStatus.js';

describe('help center content', () => {
  it('every FAQ id has a question and an answer in English and Arabic', () => {
    for (const id of FAQ_IDS) {
      for (const dict of [en, ar]) {
        expect(typeof dict.faq[id]?.q).toBe('string');
        expect(dict.faq[id].q.length).toBeGreaterThan(5);
        expect(typeof dict.faq[id]?.a).toBe('string');
        expect(dict.faq[id].a.length).toBeGreaterThan(20);
      }
    }
  });
  it('ids are unique and there are no orphaned dictionary entries', () => {
    expect(new Set(FAQ_IDS).size).toBe(FAQ_IDS.length);
    expect(Object.keys(en.faq).sort()).toEqual([...FAQ_IDS].sort());
    expect(Object.keys(ar.faq).sort()).toEqual([...FAQ_IDS].sort());
  });
  it('the FAQ ids match what the backend serves to customers', () => {
    // GET /support/faq also lists supplier_pending / driver_pending, which are not for customers
    expect(FAQ_IDS).not.toContain('supplier_pending');
    expect(FAQ_IDS).not.toContain('driver_pending');
  });
});

describe('tickets', () => {
  it('every backend status and category has a label in both languages', () => {
    for (const dict of [en, ar]) {
      for (const s of TICKET_STATUSES) expect(typeof dict.support.status[s]).toBe('string');
      for (const c of ['ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'REFUND', 'OTHER']) expect(typeof dict.support.categories[c]).toBe('string');
    }
  });
  it('status tones', () => {
    expect(ticketTone('RESOLVED')).toBe('success');
    expect(ticketTone('CLOSED')).toBe('neutral');
    expect(ticketTone('IN_PROGRESS')).toBe('primary');
    expect(ticketTone('OPEN')).toBe('warning');
  });
});
