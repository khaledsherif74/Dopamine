import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sharedDictionaries } from '../../web-shared/src/i18n/dictionaries.js';
import { mergeDictionaries } from '../../web-shared/src/i18n/translate.js';
import { en } from '../src/i18n/en.js';
import { ar } from '../src/i18n/ar.js';

const merged = mergeDictionaries(sharedDictionaries, { en, ar });
const flat = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const has = (dict, key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), dict) !== undefined;
const interp = s => [...String(s).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]).sort().join(',');
const get = (dict, key) => key.split('.').reduce((o, k) => o[k], dict);

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : /\.jsx?$/.test(f) && files.push(p); } })(SRC);
const source = files.map(f => fs.readFileSync(f, 'utf8')).join('\n');

// The values every `${...}` placeholder can take, for the dynamic keys the code builds.
const DYNAMIC = {
  'chat.': ['driver'],
  'driver.status.': ['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'],
  'earnings.preset.': ['today', '7d', '30d', 'month', 'all'],
  'jobs.blocked.': ['notApproved', 'offline'],
  'jobs.empty.': ['available.title', 'available.message', 'mine.title', 'mine.message'],
  'jobs.status.': ['ASSIGNED', 'PICKED_UP'],
  'jobs.tab.': ['available', 'mine'],
  'language.': ['en', 'ar'],
  'theme.': ['light', 'dark', 'system'],
  'support.categories.': ['ORDER', 'PAYMENT', 'DELIVERY', 'ACCOUNT', 'REFUND', 'OTHER'],
  'support.status.': ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
};

const staticKeys = new Set([...source.matchAll(/\bt\(\s*'([^']+)'/g)].map(m => m[1]));
for (const m of source.matchAll(/'((?:validation|profile|earnings)\.errors\.[A-Za-z]+)'/g)) staticKeys.add(m[1]);
for (const m of source.matchAll(/'(validation\.[A-Za-z]+)'/g)) staticKeys.add(m[1]);
const dynamicPrefixes = new Set([...source.matchAll(/\bt\(\s*`([^`$]*)\$\{/g)].map(m => m[1]));

describe('translations', () => {
  it('every static key used in the code exists in English and Arabic', () => {
    const missing = [];
    for (const k of staticKeys) for (const lang of ['en', 'ar']) if (!has(merged[lang], k)) missing.push(`${lang}:${k}`);
    expect(missing).toEqual([]);
  });
  it('every dynamic key family is known to this test and fully translated', () => {
    const unknown = [...dynamicPrefixes].filter(p => !DYNAMIC[p]);
    expect(unknown).toEqual([]);
    const missing = [];
    for (const p of dynamicPrefixes) for (const v of DYNAMIC[p] ?? []) for (const lang of ['en', 'ar']) if (!has(merged[lang], p + v)) missing.push(`${lang}:${p}${v}`);
    expect(missing).toEqual([]);
  });
  it('every chat read-only reason the server can return to a driver has text in both languages', () => {
    const reasons = ['NO_DRIVER_ASSIGNED', 'DELIVERY_NOT_ACTIVE', 'ORDER_CLOSED', 'CHAT_EXPIRED', 'READ_ONLY_ROLE', 'NOT_PARTICIPANT'];
    const missing = reasons.flatMap(r => ['en', 'ar'].filter(l => !has(merged[l], `chat.reason.${r}`)).map(l => `${l}:${r}`));
    expect(missing).toEqual([]);
  });
  it('the app dictionaries have identical keys in both languages', () => {
    const e = flat(en).sort();
    const a = flat(ar).sort();
    expect(a.filter(k => !e.includes(k))).toEqual([]);
    expect(e.filter(k => !a.includes(k))).toEqual([]);
  });
  it('Arabic keeps the same {{placeholders}} as English and no value is empty', () => {
    const bad = [];
    for (const k of flat(en)) {
      if (interp(get(en, k)) !== interp(get(ar, k))) bad.push(k);
      if (!String(get(ar, k)).trim() || !String(get(en, k)).trim()) bad.push(`empty:${k}`);
    }
    expect(bad).toEqual([]);
  });
  it('the code never builds a key from a placeholder this test does not enumerate', () => {
    const rest = [...source.matchAll(/\bt\(\s*`[^`]*`/g)].map(m => m[0]).filter(x => !x.includes('${') );
    expect(rest).toEqual([]);
  });
});
