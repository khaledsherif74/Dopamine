import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate, formatTime, formatDateTime, formatClock, formatRating } from '../src/format/index.js';

describe('formatMoney', () => {
  it('formats EGP in English', () => {
    const s = formatMoney(1234.5, 'en');
    expect(s).toContain('EGP');
    expect(s).toContain('1,234.50');
  });
  it('uses Arabic-Indic digits in Arabic', () => {
    expect(/[٠-٩]/.test(formatMoney(120, 'ar'))).toBe(true);
  });
  it('never prints NaN: bad input is zero', () => {
    for (const v of [undefined, null, 'abc', NaN]) expect(formatMoney(v, 'en')).toContain('0.00');
  });
});

describe('dates', () => {
  it('returns empty text for invalid dates', () => {
    for (const fn of [formatDate, formatTime, formatDateTime]) {
      expect(fn('not a date')).toBe('');
      expect(fn(undefined)).toBe('');
    }
  });
  it('formats valid dates', () => {
    expect(formatDate('2026-10-22T10:30:00Z', 'en')).toContain('2026');
    expect(formatDateTime(new Date('2026-10-22T10:30:00Z'), 'en').length).toBeGreaterThan(8);
  });
  it('formatClock handles HH:mm and rejects junk', () => {
    expect(formatClock('08:30', 'en')).toMatch(/8:30/);
    expect(formatClock('25', 'en')).toBe('');
    expect(formatClock(null, 'en')).toBe('');
  });
  it('formatRating gives one decimal', () => {
    expect(formatRating(4.25, 'en')).toBe('4.3');
    expect(formatRating(null, 'en')).toBe('');
  });
});
