import { describe, it, expect } from 'vitest';
import { normalizeCanned, addCanned, removeCanned, updateCanned, MAX_CANNED, MAX_BODY, MAX_TITLE, filterCanned } from '../src/features/canned/canned.js';

describe('canned replies (stored in localStorage, so read defensively)', () => {
  it('normalize drops junk, trims, caps length and count, de-duplicates ids', () => {
    const raw = [{ id: 'a', title: ' Hi ', body: ' Hello ' }, null, 5, { id: 'b', title: '', body: 'x' }, { id: 'c', title: 't', body: '' }, { id: 'a', title: 'dup', body: 'dup' }, { id: 7, title: 'n', body: 'n' }];
    const out = normalizeCanned(raw);
    expect(out.map(r => r.id)).toEqual(['a']);
    expect(out[0]).toEqual({ id: 'a', title: 'Hi', body: 'Hello' });
    expect(normalizeCanned('nope')).toEqual([]);
    expect(normalizeCanned(undefined)).toEqual([]);
    const many = Array.from({ length: MAX_CANNED + 5 }, (_, i) => ({ id: `i${i}`, title: 't', body: 'b' }));
    expect(normalizeCanned(many).length).toBe(MAX_CANNED);
    expect(normalizeCanned([{ id: 'l', title: 'x'.repeat(MAX_TITLE + 9), body: 'y'.repeat(MAX_BODY + 9) }])[0].title.length).toBe(MAX_TITLE);
    expect(normalizeCanned([{ id: 'l', title: 'x', body: 'y'.repeat(MAX_BODY + 9) }])[0].body.length).toBe(MAX_BODY);
  });
  it('add validates, assigns an id and refuses past the limit', () => {
    expect(addCanned([], { title: '', body: 'x' }).ok).toBe(false);
    expect(addCanned([], { title: 'x', body: '  ' }).errors.body).toBe('canned.errors.bodyRequired');
    const r = addCanned([], { title: ' Greeting ', body: ' Hello! ' }, () => 'id1');
    expect(r).toMatchObject({ ok: true, list: [{ id: 'id1', title: 'Greeting', body: 'Hello!' }] });
    const full = Array.from({ length: MAX_CANNED }, (_, i) => ({ id: `i${i}`, title: 't', body: 'b' }));
    expect(addCanned(full, { title: 'x', body: 'y' }, () => 'new').errors.title).toBe('canned.errors.limit');
  });
  it('update and remove', () => {
    const list = [{ id: 'a', title: 'A', body: 'a' }, { id: 'b', title: 'B', body: 'b' }];
    expect(updateCanned(list, 'a', { title: 'AA', body: 'aa' }).list[0]).toEqual({ id: 'a', title: 'AA', body: 'aa' });
    expect(updateCanned(list, 'a', { title: '', body: 'aa' }).ok).toBe(false);
    expect(updateCanned(list, 'zzz', { title: 'x', body: 'y' }).ok).toBe(false);
    expect(removeCanned(list, 'a')).toEqual([list[1]]);
    expect(removeCanned(list, 'zzz')).toEqual(list);
  });
  it('filter matches title or body, case-insensitively', () => {
    const list = [{ id: 'a', title: 'Refund info', body: 'We will refund' }, { id: 'b', title: 'Hello', body: 'Welcome' }];
    expect(filterCanned(list, 'REFUND').map(r => r.id)).toEqual(['a']);
    expect(filterCanned(list, 'welc').map(r => r.id)).toEqual(['b']);
    expect(filterCanned(list, '  ').length).toBe(2);
  });
});
