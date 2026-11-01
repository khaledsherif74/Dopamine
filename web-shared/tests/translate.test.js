import { describe, it, expect } from 'vitest';
import { translate, interpolate, mergeDictionaries, pickInitialLang, directionOf } from '../src/i18n/translate.js';
import { sharedEn, sharedAr } from '../src/i18n/dictionaries.js';

const dicts = { en: { a: { b: 'Hello {{name}}', only: 'English only' } }, ar: { a: { b: 'مرحبا {{name}}' } } };

describe('translate', () => {
  it('looks up nested keys and interpolates', () => {
    expect(translate(dicts, 'en', 'a.b', { name: 'Sam' })).toBe('Hello Sam');
    expect(translate(dicts, 'ar', 'a.b', { name: 'سام' })).toBe('مرحبا سام');
  });
  it('falls back to English, then to the key', () => {
    expect(translate(dicts, 'ar', 'a.only')).toBe('English only');
    expect(translate(dicts, 'ar', 'missing.key')).toBe('missing.key');
    expect(translate(dicts, 'en', 'a')).toBe('a'); // a namespace is not a string
  });
  it('interpolate leaves unknown params empty and tolerates spaces', () => {
    expect(interpolate('{{ n }} items', { n: 3 })).toBe('3 items');
    expect(interpolate('Hi {{who}}', {})).toBe('Hi ');
    expect(interpolate('plain')).toBe('plain');
  });
});

describe('mergeDictionaries', () => {
  it('deep-merges per language; later sources win', () => {
    const merged = mergeDictionaries({ en: { x: { a: '1', b: '2' } } }, { en: { x: { b: 'B' }, y: 'Y' }, ar: { x: { a: 'أ' } } });
    expect(merged.en).toEqual({ x: { a: '1', b: 'B' }, y: 'Y' });
    expect(merged.ar).toEqual({ x: { a: 'أ' } });
  });
});

describe('language helpers', () => {
  it('picks stored language, else the browser language, else English', () => {
    expect(pickInitialLang('ar', 'en-US')).toBe('ar');
    expect(pickInitialLang(null, 'ar-EG')).toBe('ar');
    expect(pickInitialLang('fr', 'en-US')).toBe('en');
    expect(pickInitialLang(undefined, undefined)).toBe('en');
  });
  it('Arabic is right-to-left', () => {
    expect(directionOf('ar')).toBe('rtl');
    expect(directionOf('en')).toBe('ltr');
  });
});

describe('shared dictionaries', () => {
  const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
  it('Arabic has exactly the same keys as English', () => {
    expect(keys(sharedAr).sort()).toEqual(keys(sharedEn).sort());
  });
  it('every order status the backend can send has a label', () => {
    for (const s of ['PENDING', 'ACCEPTED', 'REJECTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']) {
      expect(typeof sharedEn.orderStatus[s]).toBe('string');
      expect(typeof sharedAr.orderStatus[s]).toBe('string');
    }
  });
});
