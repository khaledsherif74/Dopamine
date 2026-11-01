import { describe, it, expect } from 'vitest';
import { en } from '../src/i18n/en.js';
import { ar } from '../src/i18n/ar.js';

const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const placeholders = s => (String(s).match(/\{\{\s*\w+\s*\}\}/g) || []).map(p => p.replace(/\s/g, '')).sort();
const flat = (obj, prefix = '') => Object.fromEntries(Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? Object.entries(flat(v, `${prefix}${k}.`)) : [[`${prefix}${k}`, v]])));

describe('web-user dictionaries', () => {
  it('Arabic has exactly the same keys as English', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it('every {{placeholder}} survives translation', () => {
    const e = flat(en); const a = flat(ar);
    const broken = Object.keys(e).filter(k => JSON.stringify(placeholders(e[k])) !== JSON.stringify(placeholders(a[k])));
    expect(broken).toEqual([]);
  });
  it('no empty strings', () => {
    expect(Object.values(flat(en)).filter(v => !String(v).trim())).toEqual([]);
    expect(Object.values(flat(ar)).filter(v => !String(v).trim())).toEqual([]);
  });
});
