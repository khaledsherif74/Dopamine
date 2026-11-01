import { describe, it, expect, beforeEach } from 'vitest';
import { readJson, writeJson, readString, writeString, remove } from '../src/utils/storage.js';

function installStorage(impl) {
  globalThis.window = { localStorage: impl };
}
const memory = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };

describe('storage helpers', () => {
  beforeEach(() => installStorage(memory()));

  it('round-trips JSON and strings', () => {
    expect(writeJson('k', { a: 1 })).toBe(true);
    expect(readJson('k')).toEqual({ a: 1 });
    writeString('s', 'x');
    expect(readString('s')).toBe('x');
    remove('s');
    expect(readString('s', 'fallback')).toBe('fallback');
  });
  it('corrupt JSON gives the fallback instead of throwing', () => {
    window.localStorage.setItem('bad', '{not json');
    expect(readJson('bad', 'fb')).toBe('fb');
  });
  it('never throws when storage is blocked or full', () => {
    installStorage({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } });
    expect(readJson('k', 'fb')).toBe('fb');
    expect(writeJson('k', 1)).toBe(false);
    expect(writeString('k', 'v')).toBe(false);
    expect(() => remove('k')).not.toThrow();
  });
  it('works without a window (SSR / tests)', () => {
    delete globalThis.window;
    expect(readJson('k', 'fb')).toBe('fb');
    expect(writeJson('k', 1)).toBe(false);
  });
});
